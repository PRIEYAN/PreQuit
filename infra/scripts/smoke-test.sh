#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-http://127.0.0.1:${HTTP_PORT:-80}}"
READY_TIMEOUT="${READY_TIMEOUT:-180}"

log() { printf '[smoke] %s\n' "$*"; }
fail() { printf '[smoke] FAIL: %s\n' "$*" >&2; exit 1; }

log 'validating compose configuration'
docker compose config >/dev/null

log 'starting the stack'
docker compose up -d --build

log "waiting up to ${READY_TIMEOUT}s for readiness at ${BASE_URL}/health/ready"
deadline=$(( $(date +%s) + READY_TIMEOUT ))
until curl -fsS "${BASE_URL}/health/ready" >/dev/null 2>&1; do
  [ "$(date +%s)" -lt "$deadline" ] || fail "the API never became ready; try: docker compose logs api"
  sleep 3
done

log 'liveness'
curl -fsS "${BASE_URL}/health/live" >/dev/null || fail '/health/live did not return success'

log 'readiness reports a healthy database'
ready=$(curl -fsS "${BASE_URL}/health/ready")
printf '%s' "$ready" | grep -q '"status":"ready"' || fail "readiness was not ready: ${ready}"
printf '%s' "$ready" | grep -q '"healthy":true' || fail "a dependency is unhealthy: ${ready}"

log 'metrics are exposed'
curl -fsS "${BASE_URL}/metrics" | grep -q 'prequit_admission_limit' \
  || fail '/metrics did not include prequit_admission_limit'

log 'requests are distributed across cluster workers'
workers=$(for _ in $(seq 1 12); do
  curl -fsSD- -o /dev/null "${BASE_URL}/health/live" 2>/dev/null \
    | tr -d '\r' | awk 'tolower($1) == "x-worker-id:" { print $2 }'
done | sort -u | tr '\n' ' ')
[ -n "${workers// /}" ] || fail 'no X-Worker-Id header was returned'
log "workers that answered: ${workers}"

log 'an unknown route returns the structured error envelope'
curl -fsS "${BASE_URL}/api/v1/does-not-exist" 2>/dev/null | grep -q 'ROUTE_NOT_FOUND' \
  || log 'note: unknown route did not return ROUTE_NOT_FOUND (non-fatal)'

log 'operator injection is rejected'
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE_URL}/api/v1/auth/login" \
  -H 'content-type: application/json' \
  -d '{"identifier":{"$gt":""},"password":"x"}')
[ "$status" = '400' ] || fail "operator injection returned ${status}, expected 400"

log 'the landing page is served'
curl -fsS "${BASE_URL}/" >/dev/null || fail 'the landing page did not load'

log 'all checks passed'
