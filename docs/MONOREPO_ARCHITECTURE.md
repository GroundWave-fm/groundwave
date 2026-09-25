# Groundwave Monorepo Architecture & Developer Guide

## 1. Overview
Groundwave uses a high-performance **Turborepo + pnpm** monorepo setup to manage all web, mobile, backend, and media processing applications with shared type safety and build caching.

---

## 2. Directory Layout

```
groundwave/
├── apps/
│   ├── web/                  # Next.js 15 Web Player & Creator Studio (groundwave.fm)
│   ├── api/                  # Core REST & GraphQL API service (Express / TypeScript)
│   ├── media-worker/         # FFmpeg HLS Transcoding & Waveform Extraction Worker
│   └── mobile/               # Mobile Client (iOS & Android)
│
├── packages/
│   ├── types/                # Shared TypeScript domain models & Zod schemas
│   ├── database/             # PostgreSQL DDL, PostGIS / pgvector initial schema
│   ├── audio-core/           # Persistent audio state machine & queue helpers
│   └── config/               # Shared tsconfig, ESLint, and Prettier rules
│
├── docs/                     # Founding documents, PRD, architecture, and sprint plans
├── docker-compose.yml        # Local PostgreSQL 16 (PostGIS) + Redis
├── turbo.json                # Turborepo task pipeline configuration
├── pnpm-workspace.yaml       # pnpm workspace definition
└── .env.example              # Environment variables template
```

---

## 3. Package & Application Responsibilities

| Workspace | Package Name | Description |
| :--- | :--- | :--- |
| `apps/web` | `@groundwave/web` | Next.js 15 application hosting the public web player, scene radar exploration, artist hubs, and creator studio. |
| `apps/api` | `@groundwave/api` | Core backend handling authentication, profile management, releases, community hubs, and Stripe Connect. |
| `apps/media-worker` | `@groundwave/media-worker` | Asynchronous worker ingesting WAV/FLAC masters and outputting adaptive HLS (128k, 320k, FLAC) and waveforms. |
| `apps/mobile` | `@groundwave/mobile` | iOS and Android client with CarPlay / Android Auto support. |
| `packages/types` | `@groundwave/types` | Central source of truth for TypeScript interfaces (Users, Tracks, Releases, Hubs, Storefront). |
| `packages/database` | `@groundwave/database` | Schema definitions (`init.sql`), PostGIS spatial indexes, and DB clients. |
| `packages/audio-core`| `@groundwave/audio-core` | Pure playback state machine and queue manipulation functions. |
| `packages/config` | `@groundwave/config` | Base `tsconfig.base.json` and tooling rules. |

---

## 4. Local Development Workflows

### Prerequisites
* **Node.js**: `>= 20.0.0`
* **pnpm**: `>= 9.0.0` (`npm install -g pnpm`)
* **Docker & Docker Compose**: For local PostgreSQL and Redis

### Commands
```bash
# 1. Install all dependencies across the entire monorepo
pnpm install

# 2. Start local PostgreSQL & Redis
pnpm db:up

# 3. Start all services in development mode (API on :4000, Web on :3000)
pnpm dev

# 4. Build all packages and applications
pnpm build

# 5. Typecheck & lint across all workspaces
pnpm lint
```
