# PreQuit — mobile client

**Eye of Internet.** PreQuit is an interest-graph social app whose feed explains
itself: every post card tells you *why* it reached you.

This repository is the React Native client for Android and iOS. The API it talks
to lives in [PreQuitBackend](https://github.com/PRIEYAN/PreQuitBackend).

---

## Screens

> **These are rendered reconstructions, not device captures.** Each one is drawn
> from this repository's own `src/theme/index.js`, the component stylesheets and
> the fixture data in `src/screens/**/mock*.js`, so the colours, radii, spacing
> and copy match what the implemented components specify. Regenerate them with
> `python3 ../scripts/make_screenshots.py`.

| | | |
|:--:|:--:|:--:|
| <img src="docs/screenshots/splash.png" width="230"> | <img src="docs/screenshots/signin.png" width="230"> | <img src="docs/screenshots/signup.png" width="230"> |
| **Splash** — orbital mark, restores the stored session | **Sign In** — expands out of the pressed button | **Sign Up** — handle, e-mail, date of birth, password |
| <img src="docs/screenshots/search.png" width="230"> | <img src="docs/screenshots/feed.png" width="230"> | <img src="docs/screenshots/friends.png" width="230"> |
| **Home** — search and topic discovery | **Social** — the ranked feed, with reason pills | **Friends** — graph and request inbox |
| <img src="docs/screenshots/dm.png" width="230"> | <img src="docs/screenshots/profile.png" width="230"> | |
| **Direct message** — opens only between mutuals | **Profile** — counters and account actions | |

---

## What it does

- **Three ranked surfaces.** *For You* blends your follow graph with your
  interest profile; *Explore* widens the pool; *Trending* favours very recent
  popularity. The server uses a different freshness half-life for each (18 h /
  36 h / 6 h).
- **Every card explains itself.** The server returns the single
  highest-contributing ranking signal with each post, and `PostCard` renders it
  as a pill — *"From an account you engage with"*, *"Matches your interests"*,
  *"Popular with people like you"*. It is read out of the score breakdown, so it
  cannot disagree with the ranking it describes.
- **Optimistic engagement.** Likes and saves apply instantly and roll back to
  the exact previous item if the request fails.
- **Resilient sessions.** Access tokens refresh transparently on expiry;
  concurrent failures share one refresh call; a network failure keeps you signed
  in rather than ejecting you to a login screen you cannot complete offline.
- **Mutual-follow messaging.** A conversation opens only when both people follow
  each other — enforced on the server, not in the UI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  screens/          12 screens across 5 groups           │
│  components/       PostCard · GlassTabBar · CommentSheet │
├─────────────────────────────────────────────────────────┤
│  navigation/       native stack  +  4-tab shell          │
│  state/            AuthContext — session lifecycle       │
│  hooks/            useFeed — surface load + optimistic    │
├─────────────────────────────────────────────────────────┤
│  api/              endpoints → client → tokens → fetch   │
└─────────────────────────────────────────────────────────┘
                            │  HTTPS + Bearer (RS256)
                            ▼
                     PreQuitBackend API
```

### The API layer

A screen never builds a URL. It calls a named function on `endpoints.js`, whose
function list mirrors the server's route table exactly. That calls `client.js`,
which:

- attaches the access token and aborts the request after **15 s**;
- unwraps the server's `{ data: … }` envelope **once**, centrally;
- converts a failure into an `ApiError` carrying the server's own code, so a
  screen branches on `EMAIL_NOT_VERIFIED` rather than matching on message text;
- on a `401`, refreshes the session and replays the original request **once**.

The refresh is single-flight. A feed screen commonly fires several requests at
once; if each detected its own `401` and started its own refresh, all but the
first would present an already-rotated refresh token, which the server correctly
treats as replay — signing you out precisely when the client was trying to keep
you signed in. `client.js` memoises the refresh promise so concurrent failures
await one call. There is a test for exactly this.

### Project structure

```
src/
├── api/            client.js · endpoints.js · tokens.js · config.js
├── state/          AuthContext.jsx
├── hooks/          useFeed.js
├── navigation/     RootNavigator.jsx · MainTabs.jsx · routes.js
├── screens/
│   ├── splash/
│   ├── auth/       onBoard · signin · signup · resetpassword
│   ├── dashboard/  feed · search
│   ├── friends/    friends · request · dm
│   └── profile/    personal · settings
├── components/     PostCard · GlassTabBar · CommentSheet
└── theme/          COLORS · IMPACT_FONT · TAB_BAR_SPACE
```

---

## Getting started

### Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Node.js | ≥ 22.11 | everything |
| JDK | 17 | Android builds |
| Android SDK | compileSdk 36, minSdk 24 | Android builds |
| Xcode + CocoaPods | 15+, iOS 15.1+ | iOS builds (macOS only) |

### Install and run

```sh
npm install

# iOS only — install the native pods
bundle install && bundle exec pod install --project-directory=ios

npm start                 # terminal 1 — Metro
npm run android           # terminal 2   (or: npm run ios)
```

### Pointing at the API

`src/api/config.js` resolves the host per platform, because `localhost` means
something different in each runtime:

| Platform | Host | Why |
|---|---|---|
| Android emulator | `10.0.2.2:4000` | `localhost` inside the emulator *is* the emulator |
| iOS simulator | `localhost:4000` | shares the host loopback |

For a **physical device**, put your machine's LAN address there:

```js
const DEV_HOST = 'http://192.168.1.42:4000';
```

The server already listens on `0.0.0.0`, so nothing changes server-side — just
open port 4000 on your firewall.

---

## Testing

```sh
npm test
```

**23 tests across 4 suites, all passing.**

| Suite | Covers |
|---|---|
| `client.test.js` | envelope unwrap, typed errors, single-flight refresh, replay, 204 handling |
| `useFeed.test.js` | surface selection, optimistic like/save, rollback, count floor |
| `DM.test.js` | per-thread isolation, unknown chat, default title |
| `App.test.tsx` | root render smoke test |

---

## Current status

Implemented and tested:

- ✅ All 12 screens, navigation shell and the custom animated tab bar
- ✅ `api/` transport layer, token storage, `AuthContext`, `useFeed` — 23 passing tests

Outstanding:

- ⚠️ **The screens are not yet bound to the live API.** Feed, Search, Friends and
  DM still render from the fixture modules under `src/screens/**/mock*.js`, and
  `App.tsx` does not yet mount `AuthProvider`. The work remaining is to replace
  each screen's fixture import with the corresponding hook and wrap the navigator
  in the provider — no new server capability is required.
- ⚠️ No performance measurement has been taken (cold start, scroll frame rate,
  bundle size), so none is claimed.

---

## Related

- **API:** [PreQuitBackend](https://github.com/PRIEYAN/PreQuitBackend) — Fastify +
  TypeScript + MongoDB, 66 endpoints, the feed ranking engine
- **Setup guide:** [`START.md`](START.md) — runs both halves from a clean checkout
