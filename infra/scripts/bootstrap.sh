#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

log() { printf '[bootstrap] %s\n' "$*"; }

if [ ! -f .env ]; then
  log 'creating infra/.env from the example'
  cp .env.example .env
fi

if ! grep -q '^JWT_PRIVATE_KEY_PEM=.\+' .env; then
  log 'generating an RS256 keypair for local use'
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  openssl genrsa -out "$tmp/private.pem" 2048 2>/dev/null
  openssl rsa -in "$tmp/private.pem" -pubout -out "$tmp/public.pem" 2>/dev/null

  private=$(base64 -w0 < "$tmp/private.pem")
  public=$(base64 -w0 < "$tmp/public.pem")

  sed -i.bak \
    -e "s|^JWT_PRIVATE_KEY_PEM=.*|JWT_PRIVATE_KEY_PEM=${private}|" \
    -e "s|^JWT_PUBLIC_KEY_PEM=.*|JWT_PUBLIC_KEY_PEM=${public}|" \
    .env
  rm -f .env.bak
  log 'keypair written to infra/.env'
fi

log 'starting the stack'
docker compose up -d --build

log 'syncing indexes'
docker compose run --rm --entrypoint /nodejs/bin/node api dist/main/cli/syncIndexes.js

log 'seeding demo data'
docker compose run --rm --entrypoint /nodejs/bin/node api dist/main/cli/seed.js

log "done. App: http://localhost:${HTTP_PORT:-80}  Mail: http://localhost:${MAILHOG_UI_PORT:-8025}"
