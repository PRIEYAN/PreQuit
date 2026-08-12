# PreQuit Backend — Implementation Specification

> **Audience:** an engineer or coding agent implementing the backend from zero.
> **Mandate:** Node.js + TypeScript, Clean Architecture, strict SOLID compliance.
> This document is normative. Where it says MUST, it is a hard requirement.
> Where it says SHOULD, deviation requires a written justification in the PR.

---

## Table of Contents

1. [Product Definition](#1-product-definition)
2. [Non-Functional Requirements](#2-non-functional-requirements)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [SOLID Enforcement Rules](#5-solid-enforcement-rules)
6. [Repository & Folder Structure](#6-repository--folder-structure)
7. [Domain Model](#7-domain-model)
8. [Database Schema (MongoDB Atlas)](#8-database-schema-mongodb-atlas)
9. [Ports (Interfaces)](#9-ports-interfaces)
10. [Use Case Catalog](#10-use-case-catalog)
11. [HTTP API Conventions](#11-http-api-conventions)
12. [Endpoint Reference](#12-endpoint-reference)
13. [Realtime (WebSocket) Protocol](#13-realtime-websocket-protocol)
14. [The Feed Ranking Engine](#14-the-feed-ranking-engine)
15. [The Search & Expertise Engine](#15-the-search--expertise-engine)
16. [Media Pipeline (Cloudinary)](#16-media-pipeline-cloudinary)
17. [Domain Events & Background Jobs](#17-domain-events--background-jobs)
18. [Security](#18-security)
19. [Observability & Error Handling](#19-observability--error-handling)
20. [Testing Strategy](#20-testing-strategy)
21. [Configuration](#21-configuration)
22. [Local Development & Deployment](#22-local-development--deployment)
23. [Implementation Milestones](#23-implementation-milestones)
24. [Appendix A — Error Codes](#appendix-a--error-codes)
25. [Appendix B — Tunable Constants](#appendix-b--tunable-constants)

---

## 1. Product Definition

### 1.1 One-paragraph summary

PreQuit is an interest-graph social platform. Users publish **posts** — one or more
images plus a text description — which are organised by **topics** and **hashtags**.
Other users discover those posts through a **personalised home feed** and through a
**semantic search engine**. Users can like, comment, save, and share posts. Users
follow each other; when two users follow each other (a **mutual**), a private
**direct-message conversation** becomes available between them. The differentiating
capability is intent understanding: the platform builds a continuously-updated
interest profile per user from what they publish and engage with, and it can answer a
natural-language problem statement with both the posts that solve that problem and
the people who have demonstrated competence in it.

### 1.2 Core functional pillars

Each pillar below is a first-class subsystem with its own use cases, storage, and
background jobs. They are listed in dependency order.

**P1 — Identity & Account Lifecycle.**
Registration with username (immutable handle), display name, email, password, and
date of birth. Date of birth gates a minimum-age policy (13 years; configurable) and
is never exposed publicly. Email verification is required before a user can publish
or message. Login issues a short-lived access token and a long-lived rotating refresh
token bound to a device. Users can enumerate and revoke active sessions, reset a
forgotten password by emailed token, change their password (which revokes all other
sessions), deactivate (soft, reversible for 30 days) and permanently delete their
account (hard, with a purge job).

**P2 — Profile & Social Graph.**
A profile carries handle, display name, bio, avatar, optional links, an
`isPrivate` flag, counters (posts / followers / following), and a set of declared
interest topics chosen at onboarding. The graph is **directed**: `A follows B` is
independent of `B follows A`.
- Following a **public** account takes effect immediately.
- Following a **private** account creates a pending **follow request** that the
  target accepts or rejects. Pending requests are the backing data for the app's
  request inbox.
- **Mutual** = both directions exist. Mutuality is the authorisation predicate for
  direct messaging and for sharing a post into a conversation.
- **Block** is symmetric in effect: it deletes both follow edges, deletes pending
  requests, hides all content in both directions, and disables messaging.
- **Mute** is asymmetric and silent: the muted user's posts are excluded from the
  muter's feed, but the follow edge and their ability to see content remain.

**P3 — Content Publishing.**
A post consists of 1–10 images (each with optional alt text), a description of up to
2,200 characters, extracted hashtags, an optional location label, and a visibility
setting (`public` | `followers`). Images are uploaded directly from the device to
Cloudinary using a short-lived server-generated signature; the post is only created after
the client confirms the uploads, so no request ever streams binary through the API. Posts are editable
(description, alt text, topics) for their lifetime; edits are versioned in an audit
collection. Deletion is soft, followed by a purge job after 30 days. Every published post
is asynchronously enriched: image captioning/OCR, topic classification, embedding
generation, and search indexing.

**P4 — Engagement.**
Likes (idempotent, one per user per post), threaded comments (two levels: comment and
reply), comment likes, saves (private bookmarks organised in optional collections),
and shares. A **share** has three targets: into a direct-message conversation with a
mutual, as a copy-link token for outside the app, or as a repost onto the sharer's own
profile. Post authors may **pin** a comment and may mark a comment **helpful** — the
latter is a strong expertise signal (see P7). All engagement emits a domain event
consumed by the ranking and expertise subsystems.

**P5 — The Personalised Feed.**
The home feed is a multi-source retrieval-and-ranking pipeline, not a reverse-chronological
list. It draws candidates from the social graph, from vector similarity to the user's
interest profile, from topic affinity, from collaborative co-engagement neighbours, and
from a trending pool; it scores them with independently-testable signals; and it
re-ranks for diversity before serving. Full specification in
[§14](#14-the-feed-ranking-engine).

**P6 — Direct Messaging.**
One-to-one conversations, gated on mutuality at creation time and re-checked on every
send. Messages are text, image, or an embedded post share. Delivery states are
`sent → delivered → read`, per-recipient. Realtime transport is WebSocket; history is
paginated REST. Typing indicators, presence (`online` / `last seen`, honouring a
privacy setting), per-conversation mute, unread counts, message reactions, and
delete-for-me / delete-for-everyone (author, within 24h) are all in scope.

**P7 — Search & Expertise Discovery.**
A single query endpoint that classifies intent and returns three result classes:
matching **posts**, matching **people**, and matching **topics**. Retrieval is hybrid
— lexical full-text plus dense-vector — fused and re-ranked. For people, ranking is
driven by a per-user **per-topic expertise score** derived from the measured quality of
that user's contributions in the queried topic, so that a problem-shaped query
("my sourdough never rises") returns both the posts that address it and the users who
have repeatedly produced well-received content about it. Full specification in
[§15](#15-the-search--expertise-engine).

**P8 — Notifications.**
In-app notification records plus optional push, for: follow, follow request, request
accepted, like on post, comment on post, reply to comment, mention (`@handle` in a
description or comment), comment marked helpful, share of your post, and new message.
Notifications are aggregated (`"Nova and 12 others liked your post"`) within a
configurable window, are per-type mutable in preferences, and never fire for blocked
or muted actors.

**P9 — Trust & Safety.**
Reporting for posts, comments, users, and messages with a reason taxonomy. A
moderation queue with states `pending → actioned | dismissed`. Automated pre-checks on
publish (hash-based known-bad image matching, text classifier for the configured
prohibited categories). Enforcement actions: content removal, shadow-limit (content
excluded from discovery surfaces but visible to followers), temporary suspension,
permanent ban. Every action is written to an immutable audit log.

### 1.3 Explicit non-goals for v1

Group chats, video posts, live streaming, stories/ephemeral content, ads, monetisation,
federation, and public API keys for third parties. The architecture must not preclude
them, but no code is written for them.

---

## 2. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| Feed latency | p95 ≤ 250 ms for a cached page, ≤ 900 ms for a cold pipeline run |
| Search latency | p95 ≤ 400 ms end-to-end including embedding of the query |
| Write latency | p95 ≤ 150 ms for post/comment/like creation (enrichment is async) |
| Message delivery | p95 ≤ 150 ms actor-send to recipient-socket-receive |
| Availability | 99.9% monthly for read paths; degraded feed (trending only) is acceptable during ranking-store outage |
| Target scale (design for) | 1M users, 50M posts, 5k requests/sec peak, 200M interaction events |
| Statelessness | API processes MUST hold no session state; any instance serves any request. WebSocket fan-out goes through a Redis pub/sub adapter |
| Data residency | All user content in one region for v1; schema must not assume it |
| Backups | Atlas Continuous Cloud Backup with PITR, ≤ 5 min RPO; Cloudinary assets are the system of record for binaries and MUST have their auto-backup feature enabled |
| Migrations | Forward-only. Expand → migrate → contract across two releases; repositories tolerate the previous document shape for exactly one release (§8.10) |
| Cluster sizing | Working set must fit in RAM — that includes vector indexes, which are the largest single consumer. M30 minimum for production, with Search Nodes sized independently |
| Test coverage | ≥ 90% line coverage on `domain/` and `application/`; ≥ 70% overall |
| Cost discipline | Embedding calls MUST be cached by content hash; never re-embed unchanged text |

---

## 3. Technology Stack

Pinned choices. Substitutions are permitted only for items marked *swappable*, and only
by writing a new adapter behind the existing port.

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js ≥ 22.11 LTS | Matches the mobile client's engine requirement; native `fetch`, test runner, ESM |
| Language | TypeScript 5.8+, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` | Type safety is load-bearing for the port/adapter boundaries |
| HTTP framework | Fastify 5 | Fast, schema-first, first-class plugin encapsulation. *swappable* — it appears only in `infrastructure/http` |
| Validation | Zod 3 | Single source of truth for request schemas and generated OpenAPI |
| Database | **MongoDB Atlas**, cluster on MongoDB **8.0+** | Document model, plus Atlas Search (Lucene full-text) and Atlas Vector Search (HNSW ANN) in the same system as the operational data — no separate search cluster or vector DB. Requires 8.0+ for `$rankFusion` (§15.2) |
| Driver | Official `mongodb` Node driver v6 — **no ODM** | Mongoose's `Document`/`Model` types leak into every layer they touch, its middleware hides behaviour the use case should own, and `populate()` actively encourages the cross-aggregate joins §5 forbids. The raw driver returns plain objects, which is exactly what a mapper wants. *swappable* behind the repository ports |
| Document validation | Zod at the repository boundary + `$jsonSchema` collection validators | Zod gives fast, typed, friendly failures; the server-side validator is the backstop that replaces `NOT NULL`/`CHECK` (§8.9) |
| Migrations | `migrate-mongo` for data migrations; declarative index/search-index sync (§8.10) | Forward-only, ordered, reviewable. Index definitions live in code so they cannot drift from the queries that need them |
| Search | Atlas Search + Atlas Vector Search, with dedicated **Search Nodes** in production | Isolates Lucene query load from the operational workload so a heavy search does not slow down writes |
| Cache / ephemeral | Redis 7 | Feed page cache, seen-sets, rate limits, presence, pub/sub, job queue backend |
| Job queue | BullMQ | Retries, backoff, repeatable (cron) jobs, priorities |
| Realtime | `socket.io` 4 + `@socket.io/redis-adapter` | Rooms, ack callbacks, reconnection, horizontal fan-out. *swappable* behind `RealtimeGateway` |
| Media storage + CDN | **Cloudinary**, via the official `cloudinary` npm package (v2 SDK, `cloudinary.v2`) | Signed direct-from-client upload, on-the-fly transformations, global CDN delivery, and built-in moderation/analysis add-ons. Replaces a raw object store *and* the thumbnail worker. *swappable* behind `MediaStorage` |
| Image processing | Cloudinary named transformations (no server-side image library) | Variants are generated lazily by URL and cached at the edge. `sharp` is **not** a dependency; the API never buffers image bytes |
| Embeddings | Local ONNX sentence-encoder (default `bge-base-en-v1.5`, 768-d) with a hosted-provider adapter as an alternative | Cost control and no external dependency in dev. *swappable* behind `EmbeddingProvider` |
| Image understanding | Captioning + OCR worker (BLIP-class captioner + Tesseract or a hosted vision endpoint) | Produces text for image content so it participates in search and ranking. *swappable* behind `ImageUnderstandingProvider` |
| Password hashing | `argon2` (argon2id) | Memory-hard |
| Tokens | `jose` — RS256 JWT access tokens, opaque random refresh tokens | Asymmetric verification allows read-only verifiers |
| Email | Provider adapter (SES / Resend / SMTP), templated | *swappable* behind `EmailSender` |
| Push | FCM + APNs adapters | *swappable* behind `PushSender` |
| Logging | `pino` with request-scoped child loggers | Structured JSON |
| Tracing / metrics | OpenTelemetry SDK → OTLP; Prometheus scrape endpoint | Spans across HTTP → use case → repository → job |
| Testing | `vitest` (unit + integration), `supertest` (HTTP e2e), `testcontainers` with the `mongodb/mongodb-atlas-local` image + Redis | The Atlas Local image bundles `mongot`, so integration tests exercise **real** Atlas Search and Vector Search. A plain `mongo` container cannot run `$search` or `$vectorSearch` at all, which would leave the two most important queries in this system untested |
| Lint / format | ESLint (`@typescript-eslint`, `eslint-plugin-boundaries`) + Prettier | `eslint-plugin-boundaries` mechanically enforces the dependency rule |
| API docs | `@fastify/swagger` generated from Zod schemas | Docs cannot drift from validation |
| Container | Multi-stage Docker; distroless runtime | |

---

## 4. Architecture

### 4.1 Layers and the dependency rule

Four concentric layers. **Source-code dependencies point inward only.** A module MUST
NOT import from a layer outside itself. This is enforced by `eslint-plugin-boundaries`
and by a CI check; a violating build fails.

```
┌──────────────────────────────────────────────────────────────────┐
│  main/            composition root: reads config, builds the     │
│                   container, starts HTTP + WS + workers          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  infrastructure/   adapters implementing application ports │  │
│  │                    (MongoDB, Redis, Cloudinary, socket.io, │  │
│  │                    ONNX, Fastify controllers & routes)     │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  application/   use cases, DTOs, port interfaces,     │  │  │
│  │  │                 orchestration, transaction boundaries │  │  │
│  │  │  ┌────────────────────────────────────────────────┐  │  │  │
│  │  │  │  domain/   entities, value objects, invariants, │  │  │  │
│  │  │  │            domain services, domain events,      │  │  │  │
│  │  │  │            repository interfaces, domain errors  │  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**`domain/`** — Pure TypeScript. Zero third-party imports; `zod` is *forbidden* here too.
ID generation is the only external capability it needs, and it is injected via `IdGenerator`,
so `ObjectId` never appears in this layer — identifiers are domain value objects wrapping a
string. No `async` in entity methods. No queries, no HTTP, no JSON shapes from the wire.
Contains business rules that would be true regardless of how the system is delivered.

**`application/`** — One class per use case, each with a single public method
`execute(input): Promise<Output>`. Depends on `domain/` and on port interfaces it
declares itself. Owns the transaction boundary. Knows nothing about Fastify, the Mongo driver,
Redis, or Cloudinary. Returns DTOs, never entities.

**`infrastructure/`** — Every adapter. Repositories translate between BSON documents and
entities, in dedicated mappers — a document shape is a persistence concern and must never be
handed to a use case. Controllers translate between HTTP and use-case input/output. Nothing
here is imported by inner layers.

**`main/`** — The only place allowed to `new` a concrete adapter. Wires everything,
then hands off.

### 4.2 Control flow of a request

```
HTTP request
  → Fastify route (schema validation via Zod)
  → auth preHandler (verifies access token → AuthContext)
  → rate-limit preHandler
  → Controller  (maps validated body/params/auth → UseCase input DTO)
  → UseCase.execute()
        ├── loads entities via Repository ports
        ├── invokes domain methods (all invariants enforced here)
        ├── persists via Repository ports inside UnitOfWork.run()
        └── appends domain events to the transactional outbox
  → Controller maps Output DTO → HTTP response via a Presenter
  → error mapper converts DomainError → HTTP status + error code
Outbox publisher (separate loop) → BullMQ jobs → Workers → side effects
```

Side effects that are not required for the caller's correctness (embeddings,
notifications, counter denormalisation, search indexing, push) MUST happen in workers,
never inline in the request.

### 4.3 Consistency model

**Read/write concerns.** All writes use `w: 'majority'`. Reads that a user could
immediately observe after their own write use `readConcern: 'majority'` with
`readPreference: 'primary'`; analytics and recompute jobs use `secondaryPreferred` so they
never compete with request traffic. The driver is configured with `retryWrites: true` and
`retryReads: true`, so a primary election during a deploy is invisible to the caller.

**Single-document atomicity is the primary tool.** MongoDB guarantees atomicity for a write
to one document, including `$inc`, `$push`, and `$set` combined in one update. Most
operations in this system are therefore transaction-free by design:

| Operation | Mechanism |
|---|---|
| Increment a counter | `$inc` on the post document |
| Like a post | `insertOne` on `likes` with a unique index; `E11000` means "already liked" |
| Open a conversation | `findOneAndUpdate(..., { upsert: true })` on the canonical pair |
| Aggregate a notification | `findOneAndUpdate` on `groupKey` with `$inc` + `$push` + `$slice` |
| Store an idempotency response | `insertOne` with the client key as `_id` |
| Record a message receipt | `$addToSet` into the message's embedded `receipts` |

**Multi-document transactions are reserved for invariants a user can observe being
violated.** Atlas is always a replica set, so transactions are available, but they cost
roughly double a plain write and hold locks. The complete list of places they are permitted:

- Accepting a follow request: insert the edge, resolve the request, upsert the mutual pair.
- Blocking: delete both follow edges, delete pending requests, delete the mutual pair, close
  the conversation.
- Publishing a post: insert the post and flip its media assets to `in_use`.
- Sending a message: insert the message and update the conversation's `lastMessage` and the
  recipient's `unreadCount`.
- **Any state change plus its outbox event** — this is the one non-negotiable case, because
  the whole event system's reliability rests on the event and the state change committing
  together.

Rules for transactions, all enforceable in review: no network I/O inside a transaction (no
embedding calls, no Cloudinary, no HTTP); target under 200 ms and never exceed the 60 s
server limit; retry on the `TransientTransactionError` label with jittered backoff; pass the
`ClientSession` to **every** operation inside, since an operation that forgets the session
silently runs outside the transaction — a bug no type checker will catch, which is why
`UnitOfWork` hands the session to repositories rather than letting call sites choose.

**Eventually consistent by design**, target lag ≤ 30 s: counters (advisory, reconciled
nightly), Atlas Search and Vector Search indexes (`mongot` follows the oplog, so a
just-written post is not instantly searchable — the API therefore never reads its own write
back through `$search`), ranking stores, expertise scores, and notifications.

**Transactional outbox** is mandatory for all events, as above. A publisher loop claims and
dispatches at-least-once, so every handler must be idempotent. Change streams were considered
as the alternative and rejected for the primary path: they give ordering and no polling, but
no per-event retry count, no dead-letter semantics, and resume-token management becomes the
application's problem. They are used in exactly one place — invalidating the Redis
relationship cache on `blocks` changes, where losing an event is harmless and latency matters.

---

## 5. SOLID Enforcement Rules

These are the concrete, checkable rules. A reviewer should be able to point at a line
and cite one.

### S — Single Responsibility

- One use case = one file = one class = one reason to change. `CreatePostUseCase` does
  not also send notifications; it emits `PostPublished` and a handler does.
- A repository persists and retrieves one aggregate. It MUST NOT contain business rules,
  and MUST NOT `$lookup` across aggregates for convenience; cross-aggregate reads go
  through a purpose-built **query service** (a separate port, e.g. `FeedQueryService`),
  which is allowed to write bespoke aggregation pipelines for read models. Pipelines live
  in `infrastructure/persistence/mongo/pipelines/`, one exported factory function each, so
  they can be unit-tested as data structures and explained with `explain('executionStats')`
  in isolation.
- Controllers only translate. A controller with an `if` about business state is a bug.
- Feed scoring signals are one class per signal. Adding a signal never edits an existing
  signal.

### O — Open/Closed

Extension points are explicit registries, not `switch` statements:

- `CandidateSource[]` — add a retrieval strategy by registering a new implementation.
- `RankingSignal[]` — add a scoring dimension the same way.
- `Reranker[]` — diversity, injection, and pinning rules compose in a chain.
- `SearchRetriever[]` and `ResultFuser` — add a retrieval channel without touching search orchestration.
- `NotificationChannel[]` — in-app, push, email.
- `DomainEventHandler[]` — subscribed by event name at composition time.
- `ModerationRule[]` — pre-publish checks.

A `switch` on a type discriminant is acceptable **only** in a mapper/serialiser at the
infrastructure boundary, and MUST be exhaustive with a `never` assertion.

### L — Liskov Substitution

- Every port has an in-memory implementation in `test/fakes/` used by unit tests. A
  fake and the real adapter MUST both pass the same **contract test suite** located at
  `test/contracts/<PortName>.contract.ts`. This is the primary defence: if the MongoDB
  repository throws a driver `E11000` where the fake returns `null`, the contract test
  catches it.
- Implementations MUST NOT strengthen preconditions (e.g. a repository that rejects a
  valid handle the interface allows) or weaken postconditions (e.g. returning unsorted
  results where order is specified).
- No `instanceof` checks on port implementations anywhere in `application/`.

### I — Interface Segregation

- Ports are narrow and role-based. There is no `IUserRepository` with 40 methods.
  Instead: `UserReader`, `UserWriter`, `FollowGraphReader`, `FollowGraphWriter`,
  `FollowRequestStore`, `BlockStore`, `UserSearchIndex`. A use case depends only on the
  roles it uses; `LoginUseCase` receives a `UserReader`, not a god-object.
- One concrete class MAY implement several role interfaces (e.g. `PgUserRepository
  implements UserReader, UserWriter`). That is fine — the segregation is on the
  *consumer's* side.

### D — Dependency Inversion

- All ports are declared in `application/ports/` (or `domain/repositories/` for
  aggregate persistence), i.e. **owned by the consumer**, never by the adapter.
- Constructor injection only. No service locator, no `container.get()` outside `main/`,
  no module-level singletons, no top-level `import { db }`.
- No decorator-based DI framework. The container is a hand-written composition function
  — explicit, type-checked, greppable, and trivially overridable in tests.
- `Clock`, `IdGenerator`, and `RandomSource` are injected ports. Code MUST NOT call
  `Date.now()`, `crypto.randomUUID()`, or `Math.random()` outside their adapters. This
  makes ranking and token logic deterministically testable.

---

## 6. Repository & Folder Structure

The backend lives in `server/` at the repository root, alongside the existing mobile
client.

```
server/
├── package.json
├── tsconfig.json                     # strict; path aliases @domain/* @app/* @infra/* @main/*
├── .eslintrc.cjs                     # includes eslint-plugin-boundaries layer rules
├── .env.example
├── Dockerfile
├── docker-compose.yml                # mongodb-atlas-local, redis, mailhog (media is Cloudinary)
├── migrate-mongo-config.js
├── migrations/                        # numbered data migrations, forward-only
│   └── 20260806-0001-seed-topics.ts
│
├── src/
│   ├── domain/
│   │   ├── shared/
│   │   │   ├── Entity.ts              # identity equality base
│   │   │   ├── AggregateRoot.ts       # collects uncommitted domain events
│   │   │   ├── ValueObject.ts         # structural equality base
│   │   │   ├── DomainEvent.ts
│   │   │   ├── DomainError.ts         # abstract: code, message, httpHint, details
│   │   │   ├── Result.ts              # Ok/Err for expected failures
│   │   │   └── Guard.ts               # invariant assertion helpers
│   │   │
│   │   ├── identity/
│   │   │   ├── User.ts                # aggregate root
│   │   │   ├── UserId.ts  Handle.ts  Email.ts  PasswordHash.ts  DateOfBirth.ts
│   │   │   ├── AccountStatus.ts        # pending_verification|active|suspended|deactivated|deleted
│   │   │   ├── Session.ts  RefreshTokenFamily.ts
│   │   │   ├── errors.ts               # HandleAlreadyTaken, InvalidCredentials, UnderageAccount, ...
│   │   │   ├── events.ts               # UserRegistered, EmailVerified, PasswordChanged, ...
│   │   │   └── repositories/           # UserReader, UserWriter, SessionStore, VerificationTokenStore
│   │   │
│   │   ├── social/
│   │   │   ├── FollowEdge.ts  FollowRequest.ts  Block.ts  Mute.ts
│   │   │   ├── RelationshipState.ts     # none|following|requested|mutual|blocked|blocked_by
│   │   │   ├── FollowPolicy.ts          # DOMAIN SERVICE: may A follow B? request or direct?
│   │   │   ├── MutualityPolicy.ts       # DOMAIN SERVICE: single source of truth for "can DM"
│   │   │   ├── errors.ts  events.ts
│   │   │   └── repositories/            # FollowGraphReader, FollowGraphWriter, FollowRequestStore, BlockStore, MuteStore
│   │   │
│   │   ├── content/
│   │   │   ├── Post.ts                  # aggregate root: media[], description, topics, visibility
│   │   │   ├── PostId.ts  Description.ts  Hashtag.ts  Mention.ts  MediaRef.ts
│   │   │   ├── Visibility.ts  PostStatus.ts   # draft|published|shadow_limited|removed|deleted
│   │   │   ├── MediaAsset.ts  AltText.ts
│   │   │   ├── Topic.ts  TopicId.ts  TopicAssignment.ts
│   │   │   ├── TextExtractor.ts          # DOMAIN SERVICE: description -> hashtags + mentions
│   │   │   ├── errors.ts  events.ts
│   │   │   └── repositories/
│   │   │
│   │   ├── engagement/
│   │   │   ├── Like.ts  Comment.ts  CommentId.ts  CommentBody.ts
│   │   │   ├── Save.ts  SaveCollection.ts
│   │   │   ├── Share.ts  ShareTarget.ts   # conversation | external_link | repost
│   │   │   ├── EngagementWeights.ts       # DOMAIN SERVICE: relative value of each action
│   │   │   ├── errors.ts  events.ts
│   │   │   └── repositories/
│   │   │
│   │   ├── messaging/
│   │   │   ├── Conversation.ts            # aggregate root; enforces exactly-2 participants
│   │   │   ├── Message.ts  MessageId.ts  MessageBody.ts  MessageKind.ts
│   │   │   ├── DeliveryState.ts  ReadReceipt.ts  Reaction.ts
│   │   │   ├── errors.ts  events.ts
│   │   │   └── repositories/
│   │   │
│   │   ├── ranking/
│   │   │   ├── InterestProfile.ts         # positive + negative vectors, topic affinities
│   │   │   ├── EmbeddingVector.ts         # VO: dimension-checked, normalised, cosine()
│   │   │   ├── TopicAffinity.ts  AffinityDecay.ts
│   │   │   ├── FeedCandidate.ts  ScoredCandidate.ts  SignalBreakdown.ts
│   │   │   ├── QualityScore.ts            # Bayesian-smoothed engagement rate
│   │   │   ├── RankingConfig.ts           # all weights/half-lives as a VO
│   │   │   └── repositories/
│   │   │
│   │   ├── discovery/
│   │   │   ├── SearchQuery.ts  QueryIntent.ts   # informational|person|topic|exact|navigational
│   │   │   ├── ExpertiseScore.ts  ExpertiseEvidence.ts
│   │   │   ├── SearchResult.ts  ResultKind.ts
│   │   │   └── repositories/
│   │   │
│   │   ├── notification/
│   │   │   ├── Notification.ts  NotificationKind.ts  NotificationGroup.ts
│   │   │   ├── DeviceToken.ts  NotificationPreferences.ts
│   │   │   └── repositories/
│   │   │
│   │   └── moderation/
│   │       ├── Report.ts  ReportReason.ts  ReportStatus.ts
│   │       ├── EnforcementAction.ts  AuditEntry.ts
│   │       └── repositories/
│   │
│   ├── application/
│   │   ├── ports/
│   │   │   ├── UnitOfWork.ts             # run<T>(fn: (tx) => Promise<T>): Promise<T>
│   │   │   ├── Clock.ts  IdGenerator.ts  RandomSource.ts
│   │   │   ├── PasswordHasher.ts  TokenIssuer.ts  TokenVerifier.ts
│   │   │   ├── EmailSender.ts  PushSender.ts
│   │   │   ├── MediaStorage.ts            # signUpload, fetchAsset, buildUrl, destroy, tag
│   │   │   ├── MediaUrlBuilder.ts         # public_id + variant -> delivery URL
│   │   │   ├── ImageUnderstandingProvider.ts
│   │   │   ├── EmbeddingProvider.ts       # embedText, embedBatch, dimension
│   │   │   ├── EmbeddingCache.ts
│   │   │   ├── EventPublisher.ts  JobScheduler.ts
│   │   │   ├── CacheStore.ts  SeenStore.ts  PresenceStore.ts  RateLimiter.ts
│   │   │   ├── RealtimeGateway.ts         # emitToUser, emitToConversation
│   │   │   ├── TextModerator.ts  ImageModerator.ts
│   │   │   └── query/                     # read-model ports (bespoke pipelines allowed)
│   │   │       ├── FeedQueryService.ts
│   │   │       ├── PostQueryService.ts
│   │   │       ├── ProfileQueryService.ts
│   │   │       ├── ConversationQueryService.ts
│   │   │       ├── SearchQueryService.ts
│   │   │       └── ExpertiseQueryService.ts
│   │   │
│   │   ├── dto/                            # input/output shapes; plain types only
│   │   ├── mappers/                        # Entity -> DTO. Never DTO -> Entity in reverse of invariants
│   │   │
│   │   ├── auth/                           # one folder per bounded context
│   │   │   ├── RegisterUserUseCase.ts
│   │   │   ├── VerifyEmailUseCase.ts
│   │   │   ├── LoginUseCase.ts
│   │   │   ├── RefreshSessionUseCase.ts
│   │   │   ├── LogoutUseCase.ts
│   │   │   ├── RequestPasswordResetUseCase.ts
│   │   │   ├── ResetPasswordUseCase.ts
│   │   │   ├── ChangePasswordUseCase.ts
│   │   │   ├── ListSessionsUseCase.ts
│   │   │   ├── RevokeSessionUseCase.ts
│   │   │   ├── CheckHandleAvailabilityUseCase.ts
│   │   │   ├── DeactivateAccountUseCase.ts
│   │   │   └── DeleteAccountUseCase.ts
│   │   ├── profile/
│   │   ├── social/
│   │   ├── content/
│   │   ├── engagement/
│   │   ├── feed/
│   │   │   ├── GetHomeFeedUseCase.ts
│   │   │   ├── GetFollowingFeedUseCase.ts
│   │   │   ├── GetExploreFeedUseCase.ts
│   │   │   ├── GetTopicFeedUseCase.ts
│   │   │   ├── SubmitFeedFeedbackUseCase.ts
│   │   │   ├── RecordImpressionsUseCase.ts
│   │   │   └── pipeline/
│   │   │       ├── FeedPipeline.ts          # orchestrator; depends only on the 3 interfaces
│   │   │       ├── CandidateSource.ts       # interface
│   │   │       ├── RankingSignal.ts         # interface
│   │   │       ├── Reranker.ts              # interface
│   │   │       ├── sources/
│   │   │       │   ├── FollowingSource.ts
│   │   │       │   ├── InterestVectorSource.ts
│   │   │       │   ├── TopicAffinitySource.ts
│   │   │       │   ├── CoEngagementSource.ts
│   │   │       │   ├── TrendingSource.ts
│   │   │       │   └── SharedWithMeSource.ts
│   │   │       ├── signals/
│   │   │       │   ├── SemanticRelevanceSignal.ts
│   │   │       │   ├── TopicAffinitySignal.ts
│   │   │       │   ├── AuthorAffinitySignal.ts
│   │   │       │   ├── ContentQualitySignal.ts
│   │   │       │   ├── FreshnessSignal.ts
│   │   │       │   ├── SocialProofSignal.ts
│   │   │       │   └── NegativeInterestSignal.ts
│   │   │       ├── rerankers/
│   │   │       │   ├── AuthorDiversityReranker.ts
│   │   │       │   ├── TopicDiversityReranker.ts
│   │   │       │   ├── MmrDiversityReranker.ts
│   │   │       │   ├── ExplorationInjector.ts
│   │   │       │   └── SeenSuppressionReranker.ts
│   │   │       └── filters/
│   │   │           ├── BlockFilter.ts  MuteFilter.ts  VisibilityFilter.ts
│   │   │           ├── SeenFilter.ts   ModerationFilter.ts  SelfPostFilter.ts
│   │   ├── messaging/
│   │   ├── search/
│   │   │   ├── SearchUseCase.ts             # orchestrates retrievers + fuser + reranker
│   │   │   ├── SuggestUseCase.ts
│   │   │   ├── FindExpertsUseCase.ts
│   │   │   ├── retrieval/
│   │   │   │   ├── SearchRetriever.ts       # interface
│   │   │   │   ├── LexicalPostRetriever.ts
│   │   │   │   ├── SemanticPostRetriever.ts
│   │   │   │   ├── HashtagRetriever.ts
│   │   │   │   ├── PeopleLexicalRetriever.ts
│   │   │   │   ├── PeopleExpertiseRetriever.ts
│   │   │   │   └── TopicRetriever.ts
│   │   │   ├── QueryUnderstanding.ts        # normalise, intent, keywords, expansion
│   │   │   ├── ReciprocalRankFuser.ts
│   │   │   └── SearchReranker.ts
│   │   ├── notification/
│   │   ├── moderation/
│   │   └── events/handlers/                 # one handler per (event, effect) pair
│   │       ├── UpdateInterestProfileOnEngagement.ts
│   │       ├── EnqueuePostEnrichmentOnPublish.ts
│   │       ├── IndexPostOnEnriched.ts
│   │       ├── RecomputeExpertiseOnEngagement.ts
│   │       ├── CreateNotificationOnLike.ts
│   │       ├── ... (see §17)
│   │
│   ├── infrastructure/
│   │   ├── config/
│   │   │   ├── env.ts                       # Zod-parsed, fails fast at boot
│   │   │   └── rankingConfig.ts             # loads §Appendix B constants, hot-reloadable
│   │   ├── persistence/
│   │   │   └── mongo/
│   │   │       ├── client.ts                # MongoClient, pool + read/write concern config
│   │   │       ├── collections.ts           # typed collection accessors, one source of names
│   │   │       ├── MongoUnitOfWork.ts       # ClientSession-based transactions
│   │   │       ├── documents/               # Doc types + Zod parsers (persistence shapes)
│   │   │       ├── mappers/                 # Doc <-> Entity, both directions, per aggregate
│   │   │       ├── repositories/            # Mongo*Repository, implement domain ports
│   │   │       ├── queries/                 # Mongo*QueryService, read models
│   │   │       ├── pipelines/               # exported aggregation-pipeline factories
│   │   │       │   ├── feedCandidates.ts  hydratePosts.ts  commentThread.ts
│   │   │       │   ├── hybridSearch.ts    peopleSearch.ts  expertiseRecompute.ts
│   │   │       │   └── neighbours.ts      velocity.ts      counterReconcile.ts
│   │   │       ├── indexes/                 # declarative index + validator definitions
│   │   │       │   ├── index.ts             # ALL_INDEXES, applied by db:sync-indexes
│   │   │       │   ├── users.indexes.ts  posts.indexes.ts  ...
│   │   │       │   └── searchIndexes/       # Atlas Search + Vector Search definitions
│   │   │       ├── outbox/OutboxRepository.ts  OutboxPublisher.ts
│   │   │       ├── changeStreams/BlockCacheInvalidator.ts
│   │   │       └── errors.ts                # E11000 etc. -> domain errors (never leak driver errors)
│   │   ├── cache/  RedisCacheStore.ts  RedisSeenStore.ts  RedisRateLimiter.ts  RedisPresenceStore.ts
│   │   ├── queue/  BullMqJobScheduler.ts  workers/
│   │   ├── realtime/ SocketIoGateway.ts  handlers/  middleware/socketAuth.ts
│   │   ├── media/  CloudinaryClient.ts            # thin wrapper over `cloudinary`.v2
│   │   │           CloudinaryMediaStorage.ts      # implements MediaStorage
│   │   │           CloudinaryUrlBuilder.ts        # implements MediaUrlBuilder
│   │   │           CloudinarySignature.ts         # sha1/sha256 param signing + verification
│   │   │           CloudinaryWebhookVerifier.ts   # validates notification signatures
│   │   ├── ml/     OnnxEmbeddingProvider.ts  HttpEmbeddingProvider.ts
│   │   │           CaptioningImageUnderstanding.ts  KeywordTopicClassifier.ts
│   │   ├── security/ Argon2PasswordHasher.ts  JoseTokenIssuer.ts  ...
│   │   ├── email/  push/  moderation/
│   │   ├── time/ SystemClock.ts  id/ObjectIdGenerator.ts  random/CryptoRandomSource.ts
│   │   ├── observability/ logger.ts  tracing.ts  metrics.ts
│   │   └── http/
│   │       ├── server.ts                    # Fastify instance assembly
│   │       ├── plugins/                     # cors, helmet, compress, multipart, swagger
│   │       ├── middleware/
│   │       │   ├── authenticate.ts  requireVerifiedEmail.ts  rateLimit.ts
│   │       │   ├── idempotency.ts  requestContext.ts  errorMapper.ts
│   │       ├── schemas/                     # Zod request/response schemas per route group
│   │       ├── controllers/
│   │       ├── presenters/
│   │       └── routes/
│   │           ├── index.ts  auth.routes.ts  users.routes.ts  follow.routes.ts
│   │           ├── posts.routes.ts  comments.routes.ts  feed.routes.ts
│   │           ├── search.routes.ts  conversations.routes.ts  messages.routes.ts
│   │           ├── notifications.routes.ts  media.routes.ts  topics.routes.ts
│   │           ├── webhooks.routes.ts       # POST /webhooks/cloudinary
│   │           ├── reports.routes.ts  admin.routes.ts  health.routes.ts
│   │
│   └── main/
│       ├── container.ts                     # buildContainer(config): AppContainer
│       ├── api.ts                           # HTTP + WS entrypoint
│       ├── worker.ts                        # BullMQ worker entrypoint
│       ├── scheduler.ts                     # repeatable job registration
│       └── cli/                             # seed, backfill-embeddings, recompute-expertise
│
├── test/
│   ├── fakes/                               # in-memory implementation of every port
│   ├── contracts/                           # shared suites run against fake AND real
│   ├── builders/                            # test data builders (aUser(), aPost())
│   ├── unit/  integration/  e2e/
│   └── fixtures/
└── docs/
    ├── openapi.json                          # generated
    ├── adr/                                  # architecture decision records
    └── RANKING.md                            # generated report of live weights
```

---

## 7. Domain Model

### 7.1 Aggregates and their invariants

Invariants are enforced **inside** the aggregate. A use case that reaches around an
entity to mutate a field is a defect.

**User** (root)
- Handle: 3–24 chars, `^[a-z0-9_]+$`, unique case-insensitively, immutable after
  creation, not in the reserved-word list.
- Email: unique case-insensitively, stored lowercase, normalised.
- Date of birth: yields age ≥ `MIN_AGE_YEARS`; rejected otherwise with `UNDERAGE_ACCOUNT`.
- Status transitions: `pending_verification → active`; `active ↔ deactivated`;
  `active|deactivated → suspended`; any `→ deleted` (terminal).
- Publishing, commenting, following, and messaging require `status = active` **and**
  `emailVerifiedAt != null`.
- `passwordHash` never leaves the aggregate; there is no getter that returns it, only
  `verifyPassword(candidate, hasher)`.

**Post** (root)
- 1–10 media items, order preserved and stable.
- Description ≤ 2,200 chars; hashtags ≤ 30; mentions ≤ 20.
- Author must be `active` and verified at publish time.
- `publish()` is only legal from `draft`, requires every referenced media asset to be in
  state `ready`, and emits `PostPublished`.
- Editing the description re-extracts hashtags/mentions and emits `PostDescriptionEdited`
  so enrichment re-runs.
- `remove()` (moderation) and `softDelete()` (author) are distinct; only the author may
  soft-delete, only moderation may remove.
- Topic assignments are `(topicId, weight ∈ (0,1], source: 'author'|'classifier')`, at
  most 5, weights normalised to sum ≤ 1.

**Comment** (root, references Post)
- Depth ≤ 1 (a reply cannot have replies). Attempting depth 2 raises
  `COMMENT_DEPTH_EXCEEDED`.
- Body 1–1,000 chars.
- Only the post author may `pin` (max 1 pinned per post) or `markHelpful`.
- Deleting a top-level comment with replies **tombstones** it (body replaced, author
  hidden) so the thread survives.

**Conversation** (root)
- Exactly two participants, stored with a canonical ordered pair
  `(lowerUserId, higherUserId)` and a unique constraint — creation is therefore racefree
  and idempotent.
- Creation requires `MutualityPolicy.canConverse(a, b) === true`.
- `send()` re-validates mutuality and absence of a block. Loss of mutuality does not
  delete history but sets the conversation to `read_only`.
- Per-participant `hiddenAt` allows a one-sided clear without destroying the other side.

**InterestProfile** (root, one per user)
- `positiveVector` and `negativeVector` are unit-normalised, dimension-checked.
- `topicAffinities: Map<TopicId, number>` with values in `[0, 1]`, at most 200 entries
  (lowest pruned).
- `interactionCount` drives the personalisation ramp (see §14.3).
- `applyInteraction(signal)` is a pure domain method: it decays existing weight and
  folds in the new evidence. It has no I/O and is unit-tested against fixed vectors.

**ExpertiseScore** (per `(user, topic)`)
- `score ∈ [0, 100]`, plus `evidenceCount` and `confidence ∈ [0, 1]`.
- A score is only *publishable* (usable in people-search ranking) when
  `evidenceCount ≥ MIN_EXPERTISE_EVIDENCE`; otherwise it is marked `emerging` and
  down-weighted. This prevents a single lucky post from crowning an expert.

### 7.2 Illustrative domain code

```ts
// domain/ranking/EmbeddingVector.ts
export class EmbeddingVector extends ValueObject {
  private constructor(private readonly values: Float32Array) { super(); }

  static create(values: readonly number[], expectedDim: number): EmbeddingVector {
    Guard.equal(values.length, expectedDim, 'EMBEDDING_DIMENSION_MISMATCH');
    Guard.allFinite(values, 'EMBEDDING_NOT_FINITE');
    return new EmbeddingVector(EmbeddingVector.normalise(values));
  }

  static zero(dim: number): EmbeddingVector {
    return new EmbeddingVector(new Float32Array(dim));
  }

  get dimension(): number { return this.values.length; }
  toArray(): number[] { return Array.from(this.values); }

  /** Both vectors are unit-normalised, so dot product IS cosine similarity. */
  cosine(other: EmbeddingVector): number {
    Guard.equal(other.dimension, this.dimension, 'EMBEDDING_DIMENSION_MISMATCH');
    let dot = 0;
    for (let i = 0; i < this.values.length; i++) dot += this.values[i]! * other.values[i]!;
    return Math.max(-1, Math.min(1, dot));
  }

  /** decayedSelf * decay + other * weight, renormalised. */
  blend(other: EmbeddingVector, weight: number, decay: number): EmbeddingVector {
    const out = new Float32Array(this.dimension);
    for (let i = 0; i < out.length; i++) {
      out[i] = this.values[i]! * decay + other.values[i]! * weight;
    }
    return new EmbeddingVector(EmbeddingVector.normalise(Array.from(out)));
  }

  private static normalise(values: readonly number[]): Float32Array {
    let norm = 0;
    for (const v of values) norm += v * v;
    norm = Math.sqrt(norm);
    const out = new Float32Array(values.length);
    if (norm === 0) return out;               // zero vector stays zero
    for (let i = 0; i < values.length; i++) out[i] = values[i]! / norm;
    return out;
  }
}
```

```ts
// domain/social/MutualityPolicy.ts
// The ONLY place that answers "can these two exchange messages".
// Messaging use cases MUST delegate here; they MUST NOT re-implement the rule.
export class MutualityPolicy {
  constructor(
    private readonly graph: FollowGraphReader,
    private readonly blocks: BlockStore,
  ) {}

  async canConverse(a: UserId, b: UserId): Promise<Result<true, DomainError>> {
    if (a.equals(b)) return Err(new CannotMessageSelfError());
    if (await this.blocks.existsEitherDirection(a, b)) return Err(new BlockedRelationshipError());
    const [aFollowsB, bFollowsA] = await Promise.all([
      this.graph.exists(a, b),
      this.graph.exists(b, a),
    ]);
    if (!aFollowsB || !bFollowsA) return Err(new NotMutualFollowersError());
    return Ok(true);
  }
}
```

```ts
// domain/ranking/QualityScore.ts
// Bayesian-smoothed engagement rate. New posts inherit the author's historical
// prior instead of being punished for having no impressions yet.
export class QualityScore extends ValueObject {
  private constructor(public readonly value: number) { super(); }

  static compute(stats: PostStats, prior: AuthorPrior, cfg: RankingConfig): QualityScore {
    const w = cfg.engagementWeights;
    const weighted =
      stats.likes * w.like +
      stats.comments * w.comment +
      stats.shares * w.share +
      stats.saves * w.save +
      stats.profileVisitsFromPost * w.profileVisit -
      stats.hides * w.hide -
      stats.reports * w.report;

    const pseudo = cfg.qualityPriorStrength;            // default 50 "virtual impressions"
    const rate = (weighted + prior.rate * pseudo) / (stats.impressions + pseudo);
    // squash an unbounded rate into [0,1) so it can be linearly combined
    return new QualityScore(Math.max(0, Math.min(1, rate / (rate + cfg.qualityHalfSaturation))));
  }
}
```

---

## 8. Database Schema (MongoDB Atlas)

MongoDB 8.0+ on Atlas. Atlas is required, not merely convenient: **Atlas Search**
(Lucene) and **Atlas Vector Search** (HNSW) replace what `tsvector` and `pgvector` would
have done, and both are managed by Atlas rather than being installable extensions.

### 8.0 Modelling rules

These rules are what keep a document database from degenerating into a slow relational
one. Apply them without exception.

**Identifiers.** `_id` is an `ObjectId`. It is 12 bytes, generated client-side by the
driver, and its leading 4 bytes are a timestamp, so it is naturally time-ordered — which
gives the same "`_id` doubles as a chronological cursor" property the UUIDv7 choice was
buying. The API exposes it as its 24-character hex string. `IdGenerator` remains a port so
the domain never imports `ObjectId`; the domain sees `UserId`, which wraps a string.

**Dates** are BSON `Date`, always UTC. Never store timestamps as strings — string dates
break range queries and sort lexicographically, which silently produces wrong results.

**Embed vs. reference.** Embed when the child is owned by the parent, bounded in size, and
almost always read with it. Reference when the child list is unbounded or is queried on its
own. Concretely:

| Relationship | Decision | Why |
|---|---|---|
| Post → its media (1–10) | **Embed** array | Bounded by an invariant, always read with the post |
| Post → topics (≤ 5) | **Embed** array | Bounded, needed for filtering and scoring |
| Post → hashtags (≤ 30) | **Embed** array of strings | Bounded, indexed multikey |
| Post → its embedding vector | **Embed** field on the post | `$vectorSearch` must run as the first stage of a pipeline on **one** collection, so the vector has to live on the document being searched. This is the single most consequential modelling decision in this schema |
| Post → comments | **Reference** (own collection) | Unbounded; a viral post would blow the 16 MB document limit |
| Post → likes | **Reference** (own collection) | Unbounded; also needs `(userId, postId)` uniqueness |
| User → followers/following | **Reference** (`follows` collection) | Unbounded, and needed in both directions |
| Conversation → messages | **Reference** (own collection) | Unbounded |
| User → interest profile | **Separate collection**, 1:1 | Written on nearly every interaction; keeping it off `users` avoids rewriting a hot document and invalidating its cache |

**The unbounded-array antipattern is prohibited.** No document may contain an array that
grows with user activity. Any array in this schema has a hard cap enforced by a domain
invariant.

**Referential integrity is the application's job.** There are no foreign keys and no
`ON DELETE CASCADE`. Every cascade in this system is therefore an explicit, tested code
path driven by the domain events in §17 — `UserBlocked` deletes follow edges, account purge
deletes content. This is a real cost of the choice and it must be covered by integration
tests, because nothing in the database will catch a missed cascade.

**Validation happens twice.** A `$jsonSchema` validator on every collection
(`validationLevel: 'strict'`, `validationAction: 'error'`) is the backstop that replaces
`CHECK` constraints and `NOT NULL`. Zod schemas in the repository layer are the fast,
friendly check. The validator exists to catch what code forgets; it is not the primary
guard.

**Counters** live on the parent document and are updated with `$inc`, which is atomic on a
single document and needs no transaction.

**Case-insensitive uniqueness** is done with explicit lowercase fields (`handleLower`,
`emailLower`) plus a unique index — not with index collations. Collations are easy to apply
inconsistently between an index and a query, and a query that misses the collation silently
does a full collection scan.

Collections are grouped below by bounded context. Index definitions are declarative, live
in `infrastructure/persistence/mongo/indexes/`, and are applied idempotently by
`pnpm db:sync-indexes` (see §22).

### 8.1 Identity

```js
// users
{
  _id:            ObjectId,
  handle:         "nova",                 // as displayed
  handleLower:    "nova",                 // unique index target
  displayName:    "Nova",
  email:          "Nova@Example.com",
  emailLower:     "nova@example.com",     // unique index target
  passwordHash:   "$argon2id$v=19$...",
  dateOfBirth:    ISODate("2001-04-17"),  // never exposed publicly
  bio:            "Ceramics and cold brew.",
  avatar:         { mediaId: ObjectId, publicId: "prequit/...", version: 1785000123,
                    format: "webp" },     // embedded snapshot: avatars render on every screen,
                                          // so this avoids a lookup on every hydration
  links:          [ { label: "Shop", url: "https://..." } ],
  isPrivate:      false,
  status:         "active",               // pending_verification|active|suspended|deactivated|deleted
  roles:          ["user"],
  emailVerifiedAt: ISODate,
  lastActiveAt:   ISODate,
  counts:         { posts: 84, followers: 1203, following: 311 },
  settings:       { privacy: { showActivityStatus: true }, notifications: { ... }, locale: "en" },
  declaredTopicIds: [ ObjectId ],         // onboarding picks, ≤ 20
  profileEmbedding: [ 0.013, -0.041, ... ],   // 768 floats: bio + recent post descriptions
  profileEmbeddingModel: "bge-base-en-v1.5",
  suspendedUntil: ISODate,
  createdAt:      ISODate,
  updatedAt:      ISODate,
  deletedAt:      null
}
```

```js
db.users.createIndexes([
  { key: { handleLower: 1 }, unique: true, name: 'uniq_handle' },
  { key: { emailLower: 1 },  unique: true, name: 'uniq_email' },
  { key: { status: 1, lastActiveAt: -1 }, name: 'active_recent' },
  { key: { deletedAt: 1 }, sparse: true, name: 'purge_scan' },
]);
```

`profileEmbedding` is indexed by an **Atlas Vector Search** index, which is a separate
object from a normal index and is created through `createSearchIndex`:

```js
db.users.createSearchIndex('users_vector', 'vectorSearch', {
  fields: [
    { type: 'vector', path: 'profileEmbedding', numDimensions: 768,
      similarity: 'cosine', quantization: 'scalar' },
    { type: 'filter', path: 'status' },
    { type: 'filter', path: 'isPrivate' },
  ],
});
```

`quantization: 'scalar'` cuts index memory roughly 4× for a small recall cost that is
recovered by over-requesting candidates. Note the two `filter` fields: **a
`$vectorSearch` pre-filter can only reference paths declared as `filter` in the index
definition.** Filtering after the vector stage instead silently destroys recall, because
the ANN search has already discarded the documents you wanted. Getting this list right up
front is the most common source of "vector search returns nothing useful".

An Atlas Search index handles handle/name lookup and typeahead, replacing `pg_trgm`:

```js
db.users.createSearchIndex('users_text', 'search', {
  mappings: { dynamic: false, fields: {
    handle:      [ { type: 'string', analyzer: 'lucene.keyword' },
                   { type: 'autocomplete', tokenization: 'edgeGram',
                     minGrams: 2, maxGrams: 15, foldDiacritics: true } ],
    displayName: [ { type: 'string', analyzer: 'lucene.standard' },
                   { type: 'autocomplete', tokenization: 'edgeGram' } ],
    bio:         { type: 'string', analyzer: 'lucene.english' },
    status:      { type: 'token' },
  } },
});
```

```js
// authSessions — refresh-token rotation lineage
{
  _id:              ObjectId,
  userId:           ObjectId,
  familyId:         ObjectId,      // reuse of a rotated token revokes the whole family
  refreshTokenHash: "sha256:...",  // never the token itself
  deviceLabel:      "Pixel 8",
  deviceId:         "…",
  ip:               "203.0.113.9",
  userAgent:        "…",
  expiresAt:        ISODate,
  revokedAt:        null,
  replacedBy:       ObjectId,
  createdAt:        ISODate,
  lastUsedAt:       ISODate
}

db.authSessions.createIndexes([
  { key: { refreshTokenHash: 1 }, unique: true },
  { key: { userId: 1, revokedAt: 1 } },
  { key: { familyId: 1 } },
  // TTL: Mongo reaps expired sessions itself. Keep them 30 days past expiry so
  // reuse-detection can still recognise a stolen rotated token.
  { key: { expiresAt: 1 }, expireAfterSeconds: 2592000 },
]);
```

```js
// verificationTokens — email verify, password reset, email change
{
  _id: ObjectId, userId: ObjectId,
  purpose: "password_reset",       // email_verify|password_reset|email_change
  tokenHash: "sha256:...",
  payload: { newEmail: "..." },
  expiresAt: ISODate, consumedAt: null, createdAt: ISODate
}

db.verificationTokens.createIndexes([
  { key: { tokenHash: 1 }, unique: true },
  { key: { userId: 1, purpose: 1 } },
  { key: { expiresAt: 1 }, expireAfterSeconds: 86400 },
]);
```

TTL indexes are doing real work here: session, token, idempotency-key, and feed-cache
expiry all become the database's problem instead of a cron job's. Note that Mongo's TTL
monitor runs every 60 s, so expiry is eventually-consistent — security-sensitive checks
MUST still compare `expiresAt` in the query rather than trusting that the document is gone.

### 8.2 Social graph

The graph is edge-per-document, never an array of IDs on the user. A celebrity with two
million followers is exactly as cheap to write to as a new account, and the 16 MB document
limit is never in play.

```js
// follows — one document per directed edge
{ _id: ObjectId, followerId: ObjectId, followeeId: ObjectId, createdAt: ISODate }

db.follows.createIndexes([
  { key: { followerId: 1, followeeId: 1 }, unique: true },   // idempotent follow + "do I follow X?"
  { key: { followeeId: 1, createdAt: -1 } },                  // follower list, newest first
  { key: { followerId: 1, createdAt: -1 } },                  // following list
]);
```

```js
// followRequests — pending requests to private accounts
{ _id: ObjectId, requesterId: ObjectId, targetId: ObjectId,
  status: "pending",                    // pending|accepted|rejected|cancelled
  createdAt: ISODate, resolvedAt: null }

db.followRequests.createIndexes([
  { key: { requesterId: 1, targetId: 1 }, unique: true },
  // Partial index: the inbox only ever queries pending requests, so the index only
  // stores those. Smaller index, and resolved requests cost nothing to keep.
  { key: { targetId: 1, createdAt: -1 },
    partialFilterExpression: { status: 'pending' } },
  { key: { requesterId: 1, createdAt: -1 },
    partialFilterExpression: { status: 'pending' } },
]);
```

```js
// blocks
{ _id: ObjectId, blockerId: ObjectId, blockedId: ObjectId, createdAt: ISODate }

db.blocks.createIndexes([
  { key: { blockerId: 1, blockedId: 1 }, unique: true },
  { key: { blockedId: 1 } },
]);

// mutes
{ _id: ObjectId, muterId: ObjectId, mutedId: ObjectId,
  scope: "posts",                       // posts|notifications|all
  createdAt: ISODate }

db.mutes.createIndexes([{ key: { muterId: 1, mutedId: 1 }, unique: true }]);

// mutedTopics
{ _id: ObjectId, userId: ObjectId, topicId: ObjectId, createdAt: ISODate }
db.mutedTopics.createIndexes([{ key: { userId: 1, topicId: 1 }, unique: true }]);
```

```js
// mutualPairs — derived, maintained by the follow/unfollow event handlers.
// Canonical ordering (low < high as hex strings) makes the DM authorisation check
// and the conversation lookup a single index probe instead of two graph queries.
{ _id: ObjectId, lowUserId: ObjectId, highUserId: ObjectId, since: ISODate }

db.mutualPairs.createIndexes([
  { key: { lowUserId: 1, highUserId: 1 }, unique: true },
  { key: { lowUserId: 1, since: -1 } },
  { key: { highUserId: 1, since: -1 } },
]);
```

Because there are no triggers, `mutualPairs` is maintained purely by the
`UserFollowed` / `FollowRequestAccepted` / `UserUnfollowed` / `UserBlocked` handlers. A
reconciliation job (§17.3) recomputes it from `follows` nightly and reports drift; a
non-zero drift count is an alert, because a stale mutual pair means someone can message a
person who unfollowed them.

**Blocked-user filtering at scale.** Feed and search filters need "everyone I've blocked or
who has blocked me" on every request. Two round trips per request is wasteful, so the
combined set is cached in Redis per user (`social:excluded:<userId>`, TTL 5 min, invalidated
by the block/unblock handlers) and passed into the pipeline as a plain array. Users with more
than 1,000 exclusions fall back to a `$nin` against the array in the query.

### 8.3 Content

```js
// mediaAssets — one document per Cloudinary asset. No binaries, no per-variant URLs:
// publicId + version is enough to construct any delivery URL deterministically.
{
  _id: ObjectId, ownerId: ObjectId,
  kind: "image", purpose: "post",          // post|avatar|message
  cloudinary: {
    publicId: "prequit/prod/post/68b1…/a1b2c3d4",   // unique
    assetId: "…", version: NumberLong(1785000123),
    resourceType: "image", deliveryType: "upload",  // upload|authenticated|private
    format: "webp", secureUrl: "https://res.cloudinary.com/…", etag: "…"
  },
  mimeType: "image/jpeg", byteSize: NumberLong(2411233),
  width: 3024, height: 4032,
  placeholder: "data:image/webp;base64,…",
  colors: [ ["#8a6b4f", 41.2], ["#d9cdc0", 22.8] ],
  status: "ready",                         // pending|uploaded|ready|rejected|deleted
  moderationStatus: "approved",            // pending|approved|rejected
  rejectionReason: null,
  confirmedAt: ISODate, createdAt: ISODate
}

db.mediaAssets.createIndexes([
  { key: { 'cloudinary.publicId': 1 }, unique: true },
  { key: { ownerId: 1, createdAt: -1 } },
  { key: { 'cloudinary.etag': 1 }, sparse: true },              // dedupe identical re-uploads
  { key: { createdAt: 1 }, partialFilterExpression: { status: 'pending' } }, // abandoned-upload sweep
]);
```

```js
// posts — the central document. Media, topics, hashtags, and the embedding are all
// embedded, so serving a post is a single _id lookup and $vectorSearch can run on it.
{
  _id: ObjectId,
  authorId: ObjectId,
  description: "First cone-6 firing of the year… #ceramics #kiln",
  media: [                                  // 1–10, order is display order
    { mediaId: ObjectId, publicId: "prequit/prod/post/…", version: NumberLong(1785000123),
      format: "webp", width: 3024, height: 4032,
      placeholder: "data:image/webp;base64,…", altText: "Opened kiln with six glazed bowls" }
  ],
  hashtags: [ "ceramics", "kiln" ],         // lowercased, ≤ 30, multikey index
  mentionedUserIds: [ ObjectId ],           // ≤ 20
  topics: [ { topicId: ObjectId, slug: "ceramics", weight: 1.0, source: "author" } ], // ≤ 5
  topicIds: [ ObjectId ],                   // flattened copy: $vectorSearch filters cannot
                                            // reach into an array of subdocuments, so the
                                            // plain ID array is what the filter uses
  visibility: "public",                     // public|followers
  status: "published",                       // draft|published|shadow_limited|removed|deleted
  locationLabel: "Studio",
  language: "en",

  // Enrichment output (§15.5). Lives here so one document serves search, ranking, and reads.
  embedding: [ 0.021, -0.008, ... ],        // 768 floats, unit-normalised
  embeddingModel: "bge-base-en-v1.5",
  embeddingSourceHash: "sha256:…",          // unchanged hash => skip re-embedding
  imageCaption: "a kiln filled with glazed ceramic bowls",
  imageText: "CONE 6",                       // OCR
  topComments: "fixed it by cracking the lid at 900C…",  // refreshed periodically
  enrichedAt: ISODate,                       // null => enrichment pending

  // Denormalised counters, all updated with atomic $inc
  counts: { likes: 0, comments: 0, shares: 0, saves: 0, hides: 0, reports: 0 },
  impressions: NumberLong(0),
  effectiveImpressions: 0.0,                 // position-bias corrected, §14.1
  qualityScore: 0.0,                         // cached §7.2 QualityScore
  velocity: { h1: 0.0, h24: 0.0, computedAt: ISODate },  // trending, was a separate table

  publishedAt: ISODate, createdAt: ISODate, updatedAt: ISODate,
  editedAt: null, deletedAt: null
}
```

```js
db.posts.createIndexes([
  { key: { authorId: 1, publishedAt: -1 },
    partialFilterExpression: { status: 'published' } },      // profile timeline
  { key: { publishedAt: -1 },
    partialFilterExpression: { status: 'published' } },      // following feed, trending
  { key: { topicIds: 1, qualityScore: -1, publishedAt: -1 } }, // topic feed + topic candidates
  { key: { hashtags: 1, publishedAt: -1 } },                  // hashtag feed
  { key: { 'velocity.h24': -1 },
    partialFilterExpression: { status: 'published' } },      // trending source
  { key: { createdAt: 1 },
    partialFilterExpression: { enrichedAt: null } },         // enrichment backlog
  { key: { mentionedUserIds: 1, publishedAt: -1 } },
]);
```

The two search indexes on `posts` are the heart of both the feed and search:

```js
// Vector index — powers InterestVectorSource (§14.3) and semantic search (§15.2).
db.posts.createSearchIndex('posts_vector', 'vectorSearch', {
  fields: [
    { type: 'vector', path: 'embedding', numDimensions: 768,
      similarity: 'cosine', quantization: 'scalar' },
    // Every field the feed or search needs to pre-filter on MUST be declared here.
    { type: 'filter', path: 'status' },
    { type: 'filter', path: 'visibility' },
    { type: 'filter', path: 'authorId' },      // enables excluding blocked/muted authors
    { type: 'filter', path: 'topicIds' },
    { type: 'filter', path: 'publishedAt' },   // recency window
    { type: 'filter', path: 'language' },
  ],
});
```

```js
// Lexical index — replaces the weighted tsvector. Per-field boosts are applied in the
// query (§15.2) rather than baked into the index, so relevance can be retuned without
// a reindex.
db.posts.createSearchIndex('posts_text', 'search', {
  analyzer: 'lucene.english',
  searchAnalyzer: 'lucene.english',
  mappings: { dynamic: false, fields: {
    description:  { type: 'string', analyzer: 'lucene.english' },
    hashtags:     { type: 'string', analyzer: 'lucene.keyword' },
    'topics.slug':{ type: 'string', analyzer: 'lucene.keyword' },
    imageCaption: { type: 'string', analyzer: 'lucene.english' },
    imageText:    { type: 'string', analyzer: 'lucene.english' },
    topComments:  { type: 'string', analyzer: 'lucene.english' },
    status:       { type: 'token' },
    visibility:   { type: 'token' },
    authorId:     { type: 'objectId' },
    publishedAt:  { type: 'date' },
    qualityScore: { type: 'number' },
  } },
});
```

Field weighting, which `setweight(…, 'A'|'B'|'C'|'D')` would have done, moves into the
query as per-clause `boost` values — strictly more flexible, since Postgres only offered
four discrete weight classes:

| Field | Boost | Rationale |
|---|---|---|
| `description` | 3.0 | The author's own words |
| `hashtags` | 3.0 | Deliberate categorisation |
| `topics.slug` | 2.0 | Classifier-assigned |
| `imageCaption` | 1.2 | Machine-generated, useful but noisier |
| `topComments` | 1.2 | Other people's words about the post |
| `imageText` | 0.8 | OCR, noisiest of all |

```js
// topics — taxonomy with a vector centroid for query→topic resolution
{ _id: ObjectId, slug: "ceramics", slugLower: "ceramics", label: "Ceramics",
  description: "…", parentId: ObjectId,
  centroid: [ ... 768 floats ... ],       // mean embedding of member posts
  postCount: 18402, isActive: true, createdAt: ISODate }

db.topics.createIndexes([
  { key: { slugLower: 1 }, unique: true },
  { key: { parentId: 1 } },
  { key: { postCount: -1 }, partialFilterExpression: { isActive: true } },
]);

db.topics.createSearchIndex('topics_vector', 'vectorSearch', {
  fields: [ { type: 'vector', path: 'centroid', numDimensions: 768, similarity: 'cosine' },
            { type: 'filter', path: 'isActive' } ],
});

db.topics.createSearchIndex('topics_text', 'search', {
  mappings: { dynamic: false, fields: {
    label: [ { type: 'string' }, { type: 'autocomplete', tokenization: 'edgeGram' } ],
    slug:  { type: 'string', analyzer: 'lucene.keyword' },
  } },
});
```

```js
// hashtags — aggregate counters only; membership lives in posts.hashtags
{ _id: ObjectId, tag: "ceramics", tagLower: "ceramics", postCount: 9821,
  trending: { score: 0.0, computedAt: ISODate } }

db.hashtags.createIndexes([
  { key: { tagLower: 1 }, unique: true },
  { key: { 'trending.score': -1 } },
]);

// postRevisions — edit audit trail
{ _id: ObjectId, postId: ObjectId, description: "…", editedBy: ObjectId, createdAt: ISODate }
db.postRevisions.createIndexes([{ key: { postId: 1, createdAt: -1 } }]);
```

**On the 768 floats living inside every post document.** A 768-dimension float array adds
roughly 6 KB to each post, which is real but acceptable, and it buys two things worth more
than the space: `$vectorSearch` can only run as the first stage of a pipeline over a single
collection, so the vector must be on the searched document; and one `_id` fetch returns
everything needed to render and rank a post. If document size ever becomes the binding
constraint, the escape hatch is a separate `postVectors` collection searched first, with a
`$lookup` back to `posts` — measurably slower, so do not start there.

### 8.4 Engagement

```js
// likes — the unique compound index is what makes liking idempotent. Insert and catch
// duplicate-key (E11000) rather than read-then-write, which races.
{ _id: ObjectId, userId: ObjectId, postId: ObjectId, authorId: ObjectId, createdAt: ISODate }

db.likes.createIndexes([
  { key: { userId: 1, postId: 1 }, unique: true },
  { key: { postId: 1, createdAt: -1 } },     // "who liked this"
  { key: { userId: 1, createdAt: -1 } },     // recent likes: interest profile + neighbours
  { key: { authorId: 1, createdAt: -1 } },   // engagement received, for expertise
]);
```

```js
// comments — max depth 1 (a reply cannot have replies), enforced in the domain
{
  _id: ObjectId, postId: ObjectId, authorId: ObjectId,
  postAuthorId: ObjectId,               // denormalised: expertise scoring groups by the
                                        // post's author without a lookup
  parentId: null,                       // null = top-level
  body: "cracking the lid at 900C evened mine out",
  counts: { likes: 0, replies: 0 },
  isPinned: false,
  helpfulAt: null,                      // post author marked it helpful — top expertise signal
  status: "visible",                    // visible|tombstoned|removed|deleted
  topicIds: [ ObjectId ],               // copied from the post at write time, for expertise queries
  createdAt: ISODate, updatedAt: ISODate, deletedAt: null
}

db.comments.createIndexes([
  { key: { postId: 1, parentId: 1, createdAt: -1 } },        // thread listing
  { key: { postId: 1, 'counts.likes': -1, createdAt: -1 } }, // sort=top
  { key: { authorId: 1, createdAt: -1 } },
  { key: { authorId: 1, topicIds: 1, helpfulAt: -1 } },      // expertise component 2
  // One pinned comment per post, enforced by a partial unique index rather than by code
  { key: { postId: 1 }, unique: true, partialFilterExpression: { isPinned: true } },
]);

// commentLikes
{ _id: ObjectId, userId: ObjectId, commentId: ObjectId, createdAt: ISODate }
db.commentLikes.createIndexes([{ key: { userId: 1, commentId: 1 }, unique: true }]);
```

```js
// saveCollections
{ _id: ObjectId, userId: ObjectId, name: "Glazes", nameLower: "glazes", createdAt: ISODate }
db.saveCollections.createIndexes([{ key: { userId: 1, nameLower: 1 }, unique: true }]);

// saves
{ _id: ObjectId, userId: ObjectId, postId: ObjectId, collectionId: ObjectId, createdAt: ISODate }
db.saves.createIndexes([
  { key: { userId: 1, postId: 1 }, unique: true },
  { key: { userId: 1, createdAt: -1 } },
  { key: { userId: 1, collectionId: 1, createdAt: -1 } },
]);

// shares
{ _id: ObjectId, postId: ObjectId, sharerId: ObjectId,
  targetKind: "conversation",           // conversation|external_link|repost
  conversationId: ObjectId, recipientId: ObjectId, messageId: ObjectId,
  linkToken: "aB3xY9",                  // unique, sparse
  createdAt: ISODate }

db.shares.createIndexes([
  { key: { postId: 1, createdAt: -1 } },
  { key: { linkToken: 1 }, unique: true, sparse: true },
  { key: { recipientId: 1, createdAt: -1 },
    partialFilterExpression: { targetKind: 'conversation' } },  // SharedWithMeSource
]);
```

**Why likes do not use a transaction.** Inserting a like and `$inc`-ing
`posts.counts.likes` touches two documents. Wrapping that in a transaction would double the
write cost on the single hottest path in the product to protect a counter that §4.3 already
declares advisory and reconciles nightly. So: insert the like (authoritative), then `$inc`
the counter (best-effort). If the process dies between them the count is off by one until
reconciliation, which is acceptable. Comments do the same. This is a deliberate, bounded
trade — not an oversight.

### 8.5 Interaction events (the ranking substrate)

The highest-volume collection by two orders of magnitude — every impression is a document.
This is a **time series collection**, which is the direct replacement for monthly range
partitions and is strictly better for this workload: MongoDB buckets measurements that share
a `metaField` into compressed groups, typically cutting storage 5–10× versus the same data in
a normal collection, and TTL expiry drops whole buckets instead of deleting rows.

```js
db.createCollection('interactionEvents', {
  timeseries: {
    timeField: 'occurredAt',
    metaField: 'meta',        // the series identifier — must be low-churn
    granularity: 'minutes',   // buckets span up to 24h per series
  },
  expireAfterSeconds: 15552000,   // 180 days, matching the ranking lookback window
});
```

```js
{
  occurredAt: ISODate,
  meta: { userId: ObjectId },   // ONE field only: the natural series is "this user's activity"
  kind: "impression",           // impression|dwell|like|unlike|comment|reply|save|unsave|
                                // share|hide|report|profile_visit|follow|carousel_complete|
                                // description_expand|search_click|not_interested
  postId: ObjectId,
  authorId: ObjectId,
  topicIds: [ ObjectId ],
  weight: 0.55,                 // §14.1 signal weight, resolved at write time
  dwellMs: 4200,
  dwellRatio: 0.87,             // length-normalised, §14.1
  surface: "home",              // home|following|explore|topic|search|profile|conversation
  position: 3,                  // rank slot — required for position-bias correction
  propensity: 0.79,             // 1/(1+0.09·position), stored so the fitted curve can change
                                // without invalidating historical events
  sessionId: ObjectId, requestId: ObjectId,
  metadata: { mediaViewed: 2 }
}
```

Three details that are easy to get wrong:

**`metaField` holds only `userId`.** It is tempting to put `kind` or `postId` in there too,
but every distinct `meta` value is its own bucket series. Adding `kind` multiplies bucket
count by ~17 and leaves each bucket sparse, destroying the compression that motivated the
choice. `userId` alone matches the dominant query ("this user's recent events") and keeps
buckets dense.

**`granularity: 'minutes'`.** The ranking jobs read 30–180 day windows per user, so coarse
buckets are right. `'seconds'` would cap bucket span at one hour and produce many
thinly-filled buckets. Granularity can be increased later but **never decreased**, so
starting at `'minutes'` rather than `'hours'` leaves the one safe direction of travel open.

**Time series collections are append-only for practical purposes** — updates may only match
and modify the `metaField`. That is fine here because events are immutable facts, but it
means any correction must be a new compensating event, never an edit. Events are also written
outside transactions: telemetry is fire-and-forget and must never be able to fail a user's
request.

```js
// Secondary indexes are supported on time series collections and are needed for the
// queries that are not "by user".
db.interactionEvents.createIndexes([
  { key: { 'meta.userId': 1, occurredAt: -1 } },      // interest profile recompute
  { key: { postId: 1, occurredAt: -1 } },              // per-post stats, velocity
  { key: { authorId: 1, kind: 1, occurredAt: -1 } },   // expertise, audience growth
  { key: { kind: 1, occurredAt: -1 } },                // global analytics
]);
```

Writes are batched: the impressions endpoint accumulates events in Redis and a worker flushes
them with `insertMany({ ordered: false })` every few seconds. Batched inserts into a time
series collection are dramatically cheaper than one-at-a-time, because they land in the same
bucket.

### 8.6 Ranking & discovery stores

```js
// userInterestProfiles — 1:1 with users, but a separate collection because it is
// rewritten on nearly every interaction and `users` is read on every request.
{
  _id: ObjectId,                    // == userId
  positiveEmbedding: [ ...768 ],
  negativeEmbedding: [ ...768 ],
  model: "bge-base-en-v1.5",
  interactionCount: 143,            // drives the personalisation ramp
  // Topic affinities are EMBEDDED here rather than being their own collection: capped at
  // 200 entries by a domain invariant, always read together as one object, and read on
  // every feed request. One document fetch replaces 200 rows.
  topicAffinities: [
    { topicId: ObjectId, slug: "ceramics", affinity: 0.82, source: "behaviour",
      alpha: 14.0, beta: 3.0,       // Thompson-sampling arms for exploration
      updatedAt: ISODate }
  ],
  lastEventAt: ISODate, recomputedAt: ISODate, updatedAt: ISODate
}

db.userInterestProfiles.createIndexes([
  { key: { recomputedAt: 1 } },     // nightly recompute picks the stalest first
  { key: { lastEventAt: -1 } },
]);
```

```js
// userAuthorAffinity — unbounded per user (could be thousands of authors), so this one
// stays a collection rather than an embedded array.
{ _id: ObjectId, userId: ObjectId, authorId: ObjectId, affinity: 0.64,
  weightedInteractions: 12.5, updatedAt: ISODate }

db.userAuthorAffinity.createIndexes([
  { key: { userId: 1, authorId: 1 }, unique: true },
  { key: { userId: 1, affinity: -1 } },
]);
```

```js
// userTopicExpertise — powers people search and the "why" evidence
{
  _id: ObjectId, userId: ObjectId, topicId: ObjectId, topicSlug: "bread-baking",
  score: 91.0,                      // 0..100, percentile rank within the topic
  rawScore: 2.41,
  components: { authored: 1.82, answering: 0.94, growth: 0.31,
                consistency: 0.73, endorsement: 0.22 },
  evidenceCount: 104, confidence: 0.88, isEmerging: false,
  penalties: { reciprocalDiscount: 1.0, inactivityMultiplier: 1.0 },
  evidence: {
    postsInTopic: 63, helpfulComments: 41, medianEngagementPercentile: 0.89,
    topPostIds: [ ObjectId, ObjectId ]
  },
  computedAt: ISODate
}

db.userTopicExpertise.createIndexes([
  { key: { userId: 1, topicId: 1 }, unique: true },
  { key: { userId: 1, score: -1 } },                                  // profile top topics
  // The hot query: "best people in this topic". Partial index excludes unproven users.
  { key: { topicId: 1, score: -1 },
    partialFilterExpression: { isEmerging: false } },
]);
```

```js
// userNeighbours — co-engagement similarity, recomputed nightly, top 50 kept per user
{ _id: ObjectId, userId: ObjectId, neighbourId: ObjectId,
  similarity: 0.31,                 // Jaccard over recent positive interactions
  computedAt: ISODate }

db.userNeighbours.createIndexes([
  { key: { userId: 1, neighbourId: 1 }, unique: true },
  { key: { userId: 1, similarity: -1 } },
]);

// topicCooccurrence — adjacent-topic exploration
{ _id: ObjectId, topicA: ObjectId, topicB: ObjectId, pmi: 1.84 }
db.topicCooccurrence.createIndexes([
  { key: { topicA: 1, pmi: -1 } },
  { key: { topicA: 1, topicB: 1 }, unique: true },
]);
```

Note that the separate `post_velocity` store has been folded into `posts.velocity` — it was
1:1 with the post, and as an embedded subdocument it is updated with one `$set` and filtered
with one index instead of requiring a join.

```js
// searchQueries — relevance telemetry and synonym mining
{ _id: ObjectId, userId: ObjectId, rawQuery: "my sourdough never rises",
  normalised: "sourdough not rising", intent: "problem_solving",
  resolvedTopicIds: [ ObjectId ], resultCounts: { posts: 42, people: 7, topics: 2 },
  clicked: { kind: "post", id: ObjectId, rank: 2 }, tookMs: 214, createdAt: ISODate }

db.searchQueries.createIndexes([
  { key: { userId: 1, createdAt: -1 } },
  { key: { normalised: 1, createdAt: -1 } },
  { key: { createdAt: 1 }, expireAfterSeconds: 7776000 },   // 90-day retention, TTL-managed
]);
```

```js
// embeddingCache — never pay to embed the same text twice
{ _id: "sha256:…",                  // contentHash IS the _id: free unique index
  model: "bge-base-en-v1.5", embedding: [ ...768 ], createdAt: ISODate }

db.embeddingCache.createIndexes([
  { key: { createdAt: 1 }, expireAfterSeconds: 2592000 },   // 30 days
]);
```

### 8.6.1 Vector storage notes

Store all embeddings **unit-normalised** at write time, and set `similarity: 'cosine'` in
the index. With normalised vectors, cosine and dot product order results identically, so
this costs nothing and makes `EmbeddingVector.cosine()` a plain dot product in application
code.

Recall/latency is tuned per query with `numCandidates`, not by a server-level setting —
which is an improvement on `hnsw.ef_search`, because each retrieval path can choose its own
trade-off:

| Query | `limit` | `numCandidates` | Reasoning |
|---|---|---|---|
| Feed candidate retrieval | 400 | 4000 | Recall matters; this is the input to ranking |
| Semantic post search | 150 | 3000 | 20× over-request, the documented default ratio |
| People search | 50 | 1000 | |
| Related posts | 20 | 400 | |
| Topic resolution | 5 | 100 | Small collection, cheap |

`numCandidates` must be ≥ `limit` and ≤ 10,000. With `quantization: 'scalar'`, over-request
slightly more than you would for unquantised vectors to recover the small recall loss.

Because vectors are embedded in `posts`, **always `$project` the embedding away** as soon as
the vector stage is done. Returning 768 floats for 400 candidates is ~2.5 MB of needless
network transfer per feed request. The one exception is the MMR re-ranker (§14.5), which
needs candidate vectors to compute pairwise similarity — it requests them explicitly and only
for the top 200.

Changing embedding dimension or model is a **new field plus a new index**, backfilled, then
swapped by config — never an in-place edit. `embeddingModel` on each document is what makes a
mixed-model transition safe: query paths filter to the active model until the backfill
completes.

### 8.7 Messaging

```js
// conversations — exactly two participants, canonically ordered so the unique index
// makes get-or-create race-free without a transaction.
{
  _id: ObjectId,
  lowUserId: ObjectId, highUserId: ObjectId,      // lowUserId < highUserId as hex strings
  state: "active",                                 // active|read_only|closed
  // Participants are embedded: exactly two by invariant, and every conversation-list
  // render needs both participants' unread counts and mute state.
  participants: [
    { userId: ObjectId, lastReadAt: ISODate, unreadCount: 0,
      mutedUntil: null, hiddenAt: null }
  ],
  lastMessage: {                                   // embedded preview: the conversation list
    messageId: ObjectId, senderId: ObjectId,       // renders without touching `messages`
    kind: "text", preview: "did you fix the left shelf?", at: ISODate
  },
  createdAt: ISODate
}

db.conversations.createIndexes([
  { key: { lowUserId: 1, highUserId: 1 }, unique: true },
  { key: { 'participants.userId': 1, 'lastMessage.at': -1 } },  // the conversation list query
]);
```

`OpenConversation` is implemented as a single `findOneAndUpdate` with `upsert: true` on the
`(lowUserId, highUserId)` pair. Two devices tapping simultaneously produce one conversation:
one wins, the other gets a duplicate-key error and re-reads. No transaction, no distributed
lock.

```js
// messages
{
  _id: ObjectId, conversationId: ObjectId, senderId: ObjectId,
  kind: "text",                          // text|image|post_share|system
  body: "did you fix the left shelf?",
  media: { mediaId: ObjectId, publicId: "…", version: NumberLong, format: "webp" },
  sharedPost: { postId: ObjectId, authorHandle: "nova",
                preview: { publicId: "…", version: NumberLong, description: "…" } },
  replyToId: ObjectId,
  clientNonce: "c7f1…",                  // retry-safe dedupe
  // Receipts and reactions are embedded: at most 2 receipts and 2 reactions per message
  // in a 1:1 conversation, so the unbounded-array rule is not violated.
  receipts: [ { userId: ObjectId, state: "read", at: ISODate } ],
  reactions: [ { userId: ObjectId, emoji: "🔥", at: ISODate } ],
  hiddenForUserIds: [ ObjectId ],        // delete-for-me, ≤ 2 entries
  editedAt: null, deletedForAllAt: null,
  createdAt: ISODate
}

db.messages.createIndexes([
  { key: { conversationId: 1, _id: -1 } },   // history pagination; _id sorts chronologically
  { key: { conversationId: 1, senderId: 1, clientNonce: 1 }, unique: true, sparse: true },
]);
```

Embedding receipts and reactions is only safe because conversations are strictly 1:1. If
group chats are ever added (explicitly out of scope in §1.3), both become their own
collections — that is the migration this modelling choice defers, and it is the honest cost
of the decision.

### 8.8 Notifications, moderation, plumbing

```js
// notifications — aggregation is done by upserting on groupKey
{
  _id: ObjectId, userId: ObjectId, kind: "post_liked",
  actors: [ { userId: ObjectId, handle: "nova", at: ISODate } ],  // capped at 3 for display
  actorCount: 13,                        // true fan-in: "Nova and 12 others"
  subject: { kind: "post", id: ObjectId, preview: "…" },
  groupKey: "post_liked:68b1…",          // kind + subject
  payload: { },
  readAt: null, createdAt: ISODate, updatedAt: ISODate
}

db.notifications.createIndexes([
  { key: { userId: 1, createdAt: -1 } },
  { key: { userId: 1, readAt: 1, createdAt: -1 } },       // unread filter + badge count
  // One live aggregate per (user, subject) while unread. The partial unique index is what
  // makes "Nova and 12 others liked your post" a single atomic upsert with $inc + $push.
  { key: { userId: 1, groupKey: 1 }, unique: true,
    partialFilterExpression: { readAt: null } },
  { key: { createdAt: 1 }, expireAfterSeconds: 7776000 },  // 90-day retention
]);
```

```js
// devices — push tokens
{ _id: ObjectId, userId: ObjectId, platform: "android", pushToken: "…",
  appVersion: "1.4.0", lastSeenAt: ISODate, createdAt: ISODate }

db.devices.createIndexes([
  { key: { platform: 1, pushToken: 1 }, unique: true },
  { key: { userId: 1 } },
]);

// reports
{ _id: ObjectId, reporterId: ObjectId,
  subject: { kind: "post", id: ObjectId },
  reason: "spam", details: "…", status: "pending",
  resolution: null, resolvedBy: null, createdAt: ISODate, resolvedAt: null }

db.reports.createIndexes([
  { key: { reporterId: 1, 'subject.kind': 1, 'subject.id': 1 }, unique: true },
  { key: { status: 1, createdAt: 1 } },                    // moderation queue
  { key: { 'subject.kind': 1, 'subject.id': 1 } },         // report count per subject
]);

// moderationActions — immutable audit log
{ _id: ObjectId, actorId: ObjectId,            // null = automated
  action: "shadow_limit",                       // remove|shadow_limit|suspend|ban|restore|dismiss
  subject: { kind: "post", id: ObjectId },
  reason: "…", expiresAt: ISODate, createdAt: ISODate }

db.moderationActions.createIndexes([
  { key: { 'subject.kind': 1, 'subject.id': 1, createdAt: -1 } },
  { key: { createdAt: -1 } },
]);
```

```js
// outbox — transactional event log. Written in the SAME transaction as the state change.
{ _id: ObjectId, eventName: "PostPublished",
  aggregate: { kind: "post", id: ObjectId },
  payload: { }, occurredAt: ISODate,
  publishedAt: null, attempts: 0, lastError: null,
  claimedBy: null, claimedAt: null }             // lease fields prevent double-publishing

db.outbox.createIndexes([
  { key: { _id: 1 }, partialFilterExpression: { publishedAt: null } },
  { key: { publishedAt: 1, claimedAt: 1 } },
  { key: { publishedAt: 1 }, expireAfterSeconds: 604800 },  // keep published events 7 days
]);
```

The publisher claims a batch with `findOneAndUpdate` setting `claimedBy` + `claimedAt`, which
means multiple API instances can run the publisher loop without publishing the same event
twice. A claim older than 60 s is considered stale and reclaimable, so a crashed publisher
does not strand events. Handlers must still be idempotent — the guarantee is at-least-once.

```js
// idempotencyKeys — replayed POSTs return the stored response
{ _id: "<Idempotency-Key>",                     // the key IS the _id
  userId: ObjectId, endpoint: "POST /posts",
  requestHash: "sha256:…", statusCode: 201, response: { },
  createdAt: ISODate, expiresAt: ISODate }

db.idempotencyKeys.createIndexes([
  { key: { expiresAt: 1 }, expireAfterSeconds: 0 },   // expire exactly at expiresAt
]);
```

Using the client-supplied key as `_id` makes the concurrent case correct for free: two
simultaneous retries both attempt an insert, one gets `E11000`, and the loser polls for the
winner's stored response instead of executing the use case twice.

### 8.9 Schema validators

Every collection gets a `$jsonSchema` validator, applied by `db:sync-indexes`. It is the
backstop that replaces `NOT NULL` and `CHECK`. Abbreviated example:

```js
db.command({
  collMod: 'posts',
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['authorId', 'description', 'visibility', 'status', 'media', 'createdAt'],
    properties: {
      authorId:    { bsonType: 'objectId' },
      description: { bsonType: 'string', maxLength: 2200 },
      visibility:  { enum: ['public', 'followers'] },
      status:      { enum: ['draft','published','shadow_limited','removed','deleted'] },
      media:       { bsonType: 'array', minItems: 1, maxItems: 10 },
      hashtags:    { bsonType: 'array', maxItems: 30,
                     items: { bsonType: 'string', maxLength: 64 } },
      topics:      { bsonType: 'array', maxItems: 5 },
      embedding:   { bsonType: ['array','null'], minItems: 768, maxItems: 768 },
      counts:      { bsonType: 'object' },
    },
  } },
  validationLevel: 'strict',
  validationAction: 'error',
});
```

Note `minItems: 1, maxItems: 10` on `media` and `maxItems: 30` on `hashtags`: the caps that
§7.1 states as domain invariants are also asserted by the database, so a bug in a new code
path cannot quietly create a post with forty images.

### 8.10 Migrations

There is no DDL, but there is still schema evolution, and it still needs to be ordered and
reviewable. Two mechanisms:

- **Index, search-index, and validator definitions** are declarative TypeScript in
  `infrastructure/persistence/mongo/indexes/`. `pnpm db:sync-indexes` diffs the desired set
  against the live cluster and creates what is missing. It is idempotent and safe to run on
  every deploy. Index builds on Atlas are rolling and non-blocking, but a build on a large
  collection still consumes I/O, so it runs as a pre-deploy job, not on API boot.
- **Data migrations** are numbered scripts in `migrations/`, run by `migrate-mongo`, which
  records applied versions in a `_migrations` collection. Forward-only.

The relational rule still applies and matters more here, because documents are heterogeneous
by default: **expand, migrate, contract across two releases.** Add the new field and write
both; backfill; switch reads; only then stop writing the old field and remove it. Repositories
must tolerate documents from the previous shape for exactly one release, and that tolerance
gets a test.

Search index changes are the exception to "safe to run on every deploy": changing an analyser
or adding a field triggers a full rebuild, during which queries return results from the old
definition. For a breaking relevance change, create a **new** index under a versioned name
(`posts_text_v2`), wait for it to reach `READY`, then flip the index name in config — the same
blue/green discipline used for embedding model changes.

---

## 9. Ports (Interfaces)

Every port below is declared in the inner layers and implemented in
`infrastructure/`. Signatures are normative; add methods only when a use case needs one
(no speculative breadth — that is the I in SOLID).

```ts
// application/ports/UnitOfWork.ts
//
// The context is opaque on purpose. `application/` must not know that it wraps a
// MongoDB ClientSession, and must not be able to forget to pass it: repositories are
// resolved FROM the context, so there is no way to call a repository that silently
// runs outside the transaction.
export interface TransactionContext { readonly _brand: 'tx'; }

export interface Repositories {
  users: UserWriter & UserReader;
  posts: PostRepository;
  follows: FollowGraphWriter & FollowGraphReader;
  followRequests: FollowRequestStore;
  conversations: ConversationRepository;
  messages: MessageRepository;
  // …one entry per aggregate
}

export interface UnitOfWork {
  /**
   * Runs fn inside a single transaction with majority read/write concern.
   * Domain events collected from aggregates during fn are appended to the outbox
   * in the SAME transaction before commit.
   *
   * Retries automatically on TransientTransactionError with jittered backoff.
   * MUST NOT perform network I/O other than to the database inside fn.
   */
  run<T>(fn: (repos: Repositories, ctx: TransactionContext) => Promise<T>): Promise<T>;

  /** Non-transactional access, for the single-document paths in §4.3. */
  repositories(): Repositories;
}
```

```ts
// application/ports/EmbeddingProvider.ts
export interface EmbeddingProvider {
  readonly model: string;
  readonly dimension: number;
  embed(text: string): Promise<EmbeddingVector>;
  embedBatch(texts: readonly string[]): Promise<EmbeddingVector[]>;
}

// Decorator, not a subclass: caching is orthogonal to embedding.
export class CachedEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly inner: EmbeddingProvider,
    private readonly cache: EmbeddingCache,
    private readonly hasher: ContentHasher,
  ) {}
  get model() { return this.inner.model; }
  get dimension() { return this.inner.dimension; }
  async embed(text: string): Promise<EmbeddingVector> {
    const key = this.hasher.hash(`${this.inner.model}:${text}`);
    const hit = await this.cache.get(key);
    if (hit) return hit;
    const v = await this.inner.embed(text);
    await this.cache.put(key, v);
    return v;
  }
  async embedBatch(texts: readonly string[]) { /* partition hits/misses, one batch call */ }
}
```

```ts
// application/feed/pipeline/CandidateSource.ts
export interface CandidateRequest {
  readonly userId: UserId;
  readonly surface: FeedSurface;
  readonly profile: InterestProfile;
  readonly limit: number;
  readonly notOlderThan: Date;
}

export interface CandidateSource {
  /** Stable identifier recorded on each candidate for attribution and A/B analysis. */
  readonly name: string;
  /** Relative trust; used as a tie-break and to size per-source quotas. */
  readonly defaultQuota: number;
  fetch(req: CandidateRequest): Promise<FeedCandidate[]>;
}

// application/feed/pipeline/RankingSignal.ts
export interface SignalContext {
  readonly userId: UserId;
  readonly profile: InterestProfile;
  readonly now: Date;
  readonly config: RankingConfig;
  readonly authorAffinities: ReadonlyMap<string, number>;
  readonly socialProof: ReadonlyMap<string, number>;
}

export interface RankingSignal {
  readonly name: string;
  /** MUST return a value in [0,1] (or [-1,0] for penalty signals). Pure and sync where possible. */
  score(candidate: FeedCandidate, ctx: SignalContext): number;
  /** Optional bulk prefetch so signals never issue per-candidate queries. */
  prepare?(candidates: readonly FeedCandidate[], ctx: SignalContext): Promise<void>;
}

// application/feed/pipeline/Reranker.ts
export interface Reranker {
  readonly name: string;
  apply(ranked: readonly ScoredCandidate[], ctx: SignalContext): ScoredCandidate[];
}
```

```ts
// application/ports/RealtimeGateway.ts
export interface RealtimeGateway {
  emitToUser(userId: UserId, event: string, payload: unknown): Promise<void>;
  emitToConversation(id: ConversationId, event: string, payload: unknown, exclude?: UserId): Promise<void>;
  isOnline(userId: UserId): Promise<boolean>;
}
```

```ts
// application/ports/MediaStorage.ts
//
// Note what is NOT here: no upload(buffer), no stream, no thumbnail(). The API
// process never touches image bytes — the device uploads straight to the provider
// with a signature we mint, and variants are URL-derived. Keeping the port this
// narrow is what makes the provider genuinely swappable.

export interface UploadTicket {
  /** Where the client POSTs the multipart form. */
  readonly uploadUrl: string;
  /** Exactly the fields the client must send, already signed. Pass through verbatim. */
  readonly fields: Readonly<Record<string, string>>;
  readonly publicId: string;
  readonly expiresAt: Date;
}

export interface RemoteAsset {
  readonly publicId: string;
  readonly assetId: string;
  readonly version: number;
  readonly resourceType: string;
  readonly deliveryType: string;
  readonly format: string;
  readonly secureUrl: string;
  readonly etag: string;
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
  readonly moderation?: { status: 'pending' | 'approved' | 'rejected'; kind: string };
  readonly colors?: ReadonlyArray<[string, number]>;
  readonly placeholder?: string;
}

export interface MediaStorage {
  /** Mints a short-lived signed ticket for a direct client upload. No bytes involved. */
  signUpload(input: {
    publicId: string;
    folder: string;
    maxBytes: number;
    allowedFormats: readonly string[];
    ttlSeconds: number;
    moderation: boolean;
    eagerVariants?: readonly string[];
    notificationUrl?: string;
    context?: Record<string, string>;
  }): Promise<UploadTicket>;

  /** Authoritative server-side read of what actually landed. Never trust the client. */
  fetchAsset(publicId: string): Promise<RemoteAsset | null>;

  /** Verifies an inbound provider webhook body against its signature header. */
  verifyWebhook(rawBody: string, signature: string, timestamp: string): boolean;

  destroy(publicIds: readonly string[]): Promise<void>;
  tag(publicId: string, tags: readonly string[]): Promise<void>;
}

// application/ports/MediaUrlBuilder.ts
export type MediaVariant = 'thumb' | 'feed' | 'full' | 'avatar' | 'avatarSmall';

export interface MediaUrlBuilder {
  /** Deterministic, cacheable, signed when the asset is access-controlled. */
  build(asset: { publicId: string; version: number; format: string }, variant: MediaVariant): string;
  buildAll(asset: { publicId: string; version: number; format: string }): Record<MediaVariant, string>;
}
```

```ts
// application/ports/query/FeedQueryService.ts
// A read-model port. Bespoke aggregation pipelines are allowed and expected here; it
// returns projections, never domain entities. Every method MUST project away `embedding`
// unless the caller explicitly needs it (§8.6.1).
export interface FeedQueryService {
  candidatesFromFollowing(userId: UserId, since: Date, limit: number): Promise<FeedCandidateRow[]>;
  candidatesByVector(v: EmbeddingVector, since: Date, limit: number, excludeAuthors: readonly UserId[]): Promise<FeedCandidateRow[]>;
  candidatesByTopics(topicIds: readonly TopicId[], since: Date, limit: number): Promise<FeedCandidateRow[]>;
  candidatesFromNeighbours(userId: UserId, since: Date, limit: number): Promise<FeedCandidateRow[]>;
  trending(since: Date, limit: number): Promise<FeedCandidateRow[]>;
  sharedWithMe(userId: UserId, since: Date, limit: number): Promise<FeedCandidateRow[]>;
  hydrate(postIds: readonly PostId[], viewerId: UserId): Promise<FeedItemProjection[]>;
  authorAffinities(userId: UserId, authorIds: readonly UserId[]): Promise<Map<string, number>>;
  socialProofCounts(userId: UserId, postIds: readonly PostId[]): Promise<Map<string, number>>;
}
```

---

## 10. Use Case Catalog

Each row is one class in `application/`. `Auth` = requires a valid access token.
`Verified` = additionally requires a verified email.

| Context | Use case | Auth | Notes |
|---|---|---|---|
| auth | RegisterUser | – | Creates `pending_verification` user, emits `UserRegistered`, sends verification email |
| auth | VerifyEmail | – | Consumes token, activates account |
| auth | ResendVerification | – | Rate limited 3/hour |
| auth | Login | – | Constant-time failure; emits `UserLoggedIn`; issues token pair |
| auth | RefreshSession | – | Rotates refresh token; reuse of a rotated token revokes the whole family |
| auth | Logout / LogoutAll | Auth | Revokes one session / every session |
| auth | RequestPasswordReset | – | Always returns 202 regardless of email existence |
| auth | ResetPassword | – | Consumes token, revokes all sessions |
| auth | ChangePassword | Auth | Requires current password; revokes other sessions |
| auth | CheckHandleAvailability | – | |
| auth | ListSessions / RevokeSession | Auth | |
| auth | DeactivateAccount / ReactivateAccount | Auth | |
| auth | DeleteAccount | Auth | Requires password; schedules purge |
| profile | GetMyProfile / GetProfileByHandle | optional | Respects privacy + block |
| profile | UpdateProfile | Verified | display name, bio, links, isPrivate |
| profile | SetAvatar / RemoveAvatar | Verified | |
| profile | GetSettings / UpdateSettings | Auth | privacy, notifications, locale |
| profile | GetMyInterests / SetMyInterests | Auth | Onboarding topic picks; seeds interest profile |
| profile | ListUserPosts | optional | |
| social | FollowUser | Verified | Direct or request depending on target privacy |
| social | UnfollowUser | Auth | |
| social | ListFollowers / ListFollowing | optional | |
| social | ListMutuals | Auth | Drives the "can message" list |
| social | ListIncomingFollowRequests / ListOutgoing | Auth | |
| social | AcceptFollowRequest / RejectFollowRequest / CancelFollowRequest | Auth | |
| social | RemoveFollower | Auth | |
| social | BlockUser / UnblockUser / ListBlocked | Auth | Block cascades: unfollow both ways, drop requests, close conversation |
| social | MuteUser / UnmuteUser | Auth | |
| social | GetSuggestedUsers | Auth | Graph + topic + expertise blend |
| media | CreateUploadTickets | Verified | Reserves `mediaAssets` documents and returns signed Cloudinary upload tickets |
| media | ConfirmUpload | Verified | Reads the asset back from Cloudinary, stores real metadata, marks `uploaded` |
| media | HandleCloudinaryNotification | – (signed) | Webhook: applies eager/moderation results, marks `ready` or `rejected` |
| content | CreatePost | Verified | Idempotent via `Idempotency-Key` |
| content | GetPost | optional | |
| content | UpdatePost | Verified | Author only |
| content | DeletePost | Verified | Author only, soft |
| content | ListPostLikers | optional | |
| engagement | LikePost / UnlikePost | Verified | Idempotent |
| engagement | SavePost / UnsavePost / ListSaved | Verified | |
| engagement | CreateSaveCollection / ListCollections | Verified | |
| engagement | SharePostToConversation | Verified | Mutual required; creates message |
| engagement | CreateShareLink | Verified | |
| engagement | RepostPost | Verified | |
| engagement | AddComment / AddReply | Verified | |
| engagement | ListComments / ListReplies | optional | |
| engagement | UpdateComment / DeleteComment | Verified | Author only |
| engagement | LikeComment / UnlikeComment | Verified | |
| engagement | PinComment / UnpinComment | Verified | Post author only |
| engagement | MarkCommentHelpful | Verified | Post author only; expertise signal |
| feed | GetHomeFeed | Auth | Full pipeline |
| feed | GetFollowingFeed | Auth | Chronological, graph-only |
| feed | GetExploreFeed | optional | Personalised discovery, no graph bias |
| feed | GetTopicFeed | optional | |
| feed | RecordImpressions | Auth | Batched; drives quality + seen-set |
| feed | SubmitFeedFeedback | Auth | not_interested / show_more / mute_topic |
| search | Search | optional | Multi-kind, intent-aware |
| search | SearchPosts / SearchPeople / SearchTopics | optional | Kind-specific |
| search | FindExperts | optional | Topic or free-text → ranked people with evidence |
| search | Suggest | optional | Typeahead ≤ 80 ms |
| search | GetTrending | – | Topics + hashtags |
| search | GetSearchHistory / ClearSearchHistory | Auth | |
| messaging | ListConversations | Verified | |
| messaging | OpenConversation | Verified | Idempotent get-or-create, mutual required |
| messaging | GetConversation | Verified | Participant only |
| messaging | ListMessages | Verified | Keyset backwards pagination |
| messaging | SendMessage | Verified | `client_nonce` dedupe; re-checks mutuality |
| messaging | EditMessage / DeleteMessageForMe / DeleteMessageForEveryone | Verified | |
| messaging | MarkConversationRead | Verified | |
| messaging | ReactToMessage / RemoveReaction | Verified | |
| messaging | SetTyping | Verified | WS-preferred |
| messaging | MuteConversation / HideConversation | Verified | |
| messaging | GetUnreadCount | Verified | |
| notification | ListNotifications / MarkRead / MarkAllRead / GetUnreadCount | Auth | |
| notification | RegisterDevice / UnregisterDevice | Auth | |
| notification | GetPreferences / UpdatePreferences | Auth | |
| moderation | ReportSubject | Auth | |
| moderation | ListReports / ResolveReport / ApplyEnforcement | Admin | |

---

## 11. HTTP API Conventions

**Base path** `/api/v1`. The version is in the path; breaking changes require `v2`.

**Content type** `application/json; charset=utf-8`. No form encoding except the
signed image upload, which the client sends directly to Cloudinary as `multipart/form-data`
and which never touches the API.

**Authentication** `Authorization: Bearer <accessToken>`. Access tokens are RS256 JWTs,
TTL 15 min, claims:

```json
{ "sub": "<userId>", "sid": "<sessionId>", "hdl": "nova", "vf": true,
  "rol": ["user"], "iat": 1, "exp": 1, "iss": "prequit", "aud": "prequit-app" }
```

Refresh tokens are opaque 256-bit random strings, delivered in the JSON body (the
mobile client stores them in the OS keychain), TTL 30 days, single use, rotated on every
refresh.

**Success envelope.** Single resource:

```json
{ "data": { "...": "..." } }
```

Collection (cursor paginated):

```json
{
  "data": [ { "...": "..." } ],
  "pageInfo": { "nextCursor": "eyJrIjoi...", "hasMore": true },
  "meta": { "requestId": "018f...", "servedAt": "2026-08-06T17:40:00Z" }
}
```

**Error envelope.** Always this shape, never a bare string:

```json
{
  "error": {
    "code": "NOT_MUTUAL_FOLLOWERS",
    "message": "You can only message people who follow you back.",
    "details": [ { "field": "recipientId", "issue": "not_mutual" } ],
    "requestId": "018f2c9a-..."
  }
}
```

`code` is a stable SCREAMING_SNAKE_CASE identifier the client switches on. `message` is
human-readable and may be localised. Full list in [Appendix A](#appendix-a--error-codes).

**Status codes.** `200` read/update, `201` create (with `Location`), `202` accepted for
async, `204` delete, `400` malformed, `401` missing/invalid token, `403` authenticated
but not permitted, `404` absent **or** hidden by privacy (never leak existence), `409`
conflict/duplicate, `410` gone (deleted post), `413` payload too large, `422` semantic
validation failure, `429` rate limited (with `Retry-After`), `500`, `503`.

**Identifiers.** Every `id` in every payload is a **24-character lowercase hex string** —
the string form of a MongoDB `ObjectId`. Clients treat them as opaque. A malformed id
returns `400 MALFORMED_REQUEST` from the Zod layer, never a 500 from a failed `ObjectId`
cast. Examples in this document abbreviate ids as `68b1…` for readability; the real values
are always 24 hex characters.

**Pagination.** Cursor/keyset only; `?limit=20&cursor=<opaque>`. Cursors are
base64url-encoded JSON, signed with an HMAC so a tampered cursor is rejected rather than
producing a weird scan:

```json
{ "k": "publishedAt", "v": "2026-08-06T12:00:00Z", "id": "68b1...", "d": "desc", "s": "<hmac>" }
```

The tiebreaker `id` is required, not optional: sorting on `publishedAt` alone is not stable
because many posts share a timestamp, so the query is always
`{ $or: [ { publishedAt: { $lt: v } }, { publishedAt: v, _id: { $lt: id } } ] }` with a
matching compound index. Where the sort is purely chronological, sort on `_id` alone — its
leading bytes are a timestamp, so it needs no second key.

`skip`-based pagination is forbidden on user content. `skip` walks and discards documents
server-side, so page 500 costs 500 pages of work.

`limit` default 20, max 50 (100 for messages). Offset pagination is forbidden on any
user-content list.

**Idempotency.** `POST` endpoints that create user-visible content
(`/posts`, `/messages`, `/comments`, `/media/upload-tickets`) accept an
`Idempotency-Key` header (client-generated UUID). The first request stores its response
in `idempotencyKeys` for 24 h; a replay with the same key and the same body hash returns
the stored response; a replay with a different body returns `409 IDEMPOTENCY_KEY_REUSED`.

**Rate limits.** Sliding-window per identity (userId when present, else IP + device
fingerprint), enforced in Redis. Responses carry `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `X-RateLimit-Reset`.

| Bucket | Limit |
|---|---|
| `POST /auth/login` | 10 / 15 min per IP, 5 / 15 min per email |
| `POST /auth/register` | 5 / hour per IP |
| password reset request | 3 / hour per email |
| `POST /posts` | 20 / hour, 100 / day |
| `POST /comments` | 60 / hour |
| like / unlike | 300 / hour |
| follow / unfollow | 200 / hour, 2000 / day |
| `POST /messages` | 120 / min per conversation, 600 / hour total |
| `GET /search*` | 60 / min |
| `GET /feed/*` | 120 / min |
| global authenticated default | 1200 / min |

**Other headers.** `X-Request-Id` (echoed or generated, present on every response and in
every log line), `X-Client-Version` (used for soft deprecation warnings), `ETag` +
`If-None-Match` on profile and post reads.

**Field conventions.** `camelCase` JSON (which matches the document field names, so mappers
stay trivial); ISO-8601 UTC timestamps with `Z`; IDs are hex strings, never numbers or
`{"$oid": …}` — the extended-JSON form must never reach a client; enums lowercase
snake_case; monetary/count values integers;
absent ≠ null (`PATCH` treats an omitted key as "leave alone" and an explicit `null` as
"clear").

---

## 12. Endpoint Reference

Legend: **A** = access token required, **V** = verified email required, **O** = optional
auth (response varies by viewer), **–** = public, **M** = admin role.

### 12.1 Authentication & account

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | – | Create account |
| POST | `/auth/verify-email` | – | Consume verification token |
| POST | `/auth/verify-email/resend` | – | Re-send verification |
| POST | `/auth/login` | – | Exchange credentials for tokens |
| POST | `/auth/refresh` | – | Rotate refresh token |
| POST | `/auth/logout` | A | Revoke current session |
| POST | `/auth/logout-all` | A | Revoke every session |
| POST | `/auth/password/forgot` | – | Email a reset token |
| POST | `/auth/password/reset` | – | Set new password via token |
| POST | `/auth/password/change` | A | Change with current password |
| GET | `/auth/me` | A | Current identity + capability flags |
| GET | `/auth/handle-available?handle=` | – | Handle availability |
| GET | `/auth/sessions` | A | List active sessions |
| DELETE | `/auth/sessions/:sessionId` | A | Revoke one session |
| POST | `/auth/deactivate` | A | Reversible deactivation |
| POST | `/auth/reactivate` | A | Undo deactivation |
| DELETE | `/auth/account` | A | Permanent deletion (password confirm) |

**`POST /auth/register`**

```json
{
  "handle": "nova",
  "displayName": "Nova",
  "email": "nova@example.com",
  "password": "correct horse battery staple",
  "dateOfBirth": "2001-04-17"
}
```

`201`:

```json
{
  "data": {
    "user": { "id": "018f...", "handle": "nova", "displayName": "Nova",
             "status": "pending_verification", "emailVerified": false },
    "nextStep": "verify_email"
  }
}
```

Failures: `409 HANDLE_ALREADY_TAKEN`, `409 EMAIL_ALREADY_REGISTERED`,
`422 UNDERAGE_ACCOUNT`, `422 WEAK_PASSWORD` (min 10 chars, not in the breached-password
list, not similar to handle/email), `422 INVALID_HANDLE`, `429`.

**`POST /auth/login`**

```json
{ "identifier": "nova", "password": "…", "deviceId": "…", "deviceLabel": "Pixel 8" }
```

`200`:

```json
{
  "data": {
    "accessToken": "eyJ…", "expiresIn": 900,
    "refreshToken": "9f2c…", "refreshExpiresIn": 2592000,
    "user": { "id": "018f…", "handle": "nova", "displayName": "Nova",
              "avatarUrl": "https://…", "emailVerified": true,
              "onboardingComplete": false }
  }
}
```

`identifier` accepts handle or email. Invalid credentials always return
`401 INVALID_CREDENTIALS` after a constant-time comparison against a dummy hash when the
user does not exist, so response timing cannot enumerate accounts. Suspended accounts get
`403 ACCOUNT_SUSPENDED` with `payload.until`.

**`POST /auth/refresh`** — `{ "refreshToken": "…" }` → new pair. If the presented token
was already rotated, every session in its `family_id` is revoked immediately and the
response is `401 REFRESH_TOKEN_REUSED`; the client must force re-login. This is the
standard defence against stolen refresh tokens.

### 12.2 Profile & settings

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/users/me` | A | Own full profile |
| PATCH | `/users/me` | V | Update displayName, bio, links, isPrivate |
| PUT | `/users/me/avatar` | V | Set avatar from a confirmed `mediaId` |
| DELETE | `/users/me/avatar` | V | Remove avatar |
| GET | `/users/me/settings` | A | Privacy / notification / locale settings |
| PATCH | `/users/me/settings` | A | Partial update |
| GET | `/users/me/interests` | A | Declared topics |
| PUT | `/users/me/interests` | A | Replace declared topics (min 3) |
| GET | `/users/:handle` | O | Public profile + viewer relationship |
| GET | `/users/:handle/posts` | O | Author timeline |
| GET | `/users/:handle/followers` | O | |
| GET | `/users/:handle/following` | O | |
| GET | `/users/:handle/expertise` | O | Top topics with scores and evidence |
| GET | `/users/suggested` | A | Who to follow |
| GET | `/users/me/saved` | V | Saved posts, `?collectionId=` |

**`GET /users/:handle`** `200`:

```json
{
  "data": {
    "id": "018f…", "handle": "nova", "displayName": "Nova",
    "bio": "Ceramics and cold brew.",
    "avatarUrl": "https://…/avatar/medium.webp",
    "isPrivate": false,
    "counts": { "posts": 84, "followers": 1203, "following": 311 },
    "topTopics": [
      { "slug": "ceramics", "label": "Ceramics", "expertiseScore": 78 },
      { "slug": "glazing",  "label": "Glazing",  "expertiseScore": 64 }
    ],
    "viewer": {
      "isSelf": false,
      "relationship": "following",
      "isMutual": true,
      "canMessage": true,
      "hasPendingRequestFromMe": false,
      "hasPendingRequestToMe": false,
      "isMuted": false,
      "isBlocked": false
    }
  }
}
```

For a private account that the viewer does not follow, `counts` is present but `posts`
lists are `403 PROFILE_IS_PRIVATE`. For a blocking relationship the endpoint returns
`404 USER_NOT_FOUND` — existence is not disclosed.

### 12.3 Social graph

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/users/:userId/follow` | V | Follow or create request |
| DELETE | `/users/:userId/follow` | A | Unfollow |
| DELETE | `/users/:userId/follower` | A | Remove someone who follows you |
| GET | `/follow-requests/incoming` | A | Pending requests to me |
| GET | `/follow-requests/outgoing` | A | My pending requests |
| POST | `/follow-requests/:id/accept` | A | Accept |
| POST | `/follow-requests/:id/reject` | A | Reject |
| DELETE | `/follow-requests/:id` | A | Cancel my outgoing request |
| GET | `/users/me/mutuals` | A | Mutuals (message-eligible), `?q=` filterable |
| POST | `/users/:userId/block` | A | Block |
| DELETE | `/users/:userId/block` | A | Unblock |
| GET | `/users/me/blocks` | A | |
| POST | `/users/:userId/mute` | A | |
| DELETE | `/users/:userId/mute` | A | |
| POST | `/users/:userId/report` | A | |

**`POST /users/:userId/follow`** → `200` with the resulting state, so the client never
has to guess which branch happened:

```json
{ "data": { "relationship": "requested", "requestId": "018f…", "isMutual": false } }
```

or `{ "data": { "relationship": "following", "isMutual": true } }`.

Errors: `409 ALREADY_FOLLOWING`, `409 FOLLOW_REQUEST_PENDING`,
`403 BLOCKED_RELATIONSHIP`, `422 CANNOT_FOLLOW_SELF`, `429 FOLLOW_RATE_EXCEEDED`.

Accepting a request runs in one transaction: insert the follow edge, mark the request
`accepted`, bump both counters, refresh `mutualPairs`, emit
`FollowRequestAccepted` + possibly `MutualEstablished` (which the notification handler
turns into a "you can now message" hint).

### 12.4 Media (Cloudinary)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/media/upload-tickets` | V | Reserve asset documents, return signed Cloudinary tickets |
| POST | `/media/:mediaId/confirm` | V | Server verifies the upload and stores real metadata |
| GET | `/media/:mediaId` | O | Delivery URLs for every variant |
| POST | `/webhooks/cloudinary` | signed | Cloudinary notification callback |

**`POST /media/upload-tickets`**

```json
{ "purpose": "post",
  "items": [ { "mimeType": "image/jpeg", "byteSize": 2411233 } ] }
```

`201` — the server returns the exact form fields to send. The client MUST pass them
through verbatim; it must never construct or modify a signature, and the API secret is
never sent to the device.

```json
{
  "data": [ {
    "mediaId": "018f2c9a-7b41-7c3e-9d10-4f2a6b8c1e55",
    "uploadUrl": "https://api.cloudinary.com/v1_1/prequit/image/upload",
    "method": "POST",
    "contentType": "multipart/form-data",
    "fields": {
      "file": "<attach the binary here>",
      "api_key": "419...",
      "timestamp": "1785000000",
      "signature": "0f9c1d7b2e...",
      "public_id": "prequit/post/018f2c9a.../a1b2c3d4",
      "folder": "prequit/post/018f2c9a...",
      "moderation": "aws_rek",
      "eager": "c_fill,w_320,h_320,g_auto,f_auto,q_auto|c_limit,w_1080,f_auto,q_auto",
      "eager_async": "true",
      "notification_url": "https://api.prequit.app/api/v1/webhooks/cloudinary",
      "context": "mediaId=018f2c9a...|ownerId=018f...|purpose=post"
    },
    "expiresAt": "2026-08-06T17:55:00Z"
  } ]
}
```

The signature is `sha256` (or `sha1`) over the alphabetically-sorted, `&`-joined
signable parameters plus the API secret — computed by
`cloudinary.utils.api_sign_request(params, apiSecret)`. `file`, `api_key`, and
`resource_type` are excluded from signing. TTL is enforced by Cloudinary: an upload
attempted more than one hour after `timestamp` is rejected, and the API sets
`MEDIA_PRESIGN_TTL_SECONDS` (default 900 s) as the ticket's advertised `expiresAt` so
the client refreshes proactively.

Constraints, enforced in **three** places because client-side limits are advisory:

1. In the ticket — `allowed_formats` and `max_bytes` are signed parameters, so Cloudinary
   itself rejects an oversized or wrong-format file.
2. In the upload preset — a locked, signed-mode preset (`prequit_post`) is the fallback
   guard if a parameter is ever omitted.
3. In `POST /media/:mediaId/confirm` — the server calls the Admin API and compares the
   real `bytes`, `format`, `width`, `height`, and `resource_type` against policy,
   returning `422 MEDIA_VALIDATION_FAILED` on any mismatch and destroying the asset.

Allowed: `jpg | jpeg | png | webp | heic`, ≤ 15 MB each, ≤ 10 per ticket request.

**`POST /media/:mediaId/confirm`** — the client calls this after Cloudinary returns
`200`. The body is the provider response, but it is treated as a **hint only**:

```json
{ "publicId": "prequit/post/018f2c9a.../a1b2c3d4", "version": 1785000123,
  "signature": "abc123…" }
```

The server independently verifies with `cloudinary.v2.api.resource(publicId)`, which is
what defends against a client that fabricates dimensions or points at somebody else's
asset. It also checks that `publicId` starts with the folder prefix minted for this
`mediaId` and this owner — otherwise `403 FORBIDDEN`. On success it writes the real
metadata, sets `status='uploaded'`, and enqueues `media.finalize`.

`202`:

```json
{ "data": { "mediaId": "018f…", "status": "uploaded",
            "moderationStatus": "pending",
            "urls": { "thumb": "https://res.cloudinary.com/prequit/image/upload/c_fill,w_320,h_320,g_auto,f_auto,q_auto/v1785000123/prequit/post/018f…/a1b2c3d4.webp",
                      "feed":  "https://res.cloudinary.com/prequit/image/upload/c_limit,w_1080,f_auto,q_auto/v1785000123/prequit/post/018f…/a1b2c3d4.webp",
                      "full":  "https://res.cloudinary.com/prequit/image/upload/c_limit,w_1920,f_auto,q_auto/v1785000123/prequit/post/018f…/a1b2c3d4.webp" } } }
```

**`POST /webhooks/cloudinary`** — no bearer token; authenticated by the
`X-Cld-Signature` + `X-Cld-Timestamp` headers, verified against the **raw** request body
(Fastify must be configured to retain it for this route) using
`cloudinary.utils.verifyNotificationSignature`. A stale timestamp (> 5 min) or a bad
signature returns `401` and is logged as a security event. Handled
`notification_type`s: `upload`, `eager`, `moderation`, `delete`. The handler is idempotent
and keyed on `(public_id, notification_type, version)`.

Moderation outcome mapping: `approved` → `status='ready'`; `rejected` →
`status='rejected'` plus destroy the asset, notify the owner, and unpublish any post that
already referenced it.

### 12.5 Posts

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/posts` | V | Publish |
| GET | `/posts/:postId` | O | Read |
| PATCH | `/posts/:postId` | V | Edit description / alt text / topics |
| DELETE | `/posts/:postId` | V | Soft delete |
| GET | `/posts/:postId/likes` | O | Likers |
| POST | `/posts/:postId/like` | V | Like (idempotent) |
| DELETE | `/posts/:postId/like` | V | Unlike |
| POST | `/posts/:postId/save` | V | Save, optional `collectionId` |
| DELETE | `/posts/:postId/save` | V | Unsave |
| POST | `/posts/:postId/shares` | V | Share to conversations / link / repost |
| POST | `/posts/:postId/report` | A | Report |
| POST | `/posts/:postId/not-interested` | A | Negative feed signal |
| GET | `/posts/:postId/related` | O | Vector-similar posts |

**`POST /posts`** (`Idempotency-Key` recommended)

```json
{
  "description": "First cone-6 firing of the year. Reduction was uneven on the left shelf — cracked the lid at 900°C to even it out. #ceramics #kiln",
  "media": [ { "mediaId": "018f…", "altText": "Opened kiln with six glazed bowls" } ],
  "visibility": "public",
  "topics": ["ceramics"],
  "locationLabel": "Studio"
}
```

`201`:

```json
{
  "data": {
    "id": "018f…",
    "author": { "id": "018f…", "handle": "nova", "displayName": "Nova", "avatarUrl": "…" },
    "description": "First cone-6 firing…",
    "media": [ { "id": "018f…",
                 "urls": { "thumb": "https://res.cloudinary.com/prequit/image/upload/c_fill,w_320,h_320,g_auto,f_auto,q_auto/v1785000123/prequit/post/018f…/a1b2c3d4.webp",
                           "feed":  "https://res.cloudinary.com/prequit/image/upload/c_limit,w_1080,f_auto,q_auto/v1785000123/prequit/post/018f…/a1b2c3d4.webp",
                           "full":  "https://res.cloudinary.com/prequit/image/upload/c_limit,w_1920,f_auto,q_auto/v1785000123/prequit/post/018f…/a1b2c3d4.webp" },
                 "width": 3024, "height": 4032,
                 "placeholder": "data:image/webp;base64,UklGR…",
                 "altText": "Opened kiln with six glazed bowls" } ],
    "hashtags": ["ceramics", "kiln"],
    "mentions": [],
    "topics": [ { "slug": "ceramics", "label": "Ceramics", "weight": 1.0, "source": "author" } ],
    "visibility": "public",
    "counts": { "likes": 0, "comments": 0, "shares": 0, "saves": 0 },
    "viewer": { "hasLiked": false, "hasSaved": false, "canEdit": true, "canDelete": true },
    "enrichmentStatus": "pending",
    "publishedAt": "2026-08-06T17:42:11Z"
  }
}
```

`enrichmentStatus` is `pending | ready`; classification, embedding, and search indexing
complete within seconds. The post is immediately visible on the author's profile and to
their followers' following-feed; it becomes eligible for discovery surfaces once
`ready`.

**`POST /posts/:postId/shares`**

```json
{ "targets": [
    { "kind": "conversation", "userId": "018f…", "note": "this is the glaze I meant" },
    { "kind": "external_link" }
] }
```

`201`:

```json
{ "data": {
    "delivered": [ { "kind": "conversation", "conversationId": "018f…", "messageId": "018f…" } ],
    "link": { "url": "https://prequit.app/p/aB3xY9", "expiresAt": null },
    "failed": [ { "kind": "conversation", "userId": "018f…", "code": "NOT_MUTUAL_FOLLOWERS" } ]
} }
```

Partial success is intentional: sharing to five friends where one has unfollowed you
should not fail the whole call.

### 12.6 Comments

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/posts/:postId/comments` | O | Top-level, `?sort=top|new`, 2 preview replies each |
| POST | `/posts/:postId/comments` | V | Add comment, optional `parentId` |
| GET | `/comments/:commentId/replies` | O | Paginated replies |
| PATCH | `/comments/:commentId` | V | Edit (author) |
| DELETE | `/comments/:commentId` | V | Delete (author or post author) |
| POST | `/comments/:commentId/like` | V | |
| DELETE | `/comments/:commentId/like` | V | |
| POST | `/comments/:commentId/pin` | V | Post author only |
| DELETE | `/comments/:commentId/pin` | V | |
| POST | `/comments/:commentId/helpful` | V | Post author marks helpful → expertise signal |
| POST | `/comments/:commentId/report` | A | |

`sort=top` orders by `{ 'counts.likes': -1, helpfulAt: -1, createdAt: -1 }` with the
pinned comment always first.

### 12.7 Feed

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/feed/home` | A | Personalised ranked feed |
| GET | `/feed/following` | A | Chronological, followed authors only |
| GET | `/feed/explore` | O | Discovery; personalised when authenticated |
| GET | `/feed/topics/:slug` | O | Single-topic feed, `?sort=top|new` |
| POST | `/feed/impressions` | A | Batch impression + dwell telemetry |
| POST | `/feed/feedback` | A | `not_interested` / `show_more` / `mute_topic` / `mute_author` |

**`GET /feed/home?limit=20&cursor=…`**

```json
{
  "data": [
    {
      "post": { "...": "same shape as GET /posts/:id" },
      "ranking": {
        "reason": { "kind": "topic_affinity", "label": "Because you engage with Ceramics",
                    "topicSlug": "ceramics" },
        "sources": ["interest_vector", "topic_affinity"],
        "score": 0.7412,
        "isExploration": false
      }
    }
  ],
  "pageInfo": { "nextCursor": "eyJzIjoiMDE4Zi4uLiIsInAiOjIwfQ", "hasMore": true },
  "meta": { "requestId": "018f…", "sessionId": "018f…", "generatedAt": "2026-08-06T17:42:00Z",
            "strategy": "pipeline_v1", "experiment": "ranking_default" }
}
```

`ranking.reason` is required — every item must be explainable to the user, and it is what
the client renders as the "why am I seeing this" line. `ranking.score` and `sources` are
only included when the caller sends `X-Debug-Ranking: 1` **and** the account has the
debug flag; otherwise they are omitted.

The cursor encodes `(sessionId, offset)` and points into a ranked list cached in Redis
(see §14.7), so pages 2..N are cheap and stable — the user never sees a post twice
because of a re-rank between pages.

**`POST /feed/impressions`** (fire-and-forget, `202`)

```json
{ "sessionId": "018f…",
  "events": [
    { "postId": "018f…", "position": 3, "surface": "home",
      "shownAt": "2026-08-06T17:42:03Z", "dwellMs": 4200,
      "mediaViewed": 2, "expandedDescription": true } ] }
```

Dwell time is the highest-volume, highest-value implicit signal. The client MUST send it.
The server clamps `dwellMs` to `[0, 120000]` and normalises by description length so a
long post is not automatically "more interesting".

### 12.8 Search & discovery

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/search` | O | Unified: posts + people + topics |
| GET | `/search/posts` | O | Posts only |
| GET | `/search/people` | O | People only, expertise-ranked |
| GET | `/search/topics` | O | Topics/hashtags |
| GET | `/search/experts` | O | `?topic=` or `?q=` → ranked people with evidence |
| GET | `/search/suggest` | O | Typeahead |
| GET | `/search/trending` | – | Trending topics + hashtags |
| GET | `/search/history` | A | Recent queries |
| DELETE | `/search/history` | A | Clear (optionally one `?queryId=`) |
| POST | `/search/click` | A | Click-through telemetry for relevance tuning |
| GET | `/topics` | – | Browse topic tree |
| GET | `/topics/:slug` | O | Topic detail + top contributors |
| POST | `/topics/:slug/follow` | A | |
| DELETE | `/topics/:slug/follow` | A | |

**`GET /search?q=my%20sourdough%20never%20rises&limit=20`**

```json
{
  "data": {
    "interpretation": {
      "intent": "problem_solving",
      "normalisedQuery": "sourdough not rising",
      "keywords": ["sourdough", "rise", "proof"],
      "topics": [ { "slug": "bread-baking", "label": "Bread Baking", "confidence": 0.91 },
                  { "slug": "fermentation", "label": "Fermentation", "confidence": 0.64 } ],
      "expandedTerms": ["starter", "proofing", "gluten", "hydration"]
    },
    "posts": [
      {
        "post": { "...": "post shape" },
        "match": {
          "score": 0.87,
          "channels": ["semantic", "lexical"],
          "highlights": [ "…my <em>sourdough</em> wouldn't <em>rise</em> until I fixed the starter feed ratio…" ],
          "solutionSignals": { "hasSteps": true, "authorMarkedHelpfulComments": 2,
                               "engagementPercentileInTopic": 0.94 }
        }
      }
    ],
    "people": [
      {
        "user": { "id": "018f…", "handle": "levain", "displayName": "Levain",
                  "avatarUrl": "…", "bio": "Baker. 900 loaves and counting." },
        "expertise": {
          "topic": { "slug": "bread-baking", "label": "Bread Baking" },
          "score": 91,
          "confidence": 0.88,
          "isEmerging": false,
          "evidence": {
            "postsInTopic": 63,
            "helpfulComments": 41,
            "medianEngagementPercentile": 0.89,
            "topPosts": [ { "id": "018f…", "thumbUrl": "…", "likeCount": 2401 } ]
          }
        },
        "viewer": { "relationship": "none", "isMutual": false, "canMessage": false },
        "why": "Answers questions about Bread Baking and 41 of those answers were marked helpful"
      }
    ],
    "topics": [ { "slug": "bread-baking", "label": "Bread Baking", "postCount": 18402,
                  "isFollowing": false } ]
  },
  "pageInfo": { "nextCursor": null, "hasMore": false },
  "meta": { "requestId": "018f…", "tookMs": 214 }
}
```

`interpretation` is the contract that makes the search feel intelligent: the client can
render "Showing results for **sourdough not rising** in **Bread Baking**" and offer the
expanded terms as refinement chips.

### 12.9 Messaging

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/conversations` | V | List, ordered by `lastMessageAt`, `?q=` filters by participant |
| POST | `/conversations` | V | Get-or-create with a mutual (`{ "userId": "…" }`) |
| GET | `/conversations/:id` | V | Detail + participant + permissions |
| DELETE | `/conversations/:id` | V | Hide for me |
| POST | `/conversations/:id/mute` | V | `{ "durationMinutes": 480 }` or null = forever |
| DELETE | `/conversations/:id/mute` | V | |
| GET | `/conversations/:id/messages` | V | Keyset, newest-first |
| POST | `/conversations/:id/messages` | V | Send |
| POST | `/conversations/:id/read` | V | `{ "upToMessageId": "…" }` |
| POST | `/conversations/:id/typing` | V | Prefer the WS event |
| GET | `/conversations/unread-count` | V | Badge total |
| PATCH | `/messages/:id` | V | Edit text (author, ≤ 15 min) |
| DELETE | `/messages/:id` | V | `?scope=me|everyone` |
| PUT | `/messages/:id/reaction` | V | `{ "emoji": "🔥" }` |
| DELETE | `/messages/:id/reaction` | V | |

**`POST /conversations`** is idempotent: given the same pair it always returns the same
conversation, `201` on first creation and `200` thereafter. It returns
`403 NOT_MUTUAL_FOLLOWERS` when the pair is not mutual — this is the single enforcement
point the client can rely on, and it is backed by `MutualityPolicy`.

**`POST /conversations/:id/messages`**

```json
{ "kind": "text", "body": "did you fix the left shelf?", "clientNonce": "c7f1…",
  "replyToId": null }
```

`201`:

```json
{ "data": { "id": "018f…", "conversationId": "018f…", "senderId": "018f…",
            "kind": "text", "body": "did you fix the left shelf?",
            "state": "sent", "createdAt": "2026-08-06T17:44:02Z" } }
```

`clientNonce` makes retries safe: a duplicate returns `200` with the original message
rather than creating a second one. `kind: "image"` requires a confirmed `mediaId`;
`kind: "post_share"` requires `sharedPostId` and the sender must be able to see that
post.

### 12.10 Notifications, telemetry, moderation, ops

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/notifications` | A | `?filter=all|unread|mentions` |
| GET | `/notifications/unread-count` | A | |
| POST | `/notifications/:id/read` | A | |
| POST | `/notifications/read-all` | A | |
| GET | `/notifications/preferences` | A | |
| PATCH | `/notifications/preferences` | A | Per-kind, per-channel toggles + quiet hours |
| POST | `/devices` | A | Register push token (upsert) |
| DELETE | `/devices/:id` | A | |
| POST | `/reports` | A | Unified report endpoint |
| GET | `/admin/reports` | M | Queue |
| POST | `/admin/reports/:id/resolve` | M | |
| POST | `/admin/users/:id/suspend` | M | |
| POST | `/admin/posts/:id/remove` | M | |
| GET | `/admin/ranking/config` | M | Live weights |
| PUT | `/admin/ranking/config` | M | Adjust weights without deploy |
| GET | `/health/live` | – | Process is up |
| GET | `/health/ready` | – | DB + Redis + storage reachable |
| GET | `/metrics` | – | Prometheus (internal network only) |
| GET | `/version` | – | Build SHA, started-at |

---

## 13. Realtime (WebSocket) Protocol

Namespace `/realtime`, `socket.io` v4, Redis adapter for cross-instance fan-out.

**Handshake.** The client connects with `auth: { token: "<accessToken>" }`. The server
verifies it, loads `userId`, joins room `user:<userId>`, and joins
`conversation:<id>` for every active conversation. An invalid or expired token gets
`connect_error` with `{ code: "UNAUTHENTICATED" }` and the client must refresh and
reconnect. When the access token expires mid-connection the client emits
`auth:refresh` with the new token; failure to do so within 60 s of expiry disconnects.

**Client → server**

| Event | Payload | Ack |
|---|---|---|
| `message:send` | `{ conversationId, kind, body?, mediaId?, sharedPostId?, replyToId?, clientNonce }` | `{ ok, message }` or `{ ok: false, error }` |
| `message:read` | `{ conversationId, upToMessageId }` | `{ ok }` |
| `typing:start` / `typing:stop` | `{ conversationId }` | – |
| `presence:ping` | – | – (every 30 s; also refreshes `last_active_at`) |
| `conversation:subscribe` | `{ conversationId }` | `{ ok }` |
| `auth:refresh` | `{ token }` | `{ ok }` |

**Server → client**

| Event | Payload |
|---|---|
| `message:new` | full message DTO |
| `message:updated` | `{ id, body, editedAt }` |
| `message:deleted` | `{ id, scope }` |
| `message:receipt` | `{ messageId, userId, state, at }` |
| `message:reaction` | `{ messageId, userId, emoji, removed }` |
| `typing` | `{ conversationId, userId, isTyping }` |
| `presence` | `{ userId, status: "online"\|"offline", lastSeenAt? }` |
| `conversation:created` | conversation DTO (when a new mutual opens a chat) |
| `conversation:state` | `{ id, state }` (e.g. became `read_only`) |
| `notification:new` | notification DTO |
| `notification:count` | `{ unread }` |
| `feed:new-posts` | `{ count }` — "N new posts" pill, no payload |

**Guarantees.** At-least-once delivery to connected sockets; the client MUST dedupe by
message `id`. Realtime is an accelerator, not the source of truth: on reconnect the
client re-syncs via `GET /conversations` + `GET /conversations/:id/messages?since=`.
`message:send` over WS and `POST /messages` share the same use case and the same
`clientNonce` dedupe, so a client may use either or both.

**Presence.** `presence:online:<userId>` key in Redis with a 45 s TTL refreshed by
`presence:ping`. Presence is only broadcast to mutuals, and only if the user's
`settings.privacy.showActivityStatus` is true.

---

## 14. The Feed Ranking Engine

This is the product's core differentiator and the most carefully specified subsystem.
The design goal: **the home feed should reflect what a user demonstrably cares about —
derived from what they publish, what they like, and what they comment on — not merely
who they follow.**

### 14.1 Signal inventory

Every user action becomes a weighted training signal. Weights are *relative importance*
of the evidence, not scores.

| Action | Weight | Rationale |
|---|---|---|
| Published own post (description text) | **1.00** | The strongest statement of interest — you chose to make it |
| Saved a post | 0.95 | High-intent, private, uncoerced |
| Shared to a friend | 0.90 | Endorsement strong enough to spend social capital |
| Wrote a comment (own comment text also embedded) | 0.85 | Effortful; the comment text itself is extra signal |
| Wrote a reply | 0.70 | |
| Liked a post | 0.55 | Cheap, plentiful |
| Liked a comment | 0.30 | |
| Followed the author after seeing a post | 0.60 | |
| Visited author profile from post | 0.35 | |
| Long dwell (normalised, see below) | 0.40 × ratio | Best implicit signal available |
| Viewed all media in a carousel | 0.25 | |
| Expanded a truncated description | 0.20 | |
| Impression with no action | 0.00 | Not evidence of interest, but feeds seen-suppression |
| Short dwell (< 800 ms) after ≥ 2 impressions | −0.25 | Repeated fast scroll-past |
| `not_interested` | **−1.00** | Explicit negative → negative vector |
| Muted author / muted topic | −1.00 | Hard exclusion, plus negative signal |
| Hid post | −0.80 | |
| Reported post | −1.00 | Also a safety signal |

**Dwell normalisation.** Raw dwell is confounded by content length and by media count.

```
expectedMs = 600 + 12 * min(descriptionLength, 900) + 700 * mediaCount
dwellRatio = clamp(dwellMs / expectedMs, 0, 3)
dwellSignal = 0.40 * min(dwellRatio, 1.5) / 1.5      // saturates; no reward for idling
```

**Position-bias correction.** An item at slot 1 gets far more engagement than the same
item at slot 18. When computing a post's *quality*, weight each impression by the inverse
propensity of its slot:

```
propensity(position) = 1 / (1 + 0.09 * position)     // fitted; recalibrate monthly
effectiveImpressions = Σ over impressions of 1 / propensity(position)
```

Failing to do this makes the ranker self-confirming — it would learn that whatever it
already ranks first is good.

### 14.2 The interest profile

Three artefacts per user, all in the one `userInterestProfiles` document (§8.6) — the vectors
as fields, the affinities as an embedded capped array. One document read per feed request
loads all three.

**(a) Positive interest vector.** Exponentially-decayed weighted mean of the embeddings
of everything the user engaged with positively.

For an interaction with weight `w` on content with embedding `e`, at time `t`, updating a
profile last touched at `t₀`:

```
decay  = exp(-(t - t₀) / τ)                 τ = 21 days
v_new  = normalise(v_old * decay + e * w)
```

This is an online update — O(dimension), no history scan — so it runs inside the
engagement worker on every event. `interaction_count` increments.

**(b) Negative interest vector.** Identical update using only negative-weight
interactions (`|w|` as magnitude), with a shorter τ = 10 days, because dislikes go stale
faster than likes.

**(c) Topic affinity map.** Sparse, interpretable, and used both for retrieval and for
the human-readable "why you're seeing this" line.

```
for each topic t assigned to the content with topic weight tw:
   affinity(t) ← clamp( affinity(t) * exp(-Δt / τ_topic) + w * tw * η , 0, 1 )
   τ_topic = 30 days,  η = 0.25 (learning rate)
   // exploration arms
   alpha(t) += max(0, w) ;  beta(t) += max(0, -w)
```

Declared onboarding interests seed affinities at `0.5` with `source='declared'`; they
decay like anything else, so a topic the user picked but never engages with fades.

**Nightly correction job.** Online updates drift (order-dependence, lost events). A
nightly job recomputes both vectors and all affinities from scratch over the last 90 days
of `interactionEvents` for users with activity that day, and overwrites. Recomputation
is deterministic and unit-tested against a fixture event stream — this is the reference
implementation, and the online path must agree with it within a cosine tolerance of
0.02 (asserted in an integration test).

**Cold start.** A brand-new user has no vector.

```
personalisationRamp = min(1, interactionCount / 25)
```

- `interactionCount = 0`: initial vector = mean of the centroids of declared topics
  (onboarding requires ≥ 3). Feed = 40% declared-topic top posts, 40% trending,
  20% high-expertise authors in declared topics.
- `0 < ramp < 1`: blend — `score = ramp * personalScore + (1 - ramp) * popularityScore`.
- `ramp = 1`: full pipeline.

A user who skipped onboarding gets trending + geo/locale-popular content and is prompted
to pick topics; the ramp then applies as normal.

### 14.3 Pipeline stages

```
GetHomeFeedUseCase
  1. LOAD        profile, config, viewer relationships, seen-set handle
  2. RETRIEVE    run every CandidateSource in parallel (quota'd)     → ~1500 candidates
  3. DEDUPE      by postId; merge source attribution
  4. FILTER      chain of FeedFilter                                  → ~900 candidates
  5. HYDRATE     two batched $in queries (posts, then authors)
  6. SCORE       every RankingSignal over every candidate (pure, in-memory)
  7. COMBINE     weighted sum, then multiplicative penalties
  8. RERANK      Reranker chain (seen-suppression, MMR, author/topic caps, exploration)
  9. CACHE       write the ranked ID list to Redis under sessionId, TTL 15 min
 10. SERVE       hydrate + present the first page; emit FeedServed
```

Stage 2 sources and default quotas (retrieval is *recall*-oriented; precision is stage 6's
job):

| Source | Quota | Query |
|---|---|---|
| `FollowingSource` | 400 | `follows` by `followerId` → `posts` where `authorId ∈ followees`, `publishedAt > now-7d`. Two queries, not a `$lookup`: for a user following thousands of accounts, `$in` on an indexed field beats a join |
| `InterestVectorSource` | 400 | `$vectorSearch` on `posts_vector` with the positive interest vector, `numCandidates: 4000` |
| `TopicAffinitySource` | 300 | Top 8 affinity topics → `{ topicIds: { $in }, qualityScore: -1 }` over the last 10 d, served entirely by the `topicIds_qualityScore_publishedAt` index |
| `CoEngagementSource` | 200 | Top 30 `userNeighbours` → their `likes`/`saves` from the last 5 d → `postId`s the viewer has not seen |
| `TrendingSource` | 150 | `posts` sorted by `velocity.h24`, last 48 h, plus a topic-stratified slice so trending is not single-topic dominated |
| `SharedWithMeSource` | 50 | `shares` by `recipientId`, last 3 d — always injected near the top |

**The pre-filter constraint drives the design of `InterestVectorSource`.** `$vectorSearch`
must be the first stage in its pipeline, so anything that needs to reduce the candidate set
has to go in the stage's own `filter`, using only paths declared as `filter` in the index
definition (§8.3). Filtering afterwards with `$match` does not work: the ANN search has
already returned its `limit` documents, so post-filtering shrinks the result instead of
searching deeper, and a user who blocks a few prolific accounts would get a visibly emptier
feed.

```js
// pipelines/feedCandidates.ts — interestVectorPipeline()
[
  { $vectorSearch: {
      index: 'posts_vector',
      path: 'embedding',
      queryVector: profile.positiveVector,       // 768 unit-normalised floats
      numCandidates: 4000,                        // 10x limit; recall matters most here
      limit: 400,
      filter: {                                   // ONLY index-declared filter paths
        status: 'published',
        visibility: 'public',
        publishedAt: { $gte: since14d },
        authorId: { $nin: excludedAuthorIds },    // blocked + muted + self, from Redis (§8.2)
      },
  } },
  { $addFields: { vectorScore: { $meta: 'vectorSearchScore' } } },
  // Drop the 768-float payload immediately: 400 candidates x 768 floats is ~2.5 MB
  { $project: { embedding: 0, imageText: 0, topComments: 0 } },
]
```

`excludedAuthorIds` is capped at 1,000 entries. Beyond that the array itself makes the filter
expensive, so the source falls back to an unfiltered search with a larger `limit` and
post-filters in application code — the recall loss is acceptable for the rare user who has
blocked more than a thousand accounts.

All six sources run concurrently with a per-source timeout of 120 ms. A source that times out
is skipped and logged; the feed degrades in quality, never in availability. If *all* sources
fail, fall back to `TrendingSource` with a 3 s timeout, and if that fails too, return the
chronological following feed.

Stage 4 filters run in application code, in this order (cheapest and most-eliminating first).
Note the division of labour: whatever *can* be pushed into a query's `filter` is, and these
handle what cannot be — cross-collection predicates and probabilistic structures.

1. `BlockFilter` — either direction, from the cached exclusion set. Already applied inside
   the vector filter; still applied here because other sources do not filter on author.
2. `MuteFilter` — muted authors and muted topics.
3. `VisibilityFilter` — `followers`-only posts require an edge; `shadow_limited` posts are
   only visible to followers; `removed`/`deleted` never.
4. `ModerationFilter` — pending high-severity reports are withheld from discovery
   surfaces.
5. `SelfPostFilter` — own posts excluded from home (they appear on the profile).
6. `SeenFilter` — hard-exclude posts impressed ≥ 3 times in the last 7 days. Backed by a
   Redis Bloom filter per user (`feed:seen:<userId>`, 30-day rotation, 0.1% false
   positive rate — a 1-in-1000 chance of never showing an eligible post is a fair trade
   for O(1) membership on millions of items). This cannot be a database predicate at all,
   which is exactly why it lives here.
7. `UnenrichedFilter` — posts with `enrichedAt: null` are ineligible for
   `InterestVectorSource` results but still allowed from `FollowingSource` (a followed
   author's brand-new post should appear immediately).

**Hydration** is one `$in` query on `posts` by `_id` plus one on `users` for the authors,
merged in application code — deliberately not a `$lookup`. Two indexed `$in` lookups of ~20
documents each are faster and easier to reason about than a join, and they keep the author
document out of the post's read model, so `ProfileQueryService` stays the single place that
knows how to project a user.

### 14.4 Scoring

Each `RankingSignal` returns `[0,1]`. The combination:

```
base    = Σ  wᵢ · sᵢ                    (weights in Appendix B, Σwᵢ = 1)
penalty = Π  pⱼ                          (each pⱼ ∈ (0,1])
score   = base · penalty + explorationBonus
```

**S1 — SemanticRelevance** (w = 0.28)

```
raw = cosine(post.embedding, profile.positiveVector)
s1  = (raw + 1) / 2                       // map [-1,1] → [0,1]
```

**S2 — TopicAffinity** (w = 0.16)

```
s2 = Σ over topics t of post:  topicWeight(post,t) · affinity(user,t)
s2 = min(1, s2)
```

**S3 — AuthorAffinity** (w = 0.19) — the single strongest predictor in practice, so it
blends graph structure with measured interaction history:

```
graphScore = 1.00 if mutual
             0.80 if viewer follows author
             0.55 if author follows viewer
             0.45 if ≥ 3 of viewer's followees follow author
             0.25 if ≥ 1 of viewer's followees follows author
             0.05 otherwise

historyScore = min(1, log1p(weightedInteractions(viewer, author, 60d)) / log1p(25))
s3 = 0.55 * graphScore + 0.45 * historyScore
```

**S4 — ContentQuality** (w = 0.14) — `QualityScore` from §7.2, using
position-bias-corrected impressions and the author's historical prior so a new post is
neither punished for having no data nor allowed to free-ride.

**S5 — Freshness** (w = 0.11)

```
s5 = exp(-ln(2) · ageHours / halfLife)
halfLife = 18h  for candidates from FollowingSource
           36h  for discovery sources
           6h   for TrendingSource
```

Recency is deliberately *not* the dominant term: a two-day-old post that matches the
user's interests precisely should outrank a two-hour-old post that does not.

**S6 — SocialProof** (w = 0.08)

```
n  = number of accounts the viewer follows who liked/commented/saved this post
s6 = log1p(n) / log1p(10)      clamped to 1
```

**S7 — NegativeInterest** (penalty, not additive)

```
neg = cosine(post.embedding, profile.negativeVector)
p_neg = 1 - 0.45 * max(0, neg)        // strong dislike match → up to 55% suppression
```

Penalties:

| Penalty | Value |
|---|---|
| Author repetition | 2nd post by the same author in this ranking → `×0.55`; 3rd → `×0.30`; 4th+ → `×0.12` |
| Topic saturation | If this topic already fills > 30% of the emitted list → `×0.70` |
| Seen but not engaged | 1 prior impression → `×0.45`; 2 priors → `×0.20` |
| Negative interest | `p_neg` above |
| Low-quality text | Description < 5 chars and no topics assigned → `×0.60` |
| Excess hashtags | > 15 hashtags (tag stuffing) → `×0.70` |
| Author under moderation review | `×0.35` |
| Enrichment pending on a discovery candidate | `×0.80` (uncertain topical fit) |

**Exploration.** Pure exploitation collapses a feed into a monoculture. Two mechanisms:

1. **Thompson sampling over topics.** For each candidate topic, draw
   `θ_t ~ Beta(alpha_t, beta_t)` from the profile's `topicAffinities` array. Reserve
   `EXPLORATION_RATIO` (default 0.15) of slots for candidates whose sampled `θ` exceeds
   their point-estimate affinity — i.e. topics the system is *uncertain* about rather
   than topics it knows are bad. Uncertainty shrinks naturally as `alpha + beta` grows.
2. **Adjacent-topic injection.** Using `topic_cooccurrence`, take topics with high PMI
   against the user's top affinities but low current affinity, and inject their best
   recent posts. This is how a user interested in ceramics discovers glaze chemistry.

Exploration items are flagged `isExploration: true`, are excluded from author-repetition
penalties, and are measured separately: if exploration slots show materially worse
engagement over a 14-day window, `EXPLORATION_RATIO` is reduced automatically by the
tuning job (floor 0.05).

### 14.5 Diversity re-ranking

Scoring alone produces near-duplicate runs. Apply **Maximal Marginal Relevance** over
embeddings:

```
selected = []
while |selected| < pageSize * pagesToPrepare:
    pick argmax over remaining:
        mmr(c) = λ · score(c) - (1 - λ) · max over s ∈ selected of cosine(c.emb, s.emb)
    λ = 0.72
```

Then apply hard structural caps as a final pass, in this order:

- ≤ 2 posts per author per 20 emitted items.
- ≤ 5 posts per topic per 20 emitted items.
- ≥ 4 distinct authors in every window of 10.
- At most 1 exploration item in any window of 5.
- Posts shared directly to the viewer are pinned within the first 5 slots (max 2).

A cap violation demotes the item to the next eligible window rather than dropping it —
dropping wastes retrieval work and can empty the tail of the feed.

### 14.6 Reference implementation of the orchestrator

Note what this class does *not* know: it does not know what a source is, how a signal is
computed, or what rerankers exist. New behaviour is added by registering an
implementation in the container. That is the OCP requirement made concrete.

```ts
// application/feed/pipeline/FeedPipeline.ts
export class FeedPipeline {
  constructor(
    private readonly sources: readonly CandidateSource[],
    private readonly filters: readonly FeedFilter[],
    private readonly signals: readonly RankingSignal[],
    private readonly rerankers: readonly Reranker[],
    private readonly weights: SignalWeights,
    private readonly clock: Clock,
    private readonly logger: Logger,
  ) {}

  async rank(req: CandidateRequest, ctx: SignalContext): Promise<ScoredCandidate[]> {
    const batches = await Promise.all(
      this.sources.map(s => this.fetchSafely(s, req)),
    );

    const merged = FeedCandidate.dedupeMerging(batches.flat());

    let candidates = merged;
    for (const filter of this.filters) {
      candidates = await filter.apply(candidates, ctx);
    }

    await Promise.all(this.signals.map(s => s.prepare?.(candidates, ctx)));

    const scored = candidates.map(c => {
      const breakdown = new Map<string, number>();
      let base = 0;
      for (const signal of this.signals) {
        const v = signal.score(c, ctx);
        breakdown.set(signal.name, v);
        base += (this.weights.get(signal.name) ?? 0) * v;
      }
      return ScoredCandidate.of(c, base, breakdown);
    });

    scored.sort((a, b) => b.score - a.score);

    let ranked: ScoredCandidate[] = scored;
    for (const reranker of this.rerankers) {
      ranked = reranker.apply(ranked, ctx);
    }
    return ranked;
  }

  /** A failing source degrades the feed; it never fails the request. */
  private async fetchSafely(source: CandidateSource, req: CandidateRequest) {
    try {
      return await withTimeout(source.fetch(req), SOURCE_TIMEOUT_MS);
    } catch (err) {
      this.logger.warn({ err, source: source.name }, 'candidate_source_failed');
      return [];
    }
  }
}
```

### 14.7 Session caching and pagination

Ranking 1,500 candidates on every scroll is wasteful and produces unstable pages.

- On a cursor-less request, run the pipeline, keep the top 200 post IDs, and store them
  in Redis: `feed:session:<userId>:<sessionId>` → JSON list, TTL 15 min.
- The response cursor is `base64({ sessionId, offset })`, HMAC-signed.
- Subsequent pages slice the cached list and hydrate — no ranking, no vector search.
- When the list is exhausted or the TTL has expired, run the pipeline again excluding
  everything already served in that session (tracked in
  `feed:session:<...>:served`).
- A pull-to-refresh sends no cursor, creating a fresh session; the seen-set ensures the
  new session does not repeat recently-shown items.
- Precompute path (optional, for scale): a repeatable job pre-ranks feeds for users
  active in the last 3 days during off-peak, writing to the same cache key with a 6 h
  TTL, so the common case is a cache hit. A **stale-while-revalidate** policy serves the
  precomputed list immediately and triggers an async refresh when it is older than
  30 min.

### 14.8 Evaluation and guardrails

Every ranking change must be justified with numbers, not intuition.

- **Offline replay.** A held-out day of `interactionEvents` is replayed against a
  candidate config; report NDCG@20, MRR, and recall@200 of items the user actually
  engaged with. This runs in CI on a fixture dataset and fails the build on a > 5%
  regression.
- **Online metrics.** Per-cohort dashboards for: engagement rate per impression, dwell
  per session, unique authors seen per session, unique topics seen per session,
  `not_interested` rate, 7-day retention, and share of the feed coming from each source.
- **Config as data.** `RankingConfig` is loaded from the database
  (`GET/PUT /admin/ranking/config`), versioned, and hot-reloadable. Every served feed
  records its config version in `meta.experiment`, so results are attributable.
- **A/B framework.** Deterministic bucketing by `hash(userId + experimentKey)`; the
  experiment key travels with the feed response and with every impression event.
- **Hard guardrails** enforced at serve time, regardless of scores:
  - ≥ 30% of home-feed items must come from accounts the user follows (avoids the "why is
    my feed all strangers" failure).
  - ≥ 8 distinct authors per 20 items.
  - ≥ 4 distinct topics per 20 items.
  - No item older than 30 days on the home feed unless the candidate pool is exhausted.
  - Every item must carry a `ranking.reason` — if a reason cannot be produced, the item
    is dropped. This forces explainability to be a design constraint rather than an
    afterthought.

---

## 15. The Search & Expertise Engine

Requirement: a user types a *problem* and receives (a) the posts that address that exact
problem and (b) the people who have demonstrated competence in it.

### 15.1 Query understanding

`QueryUnderstanding` (application service) produces a `SearchQuery` value object:

1. **Normalise** — trim, collapse whitespace, casefold, `unaccent`, strip terminal
   punctuation, preserve quoted phrases verbatim, extract leading operators (`#tag`,
   `@handle`, `from:handle`, `topic:slug`, `"exact phrase"`).
2. **Classify intent** — cheap rules first, embedding classifier as fallback:
   - `navigational` — starts with `@`, or matches a handle exactly → people first.
   - `tag` — starts with `#` → hashtag feed.
   - `exact` — fully quoted → lexical only, no expansion.
   - `problem_solving` — contains an interrogative or trouble marker (`how`, `why`,
     `won't`, `not working`, `fix`, `best way`, `help`, `?`) → **posts + experts**, the
     flagship path.
   - `topical` — noun phrase matching a topic label or centroid with cosine > 0.75.
   - `person_seeking` — contains `who`, `someone who`, `expert`, `recommend a` →
     **people first**.
   - Default `informational`.
3. **Extract keywords** — remove stopwords, lemmatise, keep quoted phrases whole.
4. **Map to topics** — embed the query once, then `$vectorSearch` on `topics_vector`
   (`limit: 5`, `numCandidates: 100`) keeping matches above 0.60; union with exact lexical
   topic-label matches. This is what makes "my sourdough never rises" resolve to
   *Bread Baking*.
5. **Expand** — add synonyms/co-occurring terms mined from `searchQueries` click data
   and from the top-20 initial results' hashtags (pseudo-relevance feedback). Expansions
   are applied at *reduced* lexical weight (0.4) so they broaden recall without hijacking
   precision. Never expand `exact` intent.
6. **Embed** — one embedding per query, cached by normalised text for 1 hour (identical
   queries are extremely common).

### 15.2 Retrieval and fusion

Scores from a lexical channel (Lucene BM25, unbounded) and a semantic channel (cosine,
`[-1,1]`) are not comparable, so hybrid search must fuse by **rank**, not by score. That
algorithm — Reciprocal Rank Fusion — is a native aggregation stage in MongoDB 8.0+, so the
post-search channels fuse **inside the database** in a single round trip:

```
RRF(d) = Σ over pipelines p:  weight(p) / (k + rank_p(d))       k = 60
```

```js
// pipelines/hybridSearch.ts — postSearchPipeline(q, weights)
[
  { $rankFusion: {
      input: { pipelines: {
        lexical: [
          { $search: {
              index: 'posts_text',
              compound: {
                should: [
                  // Per-field boosts replace tsvector weight classes (§8.3)
                  { text: { query: q.text, path: 'description',
                            score: { boost: { value: 3.0 } },
                            fuzzy: { maxEdits: 1, prefixLength: 3 } } },
                  { text: { query: q.keywords, path: 'hashtags',
                            score: { boost: { value: 3.0 } } } },
                  { text: { query: q.text, path: 'topics.slug',
                            score: { boost: { value: 2.0 } } } },
                  { text: { query: q.text, path: 'imageCaption',
                            score: { boost: { value: 1.2 } } } },
                  { text: { query: q.text, path: 'topComments',
                            score: { boost: { value: 1.2 } } } },
                  { text: { query: q.text, path: 'imageText',
                            score: { boost: { value: 0.8 } } } },
                  // Expansions enter at reduced weight so they add recall, not noise
                  { text: { query: q.expandedTerms, path: 'description',
                            score: { boost: { value: 0.4 } } } },
                ],
                filter: [
                  { equals: { path: 'status', value: 'published' } },
                  { equals: { path: 'visibility', value: 'public' } },
                ],
                minimumShouldMatch: 1,
              },
              highlight: { path: ['description', 'topComments'] },
          } },
          { $limit: 150 },
        ],
        semantic: [
          { $vectorSearch: {
              index: 'posts_vector', path: 'embedding',
              queryVector: q.embedding, numCandidates: 3000, limit: 150,
              filter: { status: 'published', visibility: 'public' },
          } },
        ],
        topical: [
          { $match: { topicIds: { $in: q.resolvedTopicIds }, status: 'published' } },
          { $sort: { qualityScore: -1, publishedAt: -1 } },
          { $limit: 60 },
        ],
      } },
      combination: { weights: { lexical: 0.7, semantic: 1.0, topical: 0.6 } },  // by intent
      scoreDetails: true,     // exposes per-pipeline rank contribution for debugging
  } },
  { $addFields: { fusion: { $meta: 'scoreDetails' } } },
  { $project: { embedding: 0 } },
  { $limit: 120 },            // rerank depth
]
```

Two constraints on `$rankFusion` shape the design: sub-pipelines must all run against the
**same collection**, and each may only contain `$search`, `$vectorSearch`, `$match`, `$sort`,
`$geoNear`, and `$limit`. That is why hashtag and people retrieval stay separate — they
target different collections — and why the re-ranking in §15.3 happens in application code
rather than being appended to this pipeline.

Retrievers that cannot join the fusion stage still implement `SearchRetriever` and run in
parallel with it, so adding a channel never touches orchestration:

| Retriever | Method | Limit |
|---|---|---|
| `HybridPostRetriever` | The `$rankFusion` pipeline above — lexical + semantic + topical in one query | 120 |
| `HashtagRetriever` | `$search` `autocomplete` + exact on `hashtags` → recent high-quality posts | 60 |
| `PeopleLexicalRetriever` | `$search` `compound` over `handle`/`displayName` (autocomplete) and `bio` | 50 |
| `PeopleExpertiseRetriever` | `userTopicExpertise` on resolved topics, `score: -1`, partial index | 50 |
| `PeopleSemanticRetriever` | `$vectorSearch` on `users_vector` (`profileEmbedding`) | 50 |
| `TopicRetriever` | `$search` on `topics_text` + `$vectorSearch` on `topics_vector` | 20 |

People results are fused by the application-level `ReciprocalRankFuser` (same formula, same
`k = 60`), which remains in the codebase for exactly this cross-collection case. Keeping one
fuser implementation used two ways — natively for posts, in code for people — means the
relevance behaviour is identical on both paths.

`combination.weights` vary by intent:

| Intent | lexical | semantic | topical | hashtag (app-level) |
|---|---|---|---|---|
| `exact` | 1.0 | 0.0 | 0.0 | 0.3 |
| `problem_solving` | 0.7 | 1.0 | 0.6 | 0.3 |
| `informational` | 0.9 | 0.8 | 0.5 | 0.4 |
| `topical` | 0.6 | 0.9 | 1.0 | 0.5 |
| `tag` | 0.3 | 0.2 | 0.4 | 1.0 |

A weight of `0.0` means the sub-pipeline is **omitted** from the `$rankFusion` input rather
than included at zero weight — for `exact` intent the semantic pipeline is not built at all,
which saves the query embedding entirely and makes quoted-phrase search materially faster.

### 15.3 Post re-ranking

Top 120 fused candidates are re-scored:

```
final = 0.34 · fusedRelevance          // min-max normalised RRF within this result set
      + 0.22 · solutionFitness
      + 0.16 · contentQuality           // §7.2, same QualityScore as the feed
      + 0.10 · topicMatch               // Σ topicWeight · queryTopicConfidence
      + 0.09 · personalisation          // cosine(post, viewer.positiveVector), 0 if anonymous
      + 0.05 · authorTopicExpertise     // normalised §15.4 score in the matched topic
      + 0.04 · recency                  // exp(-ageDays / 180); intentionally weak
      − penalties
```

**`solutionFitness`** is what makes a problem-shaped query return answers instead of
merely topical content. It is a bounded sum of measurable structure:

```
+0.30  the post's own comments include ≥1 author-marked-helpful comment
+0.20  description contains enumerated structure (numbered list, "step", "first…then")
+0.15  description length ∈ [180, 1400] chars (substantive but not a wall)
+0.15  engagement percentile within its topic ≥ 0.80
+0.10  comment-to-like ratio ≥ 0.15 (discussion, not just approval)
+0.10  author's expertise score in the matched topic ≥ 60
−0.20  description is < 40 chars or is only hashtags
−0.15  post is a question with no comments (a duplicate of the user's problem, not a fix)
clamp to [0, 1]
```

Penalties: blocked/muted author → excluded; `shadow_limited` → excluded from search;
duplicate near-identical post by the same author (cosine > 0.95) → keep the best only;
> 2 results per author per page → demote.

**Highlighting** comes from the `$search` stage's `highlight` option, read via
`$meta: 'searchHighlights'`, capped at two passages. Because `scoreDetails` records which
sub-pipeline contributed a document's rank, the response can honestly report
`channels: ["semantic"]` for a result that matched by meaning with no shared words — which is
what lets the UI avoid promising a highlight it cannot produce.

### 15.4 Expertise scoring

The mechanism behind "show me people who are good at this". Computed per
`(user, topic)`, refreshed incrementally on engagement events and fully recomputed
nightly.

**Component 1 — Authored contribution quality** (weight 0.45). Not post count — count is
gameable. Quality relative to the topic's own distribution, time-decayed:

```
authored(u,t) = Σ over posts p by u with topic t:
                  topicWeight(p,t)
                · engagementPercentileInTopic(p)      // 0..1, percentile vs same-topic posts
                · log1p(effectiveImpressions(p)) / log1p(5000)   // reach confidence
                · exp(-ageDays(p) / 180)              // 6-month half-life-ish decay
```

Using a **percentile within the topic** rather than raw likes is essential: 200 likes may
be exceptional in a niche topic and unremarkable in a broad one.

**Component 2 — Helpful answering** (weight 0.25). The strongest available proxy for
"actually solved someone's problem":

```
answering(u,t) = Σ over comments c by u on posts with topic t:
                   ( 1.0 if authorMarkedHelpful(c)
                   + 0.5 if c.isPinned
                   + 0.4 · min(1, c.likeCount / topicMedianCommentLikes)
                   + 0.3 if c has replies from the post author )
                 · exp(-ageDays(c) / 180)
```

**Component 3 — Attributed audience growth** (weight 0.12):

```
growth(u,t) = log1p(followers acquired within 24h of a profile_visit
                    originating from u's posts in topic t, last 180d) / log1p(500)
```

**Component 4 — Consistency** (weight 0.10). One viral post is not expertise; sustained
contribution is.

```
consistency(u,t) = distinctWeeksWithContribution(u, t, last 26 weeks) / 26
```

**Component 5 — Peer endorsement** (weight 0.08):

```
endorsement(u,t) = log1p( Σ saves + shares of u's topic-t posts,
                          each weighted by the sharer's own expertise in t ) / log1p(200)
```

Weighting by the endorser's expertise makes reciprocal-liking rings ineffective: a boost
from an established contributor counts, a boost from ten fresh accounts does not.

**Composition, normalisation, confidence:**

```
raw = 0.45·z(authored) + 0.25·z(answering) + 0.12·growth
    + 0.10·consistency + 0.08·endorsement
        where z(·) is a robust z-score (median / IQR) within the topic

score      = 100 · percentileRank(raw within topic)
confidence = min(1, log1p(evidenceCount) / log1p(30))
             where evidenceCount = postsInTopic + helpfulComments
isEmerging = evidenceCount < MIN_EXPERTISE_EVIDENCE (default 5)
```

The percentile-within-topic step — the part that makes 200 likes mean different things in a
niche and a broad topic — is a single aggregation stage. `$setWindowFields` partitions by
topic and ranks within each partition, so no per-topic query loop is needed:

```js
// pipelines/expertiseRecompute.ts (final stages)
[
  // …per-(user,topic) component aggregation upstream…
  { $setWindowFields: {
      partitionBy: '$topicId',
      sortBy: { rawScore: 1 },
      output: {
        percentile: { $rank: {} },
        topicPopulation: { $count: {}, window: { documents: ['unbounded', 'unbounded'] } },
      },
  } },
  { $addFields: {
      score: { $multiply: [ 100, { $divide: ['$percentile', '$topicPopulation'] } ] },
      confidence: { $min: [ 1, { $divide: [
        { $ln: { $add: [1, '$evidenceCount'] } }, Math.log(31) ] } ] },
      isEmerging: { $lt: ['$evidenceCount', MIN_EXPERTISE_EVIDENCE] },
  } },
  { $merge: { into: 'userTopicExpertise',
              on: ['userId', 'topicId'],
              whenMatched: 'replace', whenNotMatched: 'insert' } },
]
```

`$merge` is what makes the nightly recompute safe: results are written in place, atomically
per document, without a truncate-and-reload window during which people search would return
nothing. The robust z-score inputs use `$median` and `$percentile` accumulators (MongoDB 7.0+)
so outliers do not distort the distribution the way a mean-based z-score would.

Anti-gaming rules, all mandatory:

- Reciprocal-engagement discount: if ≥ 60% of a user's topic engagement comes from
  accounts they also engage with heavily, multiply `raw` by 0.6.
- Ignore engagement from accounts younger than 7 days or with < 3 followers.
- Cap any single post's contribution to `authored` at 25% of the user's topic total.
- Suspended, banned, or shadow-limited users are excluded entirely.
- Users inactive for > 90 days are multiplied by 0.7 and excluded from
  `canMessage`-oriented surfaces (an unreachable expert is not a useful result).

**People ranking for a query:**

```
final = 0.42 · expertiseInResolvedTopics       // Σ over resolved topics: score/100 · topicConfidence
      + 0.20 · confidence
      + 0.14 · profileSemanticMatch            // cosine(users.profile_embedding, queryVector)
      + 0.10 · socialProximity                 // 1.0 mutual, 0.8 following, 0.5 followed-by-followees, 0.2 none
      + 0.08 · recentActivity                  // exp(-daysSinceLastPost / 30)
      + 0.06 · lexicalMatch                    // handle/display-name/bio match
```

Every people result MUST carry `evidence` and a generated `why` string. An unexplained
expert ranking is not trustworthy and users will not act on it.

### 15.5 Indexing pipeline

On `PostPublished` / `PostDescriptionEdited`, enqueue `post.enrich` (idempotent, keyed on
`postId` + content hash):

1. Detect language (skip English-specific stemming for others; store `posts.language`).
2. `ImageUnderstandingProvider` → caption + OCR text per image (parallel, cached by image
   checksum so a re-post of the same image is free).
3. Build the enrichment text: `description ⧺ hashtags ⧺ captions ⧺ ocr`.
4. `TextModerator` pre-check → on a hard hit, set `status='removed'`, open a report, stop.
5. `EmbeddingProvider.embed(enrichmentText)` → set `posts.embedding`, `embeddingModel`, and
   `embeddingSourceHash`; skip entirely if the hash is unchanged.
6. Topic classification: `$vectorSearch` on `topics_vector` (top 3 above 0.55) unioned with
   author-declared topics; set `posts.topics` **and** the flattened `posts.topicIds`.
7. Set `imageCaption`, `imageText`, and `language`.
8. Set `posts.enrichedAt`; emit `PostEnriched`.

Steps 5–8 are a **single `updateOne`**. Because all enrichment output lives on the post
document, the entire result commits atomically with no transaction, and there is no window in
which a post has an embedding but no topics — a class of inconsistency the previous
multi-table shape would have allowed. Atlas Search and Vector Search indexes then pick the
change up from the oplog automatically; there is no separate index-write step to keep in sync,
which is the main operational advantage of search living in the database.

Related repeatable jobs: recompute `topics.centroid` nightly from member post embeddings;
refresh `posts.topComments` when a post's comment set changes materially (debounced 1 h);
refresh `users.profileEmbedding` from bio + the 30 most recent post embeddings (debounced 6 h).

Backfill CLI: `pnpm cli backfill-embeddings --since=… --batch=256 --concurrency=4`, with
resumable checkpointing.

### 15.6 Suggest (typeahead)

Must return in ≤ 80 ms, so it never touches the embedding model.

- Sources: the user's own recent queries, Atlas Search `autocomplete` on handles and display
  names of followed/mutual accounts (boosted), global handle prefix, topic labels,
  hashtag prefixes, plus popular completions mined from `searchQueries.normalised`.
- `autocomplete` with `tokenization: 'edgeGram'` is what makes this fast: prefixes are
  tokenised at index time, so a lookup is an index seek. Never implement typeahead with
  `$regex: '^prefix'` — a leading-anchored regex can use an index but a user-supplied pattern
  is also a denial-of-service vector (§18).
- Merge with a fixed source priority, cap at 10, cache per `(userId, prefix)` for 60 s.
- Zero-state (empty query) returns recent queries plus followed topics.

---

## 16. Media Pipeline (Cloudinary)

### 16.1 Why signed direct upload

Three properties drive the design:

1. **The API never handles image bytes.** No multipart parsing, no memory spikes, no
   request-timeout risk on a 15 MB upload over mobile data. The API's only job is to mint
   a signature and later verify what landed.
2. **Unsigned upload presets are not used.** An unsigned preset embeds a client-usable
   credential in the app bundle, which anyone can extract and use to fill the account with
   arbitrary images. Every upload is signed server-side, per request, scoped to one
   `public_id` under one owner's folder.
3. **Variants are URL-derived, not pre-generated.** Cloudinary builds and edge-caches a
   transformation on first request, so adding a new size later is a code change, not a
   re-processing backfill of every historical image.

### 16.2 Flow

```
Device                     API                      Cloudinary            Worker
  │ POST /media/upload-tickets │                          │                  │
  │───────────────────────────>│ insert mediaAssets       │                  │
  │                            │ (status=pending,         │                  │
  │                            │  public_id reserved)     │                  │
  │                            │ api_sign_request(params) │                  │
  │ { uploadUrl, fields }      │                          │                  │
  │<───────────────────────────│                          │                  │
  │ POST multipart (file + signed fields) ───────────────> │                  │
  │                            │                          │ store, eager     │
  │ { public_id, version, … }  │                          │ transforms,      │
  │<───────────────────────────────────────────────────────│ moderation queue │
  │ POST /media/:id/confirm    │                          │                  │
  │───────────────────────────>│ api.resource(public_id) ─>│                 │
  │                            │<── real metadata ─────────│                 │
  │                            │ verify prefix/owner,     │                  │
  │                            │ bytes, format, dims      │                  │
  │                            │ status=uploaded          │                  │
  │                            │ enqueue media.finalize ─────────────────────>│
  │ 202 { status: uploaded }   │                          │                  │
  │<───────────────────────────│                          │   dedupe by etag │
  │                            │                          │   LQIP + colours │
  │                            │                          │   caption + OCR  │
  │                            │  ┌── webhook: moderation ┤                  │
  │                            │<─┘   /webhooks/cloudinary │                 │
  │                            │ status=ready | rejected  │                  │
```

Cloudinary handles automatically what a `sharp` worker would otherwise do: EXIF stripping
(implicit on transformation, and `image_metadata` is not preserved in delivered
derivatives), auto-orientation via `a_exif`, format negotiation via `f_auto` (WebP/AVIF to
supporting clients), and quality selection via `q_auto`.

### 16.3 Naming and organisation

```
prequit/{env}/{purpose}/{ownerId}/{mediaId}
  env      = dev | staging | prod        (never share a folder across environments)
  purpose  = post | avatar | message
```

`public_id` is minted by the server before signing, so the client cannot choose where its
file lands. `confirm` re-checks the prefix against the authenticated user; a mismatch is
`403`. Tags applied on upload: `env:{env}`, `purpose:{purpose}`, `owner:{ownerId}` —
tags make bulk cleanup and per-purpose Admin API queries possible without a database scan.

### 16.4 Named transformations

Define these once in the Cloudinary console as **named transformations** and reference
them by name (`t_pq_feed`) rather than inlining parameters. Named transformations can be
retuned without invalidating every URL already stored in a client cache, and they keep the
allowed-transformation list closed if strict transformations are enabled.

| Variant | Transformation | Use |
|---|---|---|
| `thumb` | `c_fill,w_320,h_320,g_auto,f_auto,q_auto,dpr_auto` | Grid, search results, share previews |
| `feed` | `c_limit,w_1080,f_auto,q_auto,dpr_auto` | Feed and post detail |
| `full` | `c_limit,w_1920,f_auto,q_auto:best` | Pinch-to-zoom |
| `avatar` | `c_thumb,w_256,h_256,g_face,z_0.75,r_max,f_auto,q_auto` | Profile header |
| `avatarSmall` | `c_thumb,w_64,h_64,g_face,r_max,f_auto,q_auto` | Comment and chat rows |
| `lqip` | `c_limit,w_32,e_blur:400,f_auto,q_1` | Blur-up placeholder |

`g_auto` (content-aware cropping) and `g_face` for avatars matter here: a naive centre
crop mangles the subject of a photo, which is the visible difference between a polished
feed and a sloppy one. `dpr_auto` serves 2×/3× assets to high-density phone screens.

`thumb` and `feed` are requested as `eager` + `eager_async` at upload time so the two
variants the feed needs are warm before the post is visible. Everything else is generated
lazily on first request.

### 16.5 Delivery and access control

Post images are `delivery_type = upload` (public URL, signed nothing) because a public
post's image is public by definition, and public URLs are cacheable at the edge and in the
client for a year (`version` in the path makes the URL content-addressed, so cache
invalidation is never needed).

For `followers`-only posts and for direct-message attachments, upload with
`type: 'authenticated'` and deliver **signed URLs** (`sign_url: true`) with a short
expiry, generated per request by `MediaUrlBuilder` after the authorisation check. This is
the one case where the URL is not stable and must not be cached by the client beyond its
expiry. Avatars are always `upload`.

`GET /media/:mediaId` performs the visibility check and returns the appropriate URL set,
so the client has exactly one code path regardless of which delivery mode an asset uses.

### 16.6 Moderation

Upload with `moderation: 'aws_rek'` (or the configured add-on) so Cloudinary queues the
asset for automated review and calls back with the verdict. Until the verdict arrives the
asset sits at `moderation_status = 'pending'` and its post is publishable but excluded
from discovery surfaces — the author sees it, followers see it, strangers do not. This
avoids both a blocking upload experience and an unreviewed image reaching a cold audience.

Manual moderation actions from the admin queue call
`cloudinary.v2.api.update(publicId, { moderation_status: 'rejected' })` and then destroy
the asset, so the provider and our database never disagree.

### 16.7 The `media.finalize` worker

Runs after `confirm`, in the `media` queue:

1. Dedupe: if another asset by the same owner has the same `etag`, reuse it and destroy
   the duplicate (identical re-uploads are common when a user retries).
2. Store `placeholder` (the `lqip` variant fetched once as a base64 data URI) and
   `colors` from the upload response.
3. Call `ImageUnderstandingProvider` for caption + OCR text, keyed on `etag` so the same
   image is never analysed twice. Cloudinary's own captioning/OCR add-ons are a valid
   adapter here (`CloudinaryImageUnderstanding`), requested via
   `explicit(publicId, { detection: 'captioning' })`; the local BLIP/Tesseract adapter
   remains the default for cost control.
4. Feed that text into the owning post's enrichment payload (§15.5) and re-enqueue
   `post.enrich` if the post already exists.
5. Set `status='ready'` when moderation has approved (or is disabled), else leave
   `uploaded` and let the webhook complete it.

### 16.8 Cleanup and cost control

- `media.cleanup` (hourly): destroy `pending` assets older than 24 h — these are tickets
  the user abandoned — and   `ready` assets referenced by no post, message, or avatar and
  older than 7 days. Deletion goes through `MediaStorage.destroy` and then marks the document
  `deleted`, in that order, so a failed provider call retries instead of orphaning a
  binary that no longer has a database pointer.
- A weekly reconciliation job lists Cloudinary assets by tag and compares against
  `mediaAssets` in both directions, reporting drift. Provider-side orphans cost money
  silently; this is the only way to notice them.
- Transformation count, not storage, dominates Cloudinary billing. Therefore: never
  construct ad-hoc transformations at call sites (only the six named variants above are
  permitted, enforced by the `MediaVariant` union type), and enable **strict
  transformations** in production so an attacker cannot mint arbitrary derivatives by
  editing a URL.
- On account deletion, the purge job destroys all assets under
  `prequit/{env}/*/{ownerId}/` by prefix in one Admin API call per purpose.

---

## 17. Domain Events & Background Jobs

### 17.1 Event catalog

| Event | Emitted by | Handlers |
|---|---|---|
| `UserRegistered` | RegisterUser | SendVerificationEmail, CreateEmptyInterestProfile |
| `EmailVerified` | VerifyEmail | SendWelcome, SeedInterestProfileFromDeclaredTopics |
| `UserLoggedIn` | Login | TouchLastActive, DetectNewDevice → security email |
| `PasswordChanged` | ChangePassword/ResetPassword | RevokeOtherSessions, SendSecurityEmail |
| `AccountDeletionRequested` | DeleteAccount | SchedulePurgeJob(+30d) |
| `ProfileUpdated` | UpdateProfile | RefreshProfileEmbedding (debounced) |
| `UserFollowed` | FollowUser | Notify, RefreshMutualPairs, BumpCounters, UpdateAuthorAffinity |
| `FollowRequestCreated` | FollowUser | Notify |
| `FollowRequestAccepted` | AcceptFollowRequest | Notify, RefreshMutualPairs, BumpCounters |
| `MutualEstablished` | (follow paths) | Notify "you can now message", emit `conversation:available` |
| `UserUnfollowed` | UnfollowUser | RefreshMutualPairs, DowngradeConversationIfNeeded, BumpCounters |
| `UserBlocked` | BlockUser | CascadeUnfollow, CancelRequests, CloseConversation, PurgeNotifications |
| `PostPublished` | CreatePost | EnqueueEnrichment, BumpPostCount, NotifyMentions, FanoutNewPostPill, UpdateOwnInterestProfile |
| `PostDescriptionEdited` | UpdatePost | ReEnqueueEnrichment, RecordRevision |
| `PostEnriched` | enrichment worker | UpdateTopicCounts, MarkFeedEligible |
| `PostDeleted` | DeletePost | RemoveFromIndexes, DecrementCounters, SchedulePurge |
| `PostLiked` / `PostUnliked` | Like/UnlikePost | Notify(aggregated), DebouncedCounter, UpdateInterestProfile, UpdateAuthorAffinity, UpdateVelocity, RecomputeExpertise(author) |
| `CommentAdded` | AddComment | Notify(post author, parent author, mentions), BumpCounters, UpdateInterestProfile(+comment text embedding), RecomputeExpertise |
| `CommentMarkedHelpful` | MarkCommentHelpful | Notify, RecomputeExpertise(commenter) — highest-weight expertise signal |
| `PostSaved` | SavePost | UpdateInterestProfile, UpdateVelocity |
| `PostShared` | SharePost | Notify author, CreateMessage(if conversation), UpdateInterestProfile, RecomputeExpertise |
| `FeedFeedbackSubmitted` | SubmitFeedFeedback | UpdateNegativeInterest, AddToSeenSet, OptionallyMute |
| `ImpressionsRecorded` | RecordImpressions | UpdateSeenSet, UpdatePostStats(position-corrected), UpdateDwellSignals |
| `ConversationOpened` | OpenConversation | JoinRealtimeRooms, emit `conversation:created` |
| `MessageSent` | SendMessage | RealtimeEmit, PushIfOffline, IncrementUnread, UpdateConversationOrder |
| `MessageRead` | MarkConversationRead | RealtimeReceipt, ResetUnread |
| `ReportFiled` | ReportSubject | EnqueueModerationTriage, AutoWithholdIfThresholdCrossed |
| `EnforcementApplied` | ApplyEnforcement | RemoveFromIndexes, NotifySubject, WriteAudit |

Handler rules: **idempotent** (the outbox is at-least-once), **independently
retryable** with exponential backoff and a dead-letter queue after 5 attempts, and each
handler does exactly one thing. A handler MUST NOT call another use case that could emit
the same event class (no event cycles); the CI job asserts the handler graph is acyclic.

### 17.2 Queues

| Queue | Concurrency | Contents |
|---|---|---|
| `critical` | 20 | realtime fan-out, push notifications |
| `default` | 10 | notifications, counters, affinity updates |
| `enrichment` | 4 | embeddings, captioning, OCR, classification (CPU/GPU-bound) |
| `media` | 6 | `media.finalize`, dedupe, placeholder/colour capture, Cloudinary webhook follow-up |
| `analytics` | 2 | impression aggregation, velocity |
| `maintenance` | 1 | recomputes, purges, partition management |

### 17.3 Repeatable (cron) jobs

| Schedule | Job | Purpose |
|---|---|---|
| every 30 s | `outbox.publish` | Drain the outbox to queues |
| every 1 min | `stats.flush` | Apply debounced counters from Redis via `bulkWrite` of `$inc` ops |
| every 5 min | `velocity.recompute` | `posts.velocity` 1 h / 24 h windows, one pipeline with `$merge` |
| every 15 min | `trending.refresh` | Trending topics + hashtags cache |
| every 30 min | `feed.precompute` | Pre-rank feeds for recently-active users |
| hourly | `search.expansions` | Mine synonyms from query/click logs |
| hourly | `media.cleanup` | Destroy abandoned/orphaned Cloudinary assets and mark documents deleted |
| weekly | `media.reconcile` | Diff Cloudinary assets (by tag) against `mediaAssets` in both directions |
| daily 02:00 | `interest.recompute` | Full interest-profile recomputation for active users |
| daily 02:30 | `expertise.recompute` | Full `userTopicExpertise` recomputation via `$setWindowFields` + `$merge` |
| daily 03:00 | `neighbours.recompute` | `userNeighbours` co-engagement similarity |
| daily 03:15 | `mutuals.reconcile` | Recompute `mutualPairs` from `follows`; non-zero drift alerts |
| daily 03:30 | `topics.centroids` | Topic centroid refresh |
| daily 04:00 | `counters.reconcile` | Repair drifted denormalised counters |
| daily 04:30 | `partitions.maintain` | Create next month's partition, drop > 180 d |
| daily 05:00 | `purge.execute` | Hard-delete accounts/posts past their grace period |
| weekly | `ranking.evaluate` | Offline replay metrics report + auto-tune exploration ratio |
| weekly | `bias.recalibrate` | Refit the position-propensity curve |

---

## 18. Security

**Passwords.** argon2id, `memoryCost = 19456 KiB`, `timeCost = 2`, `parallelism = 1`
(OWASP 2024 baseline). Minimum 10 characters; rejected if in the breached-password list
(k-anonymity prefix check against a local bloom filter, no plaintext leaves the server)
or similar to the handle/email. On login, transparently re-hash if the stored parameters
are below current policy.

**Tokens.** RS256, private key from a secret manager, `kid` in the header, key rotation
supported by publishing a JWKS with both keys during overlap. Access TTL 15 min. Refresh
tokens are 256-bit random, stored only as SHA-256, single-use with family revocation on
reuse (see §12.1). Token payload contains no PII beyond handle. Logout revokes the
session document; the access token remains valid until expiry, so revocation-sensitive
endpoints (password change, delete account, admin) additionally check
`authSessions.revokedAt`.

**Authorisation.** Every use case that touches another user's data takes an explicit
`actor` and asserts permission through a domain policy. There is no implicit "if it's in
the URL you may read it". Concretely: post read → `VisibilityPolicy`; message send →
`MutualityPolicy`; comment delete → author-or-post-author; admin routes → `rol` claim
plus a per-action check. A missing permission check is a review-blocking defect.

**Input handling.** Every request body, query, and param passes a Zod schema before the
controller. Extra properties are stripped, not ignored. Text is stored raw and escaped on
output; there is no HTML rendering server-side. Unicode is normalised to NFC; zero-width and
bidi-override characters are stripped from handles and display names to prevent spoofing.

**Operator injection.** This replaces SQL injection as the top input-handling risk, and it is
easier to get wrong because there is no string concatenation to look for. If a JSON body value
reaches a query position, a client can send `{"password": {"$ne": null}}` or
`{"handle": {"$regex": "^a"}}` and change the query's *shape* rather than its data. Four
mandatory rules:

1. **Zod schemas use `z.string()` for every value that reaches a filter.** A field typed as a
   string rejects an object outright, which neutralises the entire class. This is the primary
   defence — not sanitisation.
2. **Reject keys beginning with `$` and keys containing `.`** anywhere in a request body, via
   a global Fastify `preValidation` hook. Nothing legitimate in this API needs them, and a
   dotted key can otherwise reach into a nested path the caller was never granted.
3. **Never spread client input into a filter.** `find({ ...req.query })` is forbidden;
   repositories build filters field by field from typed values. Sort fields and directions come
   from an allow-list map, never from the request string.
4. **Never pass user input to `$where`, `$expr` with `$function`, or `mapReduce`** — these
   evaluate JavaScript server-side. They are not used anywhere in this system, and a lint rule
   forbids them.

A dedicated e2e test suite sends operator-shaped payloads (`$ne`, `$gt`, `$regex`, `$where`,
dotted keys, prototype-pollution keys like `__proto__`) to every authentication and search
endpoint and asserts a `400`, never a `200` and never a `500`.

**Query denial-of-service.** Regex and search queries built from user text can be made
pathological. Untrusted input never becomes a `$regex` — typeahead uses Atlas Search
`autocomplete`, which is index-backed and bounded. Every request-path query carries
`maxTimeMS` (250 ms for reads, 1 s for search, 5 s for jobs) so a slow query is cancelled
server-side rather than holding a connection. Aggregation pipelines set
`allowDiskUse: false` on request paths, so a pipeline that would spill to disk fails fast
instead of degrading the cluster; only offline recompute jobs are permitted to enable it.

**Credentials.** Connection strings live in the secret manager, never in code. Atlas access
uses a database user scoped to one database with `readWrite`, plus a separate read-only user
for analytics jobs — the application user has no `dbAdmin` rights, so a compromised API
process cannot drop a collection or read the oplog. Network access is restricted to the
application VPC by Atlas IP access list and PrivateLink; `0.0.0.0/0` is prohibited in
staging and production. Prefer AWS IAM or X.509 authentication over SCRAM passwords where
the deployment supports it.

**Enumeration and privacy.** Registration, password reset, and profile reads never
disclose whether an account exists (uniform responses and timing). Blocked relationships
return `404`. Private profiles expose counts but not content. Email and date of birth are
never in any public response.

**Abuse controls.** Rate limits per §11. Progressive challenge (CAPTCHA hook) after
repeated auth failures from one IP. New accounts have reduced limits for 24 h. Follow
velocity caps. Content-similarity check to block spam reposts. All moderation actions
audited immutably.

**Transport & infra.** TLS 1.2+ only, HSTS, `helmet` defaults, strict CORS allow-list
(the mobile client sends no `Origin`, so CORS is only for the admin surface). Secrets from
the environment or a secret manager — never committed, never logged. Log redaction list:
`password`, `token`, `refreshToken`, `authorization`, `cookie`, `pushToken`, `email`,
`signature`, `api_secret`, `CLOUDINARY_API_SECRET`.

**Media upload security.** `CLOUDINARY_API_SECRET` exists only in the API process; it is
never returned by any endpoint and never shipped in the app bundle. Unsigned upload presets
are prohibited — they are a client-extractable write credential. Each signature is scoped
to one server-minted `public_id` inside `{folderRoot}/{purpose}/{ownerId}/`, so a
compromised ticket can overwrite exactly one asset belonging to the user who requested it
and nothing else. `max_bytes` and `allowed_formats` are signed parameters, so the provider
enforces limits even if the client ignores them, and `confirm` re-verifies everything
server-side through the Admin API rather than trusting the client's reported metadata.
Webhook callbacks are authenticated by signature over the raw body with a 5-minute
timestamp tolerance, making replay ineffective. Enable strict transformations in production
so URL editing cannot mint arbitrary derivatives (a denial-of-wallet vector). Followers-only
and direct-message media use `authenticated` delivery with short-lived signed URLs, checked
against the same visibility policy as the post itself.

**Data lifecycle.** Deactivation hides content and blocks login but retains data.
Deletion is a 30-day grace period, then a purge job that deletes the user's documents across
every collection, destroys their Cloudinary assets by prefix, and writes a deletion audit
record. Because there is no `ON DELETE CASCADE`, this job is the *only* thing standing between
a deleted account and orphaned data, so it enumerates collections from an explicit list that a
test asserts covers every collection in the schema — a new collection added without a purge
entry fails CI.

Interaction events are the one exception. `deleteMany({ 'meta.userId': id })` matches on the
`metaField` alone, which is the form time series collections support most efficiently, so the
user's events are removed outright rather than rewritten in place; the aggregate counters and
quality scores they already contributed to are left intact, preserving ranking integrity
without retaining anything attributable. Export: `GET /users/me/export` enqueues a job
producing a signed archive of the user's own content.

---

## 19. Observability & Error Handling

**Error taxonomy.**

```
DomainError (abstract)     → expected, mapped to 4xx, safe message, stable code
  ├── ValidationError      → 422
  ├── NotFoundError        → 404
  ├── ConflictError        → 409
  ├── PermissionError      → 403
  ├── AuthenticationError  → 401
  └── RateLimitError       → 429
InfrastructureError        → 5xx, generic message to the client, full detail logged
```

Use cases throw `DomainError` subclasses (or return `Result` for control-flow failures
that the caller must branch on). A single `errorMapper` in
`infrastructure/http/middleware` converts them to the §11 envelope. No `try/catch` that
swallows and returns `null`. No `throw new Error('bad')` — every thrown error carries a
code.

**Logging.** `pino`, JSON, one line per request with `requestId`, `userId`, route,
status, duration, and the outcome code. Child loggers propagate `requestId` into use
cases and workers via `AsyncLocalStorage`. Log levels: `error` for 5xx and failed jobs,
`warn` for 4xx that indicate a client bug or a degraded path (source timeout), `info` for
lifecycle, `debug` for ranking breakdowns (sampled at 1%).

**Tracing.** OpenTelemetry auto-instrumentation for HTTP, MongoDB, and Redis, plus
manual spans around each use case, each candidate source, each retriever, and each
embedding call. Trace ID equals `requestId` so a log line leads directly to a trace.

**Metrics** (Prometheus). RED for HTTP (rate, errors, duration by route). Queue depth,
job duration, and failure rate per queue. Feed pipeline: candidates per source, filter
elimination rate, cache hit rate, end-to-end duration histogram. Search: latency by
channel, zero-result rate, click-through rate at rank. Embedding: cache hit rate, cost
counter. Business: posts/day, DAU, engagement rate, notification delivery rate.

**Alerts.** p95 feed latency > 1 s for 5 min; error rate > 1% for 5 min; queue depth
growing for 15 min; outbox lag > 2 min; enrichment backlog > 5,000 posts; zero-result
search rate > 25%; DLQ non-empty.

---

## 20. Testing Strategy

Structure mirrors the layers; the pyramid is enforced by CI thresholds.

**Unit (fast, no I/O, the bulk of the suite).**
Domain entities and value objects: every invariant has a passing and a failing test.
Domain services (`FollowPolicy`, `MutualityPolicy`, `TextExtractor`). Ranking maths:
`EmbeddingVector.blend`, `QualityScore.compute`, each `RankingSignal`, each `Reranker`,
`ReciprocalRankFuser`, expertise composition — all pure functions with fixed inputs and
asserted numeric outputs. Use cases against in-memory fakes with an injected fixed
`Clock`, deterministic `IdGenerator`, and seeded `RandomSource`, so ranking output is
byte-stable.

**Contract tests (the Liskov guarantee).** For every port, one suite in
`test/contracts/` parameterised over implementations, run against both the fake and the
real adapter:

```ts
describe.each([
  ['InMemoryFollowGraph', () => new InMemoryFollowGraph()],
  ['PgFollowGraph', () => new PgFollowGraph(testDb)],
])('FollowGraphReader contract: %s', (_name, make) => {
  runFollowGraphReaderContract(make);
});
```

**Integration (real MongoDB + Redis via testcontainers, no mocks).** The container image is
`mongodb/mongodb-atlas-local`, not `mongo`, because it bundles `mongot` and is therefore the
only way to execute `$search`, `$vectorSearch`, and `$rankFusion` in a test. A plain `mongo`
container would leave the feed's primary retrieval path and the entire search subsystem
unverified, which is not acceptable for the two features the product is built around.

```ts
// test/support/mongoContainer.ts
const container = await new GenericContainer('mongodb/mongodb-atlas-local:8.0')
  .withExposedPorts(27017)
  .withWaitStrategy(Wait.forLogMessage(/mongot.*ready/i))   // mongod is up before mongot
  .start();
```

Two practical constraints the suite must respect. Search index creation is **asynchronous** —
after `createSearchIndex` the suite polls `$listSearchIndexes` until `status === 'READY'`
before querying, with a 60 s timeout, and this happens **once** in global setup, not per test.
And index updates lag writes, so any test asserting on search results must poll for the
expected document count rather than assuming read-your-write; a helper
`awaitSearchable(collection, filter)` encapsulates that so individual tests stay readable.
Between tests, collections are emptied with `deleteMany({})` rather than being dropped, because
dropping a collection destroys its search indexes and would force a 30-second rebuild per test.

Coverage: index/validator sync is idempotent and applies cleanly to an empty database.
Repository round-trips preserve every field, including `Date` precision and `ObjectId` type —
a mapper that silently turns an id into a string is a common and expensive bug. Transaction
rollback leaves no partial state and no outbox documents. Concurrency: two simultaneous likes
produce one document and one `E11000`; two simultaneous `OpenConversation` calls produce one
conversation; two replays of one `Idempotency-Key` execute the use case once. Vector search
returns expected neighbours on a seeded corpus, **and** a test asserts that a pre-filter
declared in the index definition actually filters, since a missing `filter` declaration fails
silently rather than erroring. Hybrid search orders a known fixture correctly. Cursor
pagination over a 500-document fixture visits every document exactly once, including when
documents are inserted mid-iteration.

**Explain assertions.** For each of the twelve hot queries there is a test that runs
`explain('executionStats')` and asserts the winning plan is `IXSCAN` (or
`EXPRESS_IXSCAN`/`IDHACK` for `_id` lookups) and that `totalDocsExamined / nReturned ≤ 3`. A
`COLLSCAN` on a hot path fails the build. This is the mechanical replacement for the safety a
relational query planner plus a DBA review would have given, and it catches the most common
production failure mode: a query that is fast on seed data and catastrophic at scale because
its index was never actually used.

**End-to-end (supertest against the assembled app, real DB, fake external providers).**
Full journeys: register → verify → onboard interests → publish → like → comment →
follow → accept request → mutual → open conversation → send message → search → find the
post and the author as an expert. Authorisation matrix: for every endpoint, assert the
expected status for anonymous, unverified, non-owner, blocked, and owner actors. This
matrix is generated from the route table so a new route without an entry fails CI.

**Ranking-specific.** Golden-file tests: a fixed corpus, fixed profile, fixed clock →
asserted ordered ID list, so any weight change surfaces as an explicit diff.
Property-based tests: scores stay within `[0,1]`; the author cap is never violated; the
follow-share guardrail always holds; MMR output is a permutation of its input.
Online/offline agreement: the incremental interest update and the nightly recompute agree
within cosine 0.02 on a 500-event fixture stream.

**Load.** k6 scenarios for feed (the read-heavy path), search, and message send. Assert
the §2 latency budgets at target concurrency before any release.

CI gates: typecheck, lint (including the boundary rule), unit, contract, integration,
e2e, coverage thresholds, offline ranking replay, and an `openapi.json` diff that fails
if the committed spec is stale.

---

## 21. Configuration

All configuration comes from the environment, parsed once by a Zod schema at boot. A
missing or malformed variable crashes the process immediately with a readable message —
never a runtime surprise on the first request.

```bash
# ── Runtime ────────────────────────────────────────────────────────────────
NODE_ENV=development                  # development|test|production
PORT=4000
API_BASE_URL=http://localhost:4000
APP_PUBLIC_URL=https://prequit.app     # for share links and email deep links
LOG_LEVEL=info

# ── MongoDB Atlas ──────────────────────────────────────────────────────────
# Local dev points at the mongodb-atlas-local container; staging/prod use mongodb+srv://
MONGODB_URI=mongodb://localhost:27017/?directConnection=true
MONGODB_DB=prequit
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=5
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000
MONGODB_READ_CONCERN=majority
MONGODB_WRITE_CONCERN=majority
MONGODB_READ_PREFERENCE=primary            # jobs override with secondaryPreferred
MONGODB_RETRY_WRITES=true
MONGODB_MAX_TIME_MS_READ=250               # per-query server-side cancellation
MONGODB_MAX_TIME_MS_SEARCH=1000
MONGODB_MAX_TIME_MS_JOB=5000
MONGODB_TXN_MAX_COMMIT_TIME_MS=5000
MONGODB_APP_NAME=prequit-api               # shows up in Atlas slow-query profiler

# ── Atlas Search / Vector Search index names ───────────────────────────────
# Versioned so a relevance change can be rolled out blue/green (§8.10)
SEARCH_INDEX_POSTS_TEXT=posts_text
SEARCH_INDEX_POSTS_VECTOR=posts_vector
SEARCH_INDEX_USERS_TEXT=users_text
SEARCH_INDEX_USERS_VECTOR=users_vector
SEARCH_INDEX_TOPICS_TEXT=topics_text
SEARCH_INDEX_TOPICS_VECTOR=topics_vector

# ── Redis ──────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=prequit:

# ── Auth ───────────────────────────────────────────────────────────────────
JWT_PRIVATE_KEY_PEM=                  # RS256; base64 or file path
JWT_PUBLIC_KEY_PEM=
JWT_ISSUER=prequit
JWT_AUDIENCE=prequit-app
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=2592000
CURSOR_HMAC_SECRET=
MIN_AGE_YEARS=13
PASSWORD_MIN_LENGTH=10

# ── Media (Cloudinary) ─────────────────────────────────────────────────────
# The `cloudinary` npm SDK also reads a single CLOUDINARY_URL of the form
# cloudinary://<api_key>:<api_secret>@<cloud_name>. Prefer the explicit vars so
# the Zod schema can validate each one and so the secret is never in a URL that
# might get logged.
CLOUDINARY_CLOUD_NAME=prequit
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=                # server-only; MUST NEVER reach the mobile client
CLOUDINARY_SECURE=true                # always emit https:// URLs
CLOUDINARY_FOLDER_ROOT=prequit/dev    # prequit/dev | prequit/staging | prequit/prod
CLOUDINARY_UPLOAD_PRESET_POST=prequit_post        # signed-mode preset, locked in console
CLOUDINARY_UPLOAD_PRESET_AVATAR=prequit_avatar
CLOUDINARY_MODERATION=aws_rek         # '' disables provider moderation
CLOUDINARY_NOTIFICATION_URL=https://api.prequit.app/api/v1/webhooks/cloudinary
CLOUDINARY_WEBHOOK_TOLERANCE_SECONDS=300
CLOUDINARY_SIGN_URLS_FOR_PRIVATE=true # authenticated delivery for followers-only + DM media
CLOUDINARY_PRIVATE_URL_TTL_SECONDS=600
MEDIA_MAX_BYTES=15728640              # 15 MB, also sent as a signed max_bytes param
MEDIA_ALLOWED_FORMATS=jpg,jpeg,png,webp,heic
MEDIA_PRESIGN_TTL_SECONDS=900         # advertised ticket lifetime
MEDIA_MAX_PER_POST=10

# ── ML ─────────────────────────────────────────────────────────────────────
EMBEDDING_PROVIDER=onnx               # onnx|http
EMBEDDING_MODEL=bge-base-en-v1.5
EMBEDDING_DIMENSION=768
EMBEDDING_HTTP_URL=
EMBEDDING_HTTP_API_KEY=
EMBEDDING_BATCH_SIZE=32
IMAGE_UNDERSTANDING_PROVIDER=noop     # noop|local|http
IMAGE_UNDERSTANDING_HTTP_URL=

# ── Feed ranking (see Appendix B; DB config overrides these) ───────────────
FEED_CANDIDATE_LIMIT=1500
FEED_SESSION_TTL_SECONDS=900
FEED_PAGE_SIZE_DEFAULT=20
FEED_PAGE_SIZE_MAX=50
FEED_EXPLORATION_RATIO=0.15
FEED_MMR_LAMBDA=0.72
FEED_INTEREST_DECAY_DAYS=21
FEED_NEGATIVE_DECAY_DAYS=10
FEED_TOPIC_DECAY_DAYS=30
FEED_SOURCE_TIMEOUT_MS=120
FEED_MIN_FOLLOWING_SHARE=0.30

# ── Search ─────────────────────────────────────────────────────────────────
SEARCH_RRF_K=60
SEARCH_LEXICAL_LIMIT=150
SEARCH_SEMANTIC_LIMIT=150
SEARCH_VECTOR_NUM_CANDIDATES=3000     # 20x limit; recall/latency knob (replaces ef_search)
SEARCH_RERANK_DEPTH=120
FEED_VECTOR_NUM_CANDIDATES=4000
MIN_EXPERTISE_EVIDENCE=5

# ── Email / push ───────────────────────────────────────────────────────────
EMAIL_PROVIDER=smtp                   # smtp|ses|resend
EMAIL_FROM="PreQuit <no-reply@prequit.app>"
SMTP_URL=smtp://localhost:1025
PUSH_FCM_SERVICE_ACCOUNT_JSON=
PUSH_APNS_KEY_P8=
PUSH_APNS_KEY_ID=
PUSH_APNS_TEAM_ID=

# ── Moderation ─────────────────────────────────────────────────────────────
MODERATION_TEXT_PROVIDER=noop
MODERATION_IMAGE_PROVIDER=noop
MODERATION_AUTO_WITHHOLD_REPORT_THRESHOLD=3

# ── Observability ──────────────────────────────────────────────────────────
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_SERVICE_NAME=prequit-api
METRICS_ENABLED=true
```

---

## 22. Local Development & Deployment

`docker-compose.yml` provides `mongodb/mongodb-atlas-local`, `redis:7`, and `mailhog`.

```yaml
services:
  mongodb:
    image: mongodb/mongodb-atlas-local:8.0
    ports: ['27017:27017']
    volumes:
      - mongodata:/data/db
      - mongoconfig:/data/configdb
      - mongot:/data/mongot          # persist search indexes across restarts
    healthcheck:
      test: ['CMD', 'mongosh', '--quiet', '--eval', "db.adminCommand('ping')"]
      interval: 10s
      retries: 12
```

The Atlas Local image is what makes local development honest: it runs `mongod` **and**
`mongot` as a single-node replica set, so `$search`, `$vectorSearch`, and `$rankFusion` all
work offline and behave as they do on Atlas. Two consequences worth internalising: a plain
`mongo` image will fail every search query with an unrecognised-stage error, and because it is
a replica set, transactions work locally too (they are unavailable on a standalone `mongod`,
which would otherwise hide transaction bugs until staging).

It is a development and test tool only — never production. The `mongot` volume is worth
keeping, since without it every `docker compose down` discards search indexes and the next
`db:sync-indexes` rebuild takes a minute on seeded data.

Media is the one external dependency that is not containerised: create a free Cloudinary
account, and point `CLOUDINARY_FOLDER_ROOT` at `prequit/dev/{yourName}` so several developers
can share one cloud without colliding. The default `EMBEDDING_PROVIDER=onnx` downloads the
model on first boot and caches it, and `IMAGE_UNDERSTANDING_PROVIDER=noop` keeps the dev loop
fast.

Two dev-only accommodations for Cloudinary, both required:

- **Webhooks cannot reach `localhost`.** Either run a tunnel
  (`pnpm dev:tunnel` wraps `cloudflared`/`ngrok` and rewrites
  `CLOUDINARY_NOTIFICATION_URL`), or set `CLOUDINARY_MODERATION=` (empty) so
  `media.finalize` marks assets `ready` directly and no callback is expected. The
  `media.reconcile` job also serves as a manual catch-up: `pnpm cli media:sync`.
- **Tests never call Cloudinary.** `FakeMediaStorage` returns a deterministic ticket and a
  canned `RemoteAsset`, and `FakeMediaUrlBuilder` emits `https://media.test/{publicId}/{variant}`.
  Only one integration test is allowed to hit the real API — a smoke test, tagged
  `@external`, skipped unless `CLOUDINARY_API_SECRET` is present — and it uploads a 1×1
  pixel and destroys it in `afterAll`.

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:sync-indexes         # indexes + validators + search indexes; idempotent
pnpm db:await-search         # polls $listSearchIndexes until every index is READY
pnpm db:migrate              # migrate-mongo data migrations
pnpm db:seed                 # ~40 users, ~600 posts, engagement, topics, embeddings
pnpm dev                     # API + WS with reload
pnpm dev:worker              # queues + scheduler
pnpm test                    # unit + contract
pnpm test:integration        # spins testcontainers (atlas-local + redis)
pnpm db:explain              # explain() the hot queries, fail on COLLSCAN
pnpm openapi:write           # regenerate docs/openapi.json
```

`db:await-search` exists because search index builds are asynchronous: seeding immediately
after `db:sync-indexes` produces a database whose documents are not yet searchable, and the
resulting "search returns nothing" is the single most common false alarm when onboarding.
The same command runs in CI between migration and integration tests.

Seed data MUST be realistic enough to exercise ranking: overlapping interest clusters,
a few high-expertise users per topic, mutual and one-way follows, private accounts,
blocks, and a spread of post ages. A feed that looks sensible on the seed set is the
first acceptance check.

Processes in production: `api` (HTTP + WS, N replicas behind a load balancer with sticky
sessions not required thanks to the Redis adapter), `worker` (M replicas, queue-scoped
via `--queues=`), `scheduler` (exactly one replica; repeatable jobs are registered with
fixed job IDs so duplicates are impossible). Graceful shutdown: stop accepting, drain
in-flight requests, close sockets with a reconnect hint, let workers finish the current
job (30 s grace). `db:sync-indexes` and `db:migrate` run as pre-deploy jobs, and every
migration must be backward compatible with the currently-running code (expand → migrate →
contract, across two releases).

**Atlas topology.** One project per environment with separate clusters, so a staging load test
cannot touch production data. Production runs a 3-node replica set (M30 or larger, sized so the
working set including vector indexes fits in RAM) plus **dedicated Search Nodes**, which keep
Lucene query load off the nodes serving writes — without them, one expensive search competes
with the feed for the same CPU. Sharding is deliberately not part of v1: at 1M users and 50M
posts a well-indexed replica set is sufficient, and the shard key choice would be difficult to
reverse. If it becomes necessary, `posts` shards on hashed `authorId` and `interactionEvents`
on `{meta.userId: 'hashed'}` — never on the time field alone, which would send every write to
one chunk.

Enable the Atlas **Query Profiler** and **Performance Advisor** in every environment, and treat
an Advisor index suggestion as a bug report against the declarative index definitions rather
than something to click-apply in the UI — an index created by hand in the console will be
invisible to code review and will vanish on the next environment rebuild.

---

## 23. Implementation Milestones

Each milestone is independently shippable and ends with green tests. Do not begin one
before the previous is complete — later milestones depend on the earlier scaffolding.

**M0 — Skeleton.** Project setup, strict TS, ESLint with boundary rules, Docker Compose with
the Atlas Local image, config parsing, logger, health endpoints, error envelope,
`Result`/`DomainError` bases, `Clock`/`IdGenerator`/`RandomSource` ports and adapters, the
Mongo client with pool and concern configuration, `MongoUnitOfWork` with session-based
transactions and transient-error retry, the `db:sync-indexes` runner, the outbox collection and
publisher, driver-error translation (`E11000` → `ConflictError`), the operator-injection
`preValidation` hook, an empty container, and one trivial end-to-end test through all layers.
*Done when:* `GET /health/ready` passes in CI against real containers, a boundary violation
fails the lint step, and an operator-injection payload returns `400`.

**M1 — Identity.** Users, sessions, verification tokens. Register, verify, login,
refresh with family revocation, logout, password reset/change, sessions list/revoke,
handle availability, deactivate/delete. Auth middleware, rate limiting, idempotency
middleware. *Done when:* the auth authorisation matrix e2e test is green.

**M2 — Profiles & graph.** Profile read/update, settings, avatar, follow/unfollow,
follow requests, mutuals, block, mute, followers/following lists, suggested users
(graph-only for now). `MutualityPolicy` and `FollowPolicy` with full unit coverage.
*Done when:* block cascade and privacy rules are proven by integration tests.

**M3 — Media & content.** `MediaStorage` / `MediaUrlBuilder` ports with the Cloudinary
adapters and fakes, signed upload tickets, server-side confirm verification, the
`/webhooks/cloudinary` route with signature verification, `media.finalize`, named
transformations, and cleanup. Posts CRUD with hashtag/mention extraction, visibility
rules, revisions, profile timeline, chronological following feed. *Done when:* a post with
three images round-trips through a real Cloudinary upload, the returned URLs render at all
three variants, and the post appears in a follower's following feed.

**M4 — Engagement.** Likes, comments and replies, comment likes, pin, mark helpful,
saves and collections, shares (link + repost), reports intake, notifications (in-app),
counter debouncing and reconciliation. *Done when:* counters survive a 500-concurrent-like
integration test and reconcile to the exact value.

**M5 — Messaging.** Conversations with the mutuality gate, messages with nonce dedupe,
receipts, reactions, edit/delete, unread counts, WebSocket gateway with the Redis adapter,
presence, typing, push on offline, share-to-conversation wired to M4. *Done when:* two
clients on two API instances exchange messages with correct receipts.

**M6 — Enrichment & search.** Embedding provider with caching, image understanding, topic
taxonomy and classifier, population of `posts.embedding` / `imageCaption` / `imageText` /
`topComments`, backfill CLI. All Atlas Search and Vector Search index definitions plus the
`db:await-search` gate. Query understanding, the `$rankFusion` hybrid pipeline, the
cross-collection retrievers, post re-ranking, suggest, trending, search history and click
telemetry. *Done when:* a fixture corpus returns the expected top-3 for a set of 20 golden
queries, and an `explain` test proves the hybrid pipeline uses both search indexes.

**M7 — Ranking.** Interaction event ingestion, impression/dwell telemetry, interest
profiles (online + nightly recompute), topic and author affinity, neighbours, velocity,
quality scores with position-bias correction, the full pipeline with all sources,
signals, filters, and rerankers, session caching, feed feedback, guardrails, admin config,
offline replay harness. *Done when:* golden-file ranking tests pass, guardrails hold on
the seed set, and p95 latency meets §2.

**M8 — Expertise & polish.** Expertise scoring with all five components and the
anti-gaming rules, `/search/experts`, expertise on profiles, expertise-aware people
ranking and suggested users, moderation queue and enforcement, admin endpoints, data
export, purge jobs, full observability, load tests. *Done when:* for each seeded topic,
the known-expert user ranks top-3 for that topic's representative problem query.

---

## Appendix A — Error Codes

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Schema or semantic validation failed; see `details` |
| `MALFORMED_REQUEST` | 400 | Unparseable body or bad cursor |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired access token |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `REFRESH_TOKEN_INVALID` | 401 | Unknown or expired refresh token |
| `REFRESH_TOKEN_REUSED` | 401 | Rotated token replayed; family revoked |
| `EMAIL_NOT_VERIFIED` | 403 | Action requires a verified email |
| `ACCOUNT_SUSPENDED` | 403 | See `payload.until` |
| `ACCOUNT_DEACTIVATED` | 403 | Reactivate first |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `PROFILE_IS_PRIVATE` | 403 | Follow to view |
| `BLOCKED_RELATIONSHIP` | 403 | A block exists in one direction |
| `NOT_MUTUAL_FOLLOWERS` | 403 | Messaging/sharing requires a mutual follow |
| `NOT_CONVERSATION_PARTICIPANT` | 403 | |
| `CONVERSATION_READ_ONLY` | 403 | Mutuality was lost |
| `USER_NOT_FOUND` | 404 | Absent, deleted, or hidden by a block |
| `POST_NOT_FOUND` | 404 | |
| `COMMENT_NOT_FOUND` | 404 | |
| `CONVERSATION_NOT_FOUND` | 404 | |
| `MEDIA_NOT_FOUND` | 404 | |
| `TOPIC_NOT_FOUND` | 404 | |
| `POST_DELETED` | 410 | Existed, now gone |
| `HANDLE_ALREADY_TAKEN` | 409 | |
| `EMAIL_ALREADY_REGISTERED` | 409 | |
| `ALREADY_FOLLOWING` | 409 | |
| `FOLLOW_REQUEST_PENDING` | 409 | |
| `ALREADY_LIKED` | 409 | Only on non-idempotent paths |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Same key, different body |
| `CONCURRENT_MODIFICATION` | 409 | Optimistic-lock failure; retry |
| `UNDERAGE_ACCOUNT` | 422 | Below `MIN_AGE_YEARS` |
| `WEAK_PASSWORD` | 422 | |
| `INVALID_HANDLE` | 422 | Charset, length, or reserved |
| `CANNOT_FOLLOW_SELF` | 422 | |
| `CANNOT_MESSAGE_SELF` | 422 | |
| `MEDIA_NOT_READY` | 422 | Referenced asset is still processing or awaiting moderation |
| `MEDIA_VALIDATION_FAILED` | 422 | Real size/format/dimensions disagree with policy on confirm |
| `MEDIA_UPLOAD_NOT_FOUND` | 422 | Confirm called but the provider has no such asset |
| `MEDIA_REJECTED` | 422 | Failed automated moderation |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | Bad or stale provider callback signature |
| `TOO_MANY_MEDIA` | 422 | > `MEDIA_MAX_PER_POST` |
| `DESCRIPTION_TOO_LONG` | 422 | |
| `COMMENT_DEPTH_EXCEEDED` | 422 | Replies to replies are not allowed |
| `CONTENT_POLICY_VIOLATION` | 422 | Blocked by moderation pre-check |
| `PAYLOAD_TOO_LARGE` | 413 | |
| `RATE_LIMIT_EXCEEDED` | 429 | Generic; see `Retry-After` |
| `FOLLOW_RATE_EXCEEDED` | 429 | |
| `POST_RATE_EXCEEDED` | 429 | |
| `MESSAGE_RATE_EXCEEDED` | 429 | |
| `INTERNAL_ERROR` | 500 | |
| `DEPENDENCY_UNAVAILABLE` | 503 | DB/Redis/storage/model down |
| `FEED_DEGRADED` | 200 | Not an error — a `meta.warnings` entry when sources timed out |

---

## Appendix B — Tunable Constants

Defaults. All are overridable through `RankingConfig` in the database; changing one
requires an offline-replay result in the PR description.

**Signal weights (home feed).** Must sum to 1.0.

| Signal | Weight |
|---|---|
| SemanticRelevance | 0.28 |
| AuthorAffinity | 0.19 |
| TopicAffinity | 0.16 |
| ContentQuality | 0.14 |
| Freshness | 0.11 |
| SocialProof | 0.08 |
| *(NegativeInterest)* | multiplicative penalty, up to −55% |

**Engagement weights (quality + profile updates).**

| Action | Weight |
|---|---|
| like | 1.0 |
| comment | 3.0 |
| reply | 2.0 |
| save | 4.0 |
| share | 5.0 |
| profile visit from post | 1.5 |
| full-carousel view | 0.5 |
| hide | −4.0 |
| report | −8.0 |
| not_interested | −6.0 |

**Decay and half-lives.** Interest vector τ 21 d; negative vector τ 10 d; topic affinity
τ 30 d; expertise decay τ 180 d; freshness half-life 18 h (following) / 36 h (discovery)
/ 6 h (trending).

**Quality.** Prior strength 50 virtual impressions; half-saturation 0.08; position
propensity `1 / (1 + 0.09 · position)`.

**Pipeline.** Candidate target 1,500; per-source timeout 120 ms; page size 20 (max 50);
session cache 200 items / 15 min; MMR λ 0.72; exploration ratio 0.15 (floor 0.05, ceiling
0.30); author cap 2 per 20; topic cap 5 per 20; min distinct authors 8 per 20; min
following share 0.30; seen hard-exclude at 3 impressions / 7 days.

**Search.** RRF k 60; lexical limit 150; semantic limit 150; rerank depth 120;
`numCandidates` 3,000 (search) / 4,000 (feed) / 1,000 (people) / 400 (related) / 100
(suggest and topic resolution); topic-match threshold 0.60; expansion lexical weight 0.40;
suggest cap 10.

**Mongo.** Pool max 50 / min 5; `maxTimeMS` 250 ms (reads) / 1,000 ms (search) / 5,000 ms
(jobs); transaction commit timeout 5 s; batch size 1,000 for `bulkWrite`; outbox claim lease
60 s; outbox publish batch 200.

**Expertise.** Component weights 0.45 / 0.25 / 0.12 / 0.10 / 0.08; minimum evidence 5;
reciprocal-engagement discount 0.6 above a 60% concentration; single-post contribution cap
25%; inactivity multiplier 0.7 after 90 days.

**Limits.** Description 2,200 chars; comment 1,000; bio 300; display name 50; handle
3–24; hashtags per post 30; mentions per post 20; media per post 10; media 15 MB;
collections per user 50; declared interests 3–20.

---

## Final Instruction to the Implementer

Build in the milestone order in §23. Before writing any use case, create its port
interfaces and its in-memory fake; write the unit test against the fake first; only then
write the MongoDB adapter and run the shared contract suite against both. Never reach
for a concrete adapter inside `application/`, never let a Fastify type or a driver type
(`ObjectId`, `Document`, `ClientSession`, `Collection`) cross into `domain/`, and never add a
`switch` where a registered implementation would do. If a requirement here appears to conflict
with a clean layering, the layering wins and the requirement should be raised as a question
rather than resolved by a shortcut.

Three MongoDB-specific failure modes are worth naming, because each is easy to introduce and
expensive to discover late:

1. **A query with no supporting index.** It will be fast on seed data and will take the site
   down at scale. The `explain` tests in §20 exist to catch this; do not skip them when adding
   a query.
2. **A `$vectorSearch` filter on a path not declared as `filter` in the index definition.**
   It fails silently — results are simply worse — so whenever a retrieval path gains a filter,
   the index definition must change in the same commit.
3. **An operation inside `UnitOfWork.run` that does not receive the session.** It commits
   independently of the transaction, so a rollback leaves it behind. This is why repositories
   are resolved from the transaction context; never construct one directly inside `run`.
