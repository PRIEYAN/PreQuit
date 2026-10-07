# Infrastructure

nginx, Docker Compose and the Jenkins pipeline for the whole stack.

```
infra/
├── docker-compose.yml      full stack: mongodb, api, worker, scheduler, nginx, mailhog
├── .env.example            copy to .env; compose reads it automatically
├── nginx/
│   ├── nginx.conf          global tuning and JSON access logs
│   └── conf.d/
│       ├── upstream.conf   the API upstream and its keepalive pool
│       └── api.conf        server block: static, /api/, websockets, health, metrics
├── jenkins/Jenkinsfile     checks out both repositories and runs every gate
└── scripts/
    ├── bootstrap.sh        first run: keypair, stack, indexes, seed data
    └── smoke-test.sh       asserts the running stack actually works
```

## First run

```bash
cd infra
./scripts/bootstrap.sh
```

It creates `.env` from the example, generates a local RS256 keypair if one is not
set, starts the stack, syncs indexes and seeds demo data. The app is then on
`http://localhost` and captured mail on `http://localhost:8025`.

Seeded accounts: `nova`, `atlas`, `rio`, `sage`, `mira` — password
`correct horse battery staple`.

## Day to day

```bash
docker compose up -d --build     # start or rebuild
docker compose ps                # what is running
docker compose logs -f api       # follow the API
docker compose down              # stop
docker compose down -v           # stop and drop the database volume
./scripts/smoke-test.sh          # assert the stack is healthy
```

## Services

| Service | Purpose | Notes |
| --- | --- | --- |
| `mongodb` | Database | Started with `--replSet rs0`; transactions require a replica set |
| `mongo-init` | One-shot | Initiates the replica set, then exits |
| `api` | HTTP API | Cluster primary plus workers; only nginx reaches it |
| `worker` | Outbox drain | Turns domain events into notifications and interest updates |
| `scheduler` | Repeatable jobs | Must stay at one replica |
| `nginx` | Edge | TLS termination point, static assets, reverse proxy |
| `mailhog` | Mail capture | Development only |

`api` is `expose`d rather than published, so it is reachable only from inside the
compose network. Everything enters through nginx.

## nginx

Deliberately plain, as requested — no rate limiting. The remaining configuration is
the part the application depends on being correct:

- **`X-Forwarded-For` and `X-Forwarded-Proto`** are set, and the API runs with
  `HTTP_TRUST_PROXY=true`. Without this every client appears to come from the proxy's
  address and the API's rate limiter buckets them all together.
- **`X-Request-Id`** is forwarded so one id ties the nginx access log to the API log
  line and to the error returned to the client. The API echoes it back, along with
  `X-Worker-Id`.
- **Upstream keepalive** (64 idle connections, `proxy_http_version 1.1`, `Connection ""`)
  avoids a TCP handshake per request. nginx's `keepalive_timeout` is 65s and the API's
  is 72s — the API's must be the longer of the two, or nginx will reuse a socket the
  API is in the middle of closing and the client sees a spurious 502.
- **`proxy_next_upstream`** retries once on a connection error or 5xx, bounded by
  `proxy_next_upstream_tries 2`. Retrying harder turns a struggling backend into an
  overwhelmed one.
- **`Retry-After` is passed through** so a client that is shed by the admission
  controller or rate limited is told when to come back.
- **`/socket.io/`** has the upgrade headers, a 7-day read timeout and buffering off.
  Socket.IO is websocket-only, so no sticky session is needed.
- **`/metrics`** is restricted to private address ranges.
- **Health endpoints** have access logging off so probes do not drown the log.

### Known limitation

The `upstream` block resolves `api` once at startup. If the API container is replaced
while nginx keeps running, nginx holds the old address. `docker compose up -d` recreates
both, so this only bites if the API container is restarted on its own — in which case
restart nginx too. The alternative, a `resolver` with a variable `proxy_pass`, re-resolves
per request but bypasses the upstream keepalive pool, which costs more than it saves here.

## Jenkins

`jenkins/Jenkinsfile` is a declarative pipeline. Point a Multibranch or Pipeline job at
this repository with the script path `infra/jenkins/Jenkinsfile`.

Because the client and the API are separate repositories, the pipeline checks out both:
`scm` for the client, and `BACKEND_REPO_URL` / `BACKEND_BRANCH` for the API.

Stages: checkout → install (parallel) → static analysis (four parallel gates) → test
(parallel) → optional integration tests → build → images → stack smoke test on `main`
and `dev-test`.

| Parameter | Default | Purpose |
| --- | --- | --- |
| `BACKEND_REPO_URL` | the API repository | Where to clone the API from |
| `BACKEND_BRANCH` | `production-hardening` | Which API branch to build |
| `RUN_INTEGRATION_TESTS` | `false` | Off by default; needs a MongoDB replica set |
| `BUILD_IMAGES` | `true` | Build container images after the gates pass |

Lint runs with `--max-warnings 0` in both repositories: a warning that nobody fixes is
a warning nobody reads.

Integration tests are off by default because they need a live database. The remaining
suites cover the same code paths against fakes, so the default pipeline is fast and
deterministic.

## Container image

The API image is a four-stage build ending in distroless `nonroot`:

1. `deps` — all dependencies, for compiling
2. `build` — `tsc` plus path rewriting
3. `runtime-deps` — `npm ci --omit=dev`, production dependencies only
4. `runtime` — distroless with just `dist`, production `node_modules` and
   `package.json`

Separating the runtime dependencies matters: copying the build stage's `node_modules`
shipped TypeScript, Vitest and ESLint into production and made the image 696MB. It is
now 287MB. Distroless has no shell and no package manager, and `nonroot` means the
process does not run as uid 0.

## Moving to Kubernetes later

The pieces that transfer directly: the health endpoints map to liveness and readiness
probes, `/metrics` to a ServiceMonitor, `SIGTERM` handling to `terminationGracePeriodSeconds`,
and the three process types to three Deployments — with the scheduler pinned to one
replica.

The piece that does not: the cluster message bus coordinates cache, presence and rate
limiting over process IPC, which does not cross pods. Multi-pod deployment needs the
Redis implementations of those ports, which are already written against the same
interfaces. See `PreQuitDocs/mainDocs/load-balancing.md`.
