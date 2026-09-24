# GroundWave Technology Menu & Architecture Decision Record (`TECH_MENU.md`)

> **Mandatory Architecture Standard** for all human engineers and AI coding agents building **GroundWave (`groundwave.fm`)**.
> Any addition of dependencies or deviation from this menu requires an explicit Architectural Decision Record (ADR) approval.

---

## 1. System Architecture Overview

```
                                  ┌──────────────────────────────────────────────────┐
                                  │               GroundWave Platform                │
                                  └─────────────────────────┬────────────────────────┘
                                                            │
                    ┌───────────────────────────────────────┼───────────────────────────────────────┐
                    │                                       │                                       │
     ┌──────────────▼──────────────┐         ┌──────────────▼──────────────┐         ┌──────────────▼──────────────┐
     │      Frontend Clients       │         │       Backend & Media       │         │      Data & Spatial         │
     ├─────────────────────────────┤         ├─────────────────────────────┤         ├─────────────────────────────┤
     │ • Next.js 15 (App Router)   │         │ • Express / Node.js 20+     │         │ • PostgreSQL 16 + PostGIS   │
     │ • React 19 + TypeScript 5.8 │         │ • BullMQ + Redis 7 Queue    │         │ • Uber H3 Resolution 8      │
     │ • Tailwind CSS + Radix UI   │         │ • FFmpeg Audio Pipeline     │         │ • pgvector Embeddings       │
     │ • TanStack React Query v5   │         │ • Direct-to-Storage (S3/R2) │         │ • Native SQL / Kysely Pool  │
     │ • @groundwave/audio-core    │         │ • Stripe Connect Splits     │         │ • Vitest + V8 Coverage Gate │
     └─────────────────────────────┘         └─────────────────────────────┘         └─────────────────────────────┘
```

---

## 2. Approved Technology Stack by Tier

### 2.1 Frontend & Client Applications (`apps/web`, `apps/mobile`)

| Category | Approved Technology | Rationale & Architectural Choice | Prohibited Alternatives |
| :--- | :--- | :--- | :--- |
| **Web Framework** | **Next.js 15 (App Router)** | Hybrid Server Components for SEO-indexed public artist hubs + Client Islands for the uninterrupted persistent audio player. | Pages Router, Create-React-App, Gatsby, Vite SPA |
| **Mobile Framework** | **React Native (Expo SDK 52+)** | Maximum cross-platform code reuse with `@groundwave/audio-core` and `@groundwave/types`. | Flutter (fragments code into Dart), Separate native Swift/Kotlin silos |
| **Language** | **TypeScript 5.8+ (Strict Mode)** | End-to-end compile-time safety across packages and applications. Zero `any`. | Vanilla JavaScript |
| **Styling System** | **Tailwind CSS v4** | Zero runtime CSS overhead, full compatibility with React Server Components, utility-first design. | CSS-in-JS (Emotion, Styled-Components), SCSS modules |
| **UI Primitives** | **Radix UI Primitives** | Unstyled, fully accessible (WAI-ARIA compliant) headless primitives. | Material UI (MUI), Chakra UI, Ant Design (heavy runtime bloat) |
| **Iconography** | **Lucide React** | Consistent, tree-shakeable SVG icon collection. | FontAwesome, monolithic icon font packages |
| **Client State & Data Fetching** | **TanStack React Query v5** | Declarative caching, optimistic mutations, automatic background revalidation, window focus refetching. | Redux / Redux Toolkit, MobX (unnecessary boilerplate for server-synced state) |
| **Audio Engine** | **HTML5 Audio / Web Audio API + HLS.js** in [`@groundwave/audio-core`](../packages/audio-core) | Custom deterministic finite state machine, 24-bit lossless streaming, persistent dock without route unmounting. | Howler.js, React-Player, Soundmanager2 (fail on adaptive HLS bitrate streaming) |

---

### 2.2 Backend Services, Media & Ingestion (`apps/api`, `apps/media-worker`)

| Category | Approved Technology | Rationale & Architectural Choice | Prohibited Alternatives |
| :--- | :--- | :--- | :--- |
| **API Runtime & Framework** | **Node.js 20+ LTS / Express (TypeScript)** | Lightweight, non-blocking asynchronous event loop, fast request routing, native monorepo workspace integration. | NestJS (heavy enterprise OOP abstraction), Django / Rails |
| **Payload Validation** | **Zod 3.x** | Strict runtime schema parsing with automated TypeScript type inference. | Joi, manual `if (!req.body.xyz)` validation |
| **Authentication & RBAC** | **Stateless JWT + Entity RBAC** | Lightweight token exchange verifying personal identity (`users`) and multi-role team permissions (`entity_memberships`). | Stateful sessions in server memory, opaque session tables |
| **Media Ingestion Architecture** | **Direct-to-Storage Presigned Uploads** | Master WAV/FLAC files (up to 2GB) upload directly from client to S3/R2 storage. The Node.js API server NEVER buffers multi-GB audio files in RAM. | Multer memory storage / disk streaming through API gateway |
| **Asynchronous Job Queues** | **BullMQ + Redis 7** | Robust Redis-backed distributed task queue with retry backoff, concurrency limiting, and transcode progress telemetry. | Synchronous inline processing in HTTP handlers, RabbitMQ / Celery |
| **Audio Transcoding Engine** | **FFmpeg (C-binary via Worker)** | Multi-bitrate HLS segmentation (128k AAC, 320k AAC, Lossless FLAC) and 100-point normalized waveform JSON extraction. | Third-party cloud SaaS encoders (recurring cost, slow roundtrip) |
| **Payment & Royalty Splits** | **Stripe Connect Custom/Express** | Native multi-party instant payout routing (`royalty_split_pct`) for band members, labels, and curator shows. | PayPal, manual monthly batch transfers |

---

### 2.3 Database, Spatial & Storage (`packages/database`)

| Category | Approved Technology | Rationale & Architectural Choice | Prohibited Alternatives |
| :--- | :--- | :--- | :--- |
| **Primary Relational DB** | **PostgreSQL 16+** | Rock-solid ACID compliance, JSONB support, high-performance connection pooling. | MySQL, MongoDB |
| **Spatial Engine** | **PostGIS 3.4+** | Native geometry types (`POINT`), geodesic distance indexing (`ST_DWithin`), spatial acceleration. | Manual Haversine math queries on floating-point lat/lng columns |
| **Neighborhood Indexing & Privacy** | **Uber H3 (Resolution 8: ~1km hex)** | Mathematical hexagonal tiling obfuscates raw GPS coordinates while enabling instant scene radius lookups (`gridDisk`). | Exact GPS coordinate exposure, zip code radius approximations |
| **Vector Similarity Search** | **pgvector** | Acoustic similarity matching and scene recommendation embeddings directly inside PostgreSQL. | Pinecone / Weaviate standalone vector databases (eliminates cross-database sync errors) |
| **Database Access Layer** | **Raw SQL DDL + Type-Safe Pool / Kysely** | Complete control over PostGIS/pgvector SQL expressions without ORM translation bugs or impedance mismatch. | **Prisma / TypeORM / Sequelize** (they mangle PostGIS/pgvector and generate inefficient N+1 queries) |
| **Object Storage API** | **S3-Compatible Protocol** | Local filesystem / MinIO during dev; Cloudflare R2 (zero egress fees) / AWS S3 in production. | Database BLOB columns, local un-replicated filesystem in production |

---

### 2.4 Testing, Tooling & Quality Gate

| Category | Approved Technology | Rationale & Architectural Choice | Prohibited Alternatives |
| :--- | :--- | :--- | :--- |
| **Monorepo Engine** | **Turborepo 2.x + pnpm 12.x** | High-speed incremental build caching, deterministic dependency graphs, workspace isolation. | Lerna, npm workspaces, Yarn Classic |
| **Test Runner & Coverage** | **Vitest + `@vitest/coverage-v8`** | Native ESM/TypeScript execution, rapid parallel execution, enforceable tiered coverage thresholds. | Jest, Mocha |
| **Integration Test Tool** | **Supertest** | High-fidelity HTTP route assertion against Express apps without port binding conflicts. | Manual curl scripts |
| **Git Hook Automation** | **Husky 9.x (`pre-push`)** | Automates branch protection for `main` and runs local lint + coverage checks before code leaves the machine. | Untracked raw `.git/hooks` |
| **CI Automation** | **GitHub Actions** | Automated validation against containerized PostgreSQL/PostGIS services on every push and PR. | Untested merges |

---

## 3. Explicitly Prohibited Technologies & Anti-Patterns ("The Blacklist")

1. 🚫 **No Heavy ORMs (Prisma, TypeORM, Sequelize)**:
   * **Why**: PostGIS spatial operators (`ST_DWithin`, `ST_MakePoint`, `ST_Distance`) and `pgvector` operators (`<->`) require pure SQL control. ORMs obscure query performance and generate bloated SQL joins.
2. 🚫 **No Buffering Large Audio in Node.js RAM**:
   * **Why**: High-resolution audio masters (24-bit 96kHz WAV files) can exceed 1GB per track. Buffering these in Node.js heap will trigger Out-Of-Memory (OOM) crashes. Always use direct-to-storage presigned upload URLs.
3. 🚫 **No Monolithic Component Kits (MUI, Chakra, Ant Design)**:
   * **Why**: Heavy runtime JavaScript CSS-in-JS solutions degrade rendering performance and audio playback smoothness. All UI must use Tailwind CSS + Radix UI headless primitives.
4. 🚫 **No Untyped Data Boundaries**:
   * **Why**: Every API request payload, database row, and shared domain entity must be strictly typed in `@groundwave/types`. No `any`, no loose untyped objects.
5. 🚫 **No Direct Pushes to `main`**:
   * **Why**: All changes must follow trunk-based development with short-lived feature branches (`feat/GW-...`) and pull requests passing CI.
