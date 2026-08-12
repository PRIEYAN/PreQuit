# PreQuit — setup guide

PreQuit is an interest-graph social app: a Fastify + MongoDB API with a ranked
feed, and a React Native client. This is everything needed to get both running
from a clean checkout.

The two halves live in separate repositories:

| Directory          | Repository                                 | What it is                       |
| ------------------ | ------------------------------------------ | -------------------------------- |
| `preQuitBackend/`  | `github.com/PRIEYAN/PreQuitBackend`        | Fastify API, MongoDB, feed ranker |
| `PreQuit/`         | `github.com/prieyan/prequit`               | React Native app (Android + iOS)  |

---

## 1. Prerequisites

| Tool        | Version   | Notes                                              |
| ----------- | --------- | -------------------------------------------------- |
| Node.js     | >= 22.11  | Both projects declare this in `engines`.            |
| MongoDB     | >= 7.0    | **Must run as a replica set** — see below.          |
| JDK         | 17        | Android builds only.                                |
| Android SDK | API 34+   | Android builds only.                                |
| Xcode       | 15+       | iOS builds only (macOS).                            |
| Docker      | optional  | Easiest way to get Mongo + Redis + a mail catcher.  |

> **Why a replica set?** The API writes through a transactional unit of work, and
> MongoDB only supports multi-document transactions on a replica set. A standalone
> `mongod` will connect and then fail on the first write. A single-node replica set
> is fine for development.

---

## 2. Start MongoDB

### Option A — Docker (recommended)

```bash
cd preQuitBackend/server
docker compose up -d
```

This starts `mongodb-atlas-local` (Mongo with Atlas Search), Redis, and MailHog
(a mail catcher on <http://localhost:8025>). Because this image includes Atlas
Search, you can set `SEARCH_BACKEND=atlas`.

### Option B — Local `mongod`, no Docker

```bash
mkdir -p ~/.local/prequit-mongo/data
mongod --dbpath ~/.local/prequit-mongo/data --replSet rs0 --port 27017 --bind_ip 127.0.0.1
```

Then, once, in a second terminal:

```bash
mongosh --port 27017 --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "127.0.0.1:27017"}]})'
```

Confirm it became primary:

```bash
mongosh --quiet --port 27017 --eval 'db.hello().isWritablePrimary'   # → true
```

A plain `mongod` has no Atlas Search engine, so keep `SEARCH_BACKEND=basic`
(the default in `.env.example`).

---

## 3. Backend

```bash
cd preQuitBackend/server
npm install
cp .env.example .env
```

The defaults in `.env.example` are already set up for a local replica set
(`PERSISTENCE_BACKEND=mongo`, `SEARCH_BACKEND=basic`). In development the API
generates an ephemeral RS256 keypair at boot, so no key setup is needed to
start — see [Production](#7-production) before deploying.

Create the indexes, then seed:

```bash
npm run db:sync-indexes
npm run db:seed
```

The seed creates six topics, five verified users, a full follow graph, twenty
posts, and likes — enough for the ranker to produce a meaningfully ordered feed.
Every seeded account uses the password `correct horse battery staple`:

```
nova@example.com   atlas@example.com   rio@example.com
sage@example.com   mira@example.com
```

Start the API:

```bash
npm run dev          # http://localhost:4000
```

Check it:

```bash
curl -s http://localhost:4000/api/v1/feed/trending | head -c 200
```

### Backend commands

| Command                   | What it does                                        |
| ------------------------- | --------------------------------------------------- |
| `npm run dev`             | API with reload on change                           |
| `npm run dev:worker`      | Background worker (enrichment, outbox delivery)     |
| `npm run dev:scheduler`   | Periodic jobs (quality scores, interest profiles)   |
| `npm run db:sync-indexes` | Create/update all MongoDB indexes — idempotent      |
| `npm run db:seed`         | Seed demo data — idempotent, tops up what's missing |
| `npm test`                | Full suite (integration tests need Mongo running)   |
| `npm run typecheck`       | TypeScript, no emit                                 |
| `npm run build`           | Compile to `dist/`                                  |

---

## 4. Mobile app

```bash
cd PreQuit
npm install
```

**iOS only** — install the native pods:

```bash
bundle install && bundle exec pod install --project-directory=ios
```

Start Metro in one terminal, then build in another:

```bash
npm start                 # terminal 1
npm run android           # terminal 2  (or: npm run ios)
```

### Pointing the app at the API

`src/api/config.js` resolves the host per platform:

| Platform          | Host              | Why                                              |
| ----------------- | ----------------- | ------------------------------------------------ |
| Android emulator  | `10.0.2.2:4000`   | `localhost` inside the emulator is the emulator  |
| iOS simulator     | `localhost:4000`  | Shares the host loopback                         |

For a **physical device**, both must be on the same network — set the host to
your machine's LAN IP in `src/api/config.js`:

```js
const DEV_HOST = 'http://192.168.1.42:4000';   // your machine's IP
```

The API already listens on `0.0.0.0`, so no server-side change is needed — just
make sure your firewall allows port 4000.

---

## 5. Try it end to end

1. Launch the app — the splash checks for a stored session, then offers
   **Login** / **Create New Account**.
2. Sign in with `nova@example.com` / `correct horse battery staple`.
3. The **For You** tab loads the ranked feed. Each card shows a "why am I
   seeing this" pill — the ranking reason the algorithm chose.
4. Switch between **For You**, **Explore**, and **Trending** to compare
   surfaces. Pull to refresh. Like and save update instantly and roll back if
   the request fails.

New accounts you create yourself must verify their email first. The dev mail
sender logs the link to the API console; copy the `token=` value from the log
and POST it:

```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-email \
  -H 'Content-Type: application/json' -d '{"token":"<token from the log>"}'
```

With Docker, open MailHog at <http://localhost:8025> instead.

---

## 6. How the feed works

The feed is assembled per request, not precomputed:

1. **Candidate sourcing** — posts are gathered in parallel from the accounts you
   follow, your interest vector, your topic affinities, co-engagement
   neighbours, and trending.
2. **Scoring** — each candidate gets six weighted signals: semantic relevance
   (cosine against your interest embedding), author affinity, topic affinity,
   content quality, freshness (half-life decay), and social proof. Weights live
   in `RankingConfig` and must sum to 1.0.
3. **Diversity** — a greedy re-rank caps how many slots one author or topic can
   take, so a single prolific account cannot own your feed.
4. **Explanation** — the highest-contributing signal becomes the reason shown
   on the card.

Cold-start accounts have no interest profile, so quality and freshness dominate
and **Explore**/**Trending** carry the experience until there is history to
personalise on.

Tunables are in `.env` (`FEED_*`) and `src/domain/ranking/RankingConfig.ts`.

---

## 7. Production

Development conveniences that **must** change before deploying:

- **JWT keys.** Dev generates an ephemeral RS256 keypair each boot, which means
  every restart invalidates all tokens. Production refuses to start without real
  keys:

  ```bash
  openssl genrsa -out private.pem 2048
  openssl rsa -in private.pem -pubout -out public.pem
  ```

  Set `JWT_PRIVATE_KEY_PEM` and `JWT_PUBLIC_KEY_PEM` (base64 the PEM, or escape
  newlines as `\n`).

- **`NODE_ENV=production`** — enforces the key requirement above.
- **`CURSOR_HMAC_SECRET`** — change from the dev placeholder; it signs pagination
  cursors.
- **Media.** Without Cloudinary credentials the API uses a local stub that issues
  fake upload URLs. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET` for real uploads.
- **Email.** `EMAIL_PROVIDER=console` only logs. Set it to `smtp` with `SMTP_URL`
  so verification and password-reset mail actually sends.
- **Search.** `SEARCH_BACKEND=basic` uses regex and in-process cosine — correct,
  but it scans a bounded window and its relevance is weaker. On Atlas, create the
  search indexes named in `.env` and set `SEARCH_BACKEND=atlas`.
- **Run the workers.** `npm run start:worker` and the scheduler are separate
  processes; without them posts never get embeddings, so semantic ranking stays
  inert.

Build and run:

```bash
npm run build
NODE_ENV=production node dist/main/api.js
```

A `Dockerfile` is included in `preQuitBackend/server/`.

---

## 8. Troubleshooting

**`Transaction numbers are only allowed on a replica set member or mongos`**
Mongo is running standalone. Restart it with `--replSet rs0` and run
`rs.initiate(...)` (step 2).

**API starts but every write 500s**
Check the log line at boot: it prints `persistence: "mongo"` or `"memory"`. If it
says `memory`, `PERSISTENCE_BACKEND` was not picked up from `.env`.

**App shows "Can't reach the server"**
The emulator cannot resolve `localhost`. Confirm `src/api/config.js` uses
`10.0.2.2` on Android, and that the API is actually up
(`curl http://localhost:4000/api/v1/feed/trending`).

**Feed is empty after signing in**
Run `npm run db:seed`. Note the **For You** tab only shows posts from accounts
you follow — a brand-new account should look at **Explore** or **Trending**.

**`$search is not allowed` / search returns nothing**
`SEARCH_BACKEND=atlas` against a non-Atlas Mongo. Set it to `basic`.

**Android build fails on a stale native cache**
`cd android && ./gradlew clean && cd .. && npm run android`
