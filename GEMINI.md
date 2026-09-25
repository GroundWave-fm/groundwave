# GroundWave Development & Agent Collaboration Guidelines (`GEMINI.md`)

> **Single Source of Truth** for human lead developers and AI coding agents contributing to **GroundWave (`groundwave.fm`)**.
> All contributors MUST strictly follow the specifications, architectural blueprints, and technology standards defined herein and in the [`docs/`](./docs) directory.

---

## 1. Documentation-First & Core Engineering Principles

1. **Strict Documentation Adherence**:
   * Before implementing any feature, route, or schema change, agents and developers MUST read and adhere to the relevant documents:
     * 📋 [**Technology Menu & Architectural Standards (`docs/TECH_MENU.md`)**](./docs/TECH_MENU.md) — Approved frameworks, tools, and prohibited technologies.
     * 🧭 [**Master Plan & Persona Journeys (`docs/MASTER_PLAN.md`)**](./docs/MASTER_PLAN.md) — UX flows for Maya, Liam, Marcus, Elena, and Jordan.
     * 📐 [**Architecture Specification (`docs/ARCHITECTURE_SPEC.md`)**](./docs/ARCHITECTURE_SPEC.md) — Database schema, spatial indexing, audio pipelines.
     * 📜 [**Product Requirements Document (`docs/PRODUCT_REQUIREMENTS_DOCUMENT.md`)**](./docs/PRODUCT_REQUIREMENTS_DOCUMENT.md) — Functional and non-functional requirements.
     * 🎯 [**Phase 1 Epics Breakdown (`docs/PHASE_1_EPICS_BREAKDOWN.md`)**](./docs/PHASE_1_EPICS_BREAKDOWN.md) — Specific deliverables per ticket.
2. **Feature Atomization**: Every task, feature, or bug fix MUST be broken down into small, self-contained, reviewable units. Never bundle unrelated changes across apps/packages into a single PR.
3. **End-to-End Type Safety**: All domain data models, API payloads, and database entities MUST be defined in `@groundwave/types` before implementation. No `any` types or loose untyped JSON objects.
4. **Monorepo Dependency Integrity**:
   * Applications (`apps/*`) depend on shared packages (`packages/*`).
   * Packages MUST NEVER import from `apps/*` or create circular dependencies.
   * Business and domain logic shared across Web and Mobile belongs in `packages/*`.
5. **Zero-Breaking-Change Database Migrations**: All schema updates must be backward-compatible and tested via `pnpm db:migrate` and `pnpm db:seed`.
6. **Mandatory Test Coverage**: All critical modules, APIs, and algorithmic utilities must meet or exceed tiered test coverage thresholds before merge.
7. **No Secret Leaks**: Never hardcode API keys, Stripe secrets, or credentials. Always update `.env.example` when introducing new environment variables.

---

## 2. Technology Menu Enforcement & Prohibited Patterns

All development must comply with [**`docs/TECH_MENU.md`**](./docs/TECH_MENU.md). The following anti-patterns are strictly prohibited:

1. 🚫 **No Heavy ORMs (Prisma, TypeORM, Sequelize)**:
   * PostGIS spatial operators (`ST_DWithin`, `ST_MakePoint`) and `pgvector` similarity queries (`<->`) require pure SQL control. Use raw SQL migrations and type-safe connection pool queries.
2. 🚫 **No Buffering Large Audio in Node.js RAM**:
   * Never use `multer.memoryStorage()` for tracks. Always issue direct-to-storage presigned upload URLs (S3/R2/local).
3. 🚫 **No Monolithic Component Kits (MUI, Chakra, Ant Design)**:
   * All UI must use **Tailwind CSS v4** + **Radix UI** headless primitives.
4. 🚫 **No Untyped Data Boundaries**:
   * Cross-boundary data must originate in `@groundwave/types`.

---

## 3. Test Coverage & Quality Engineering Standards

GroundWave enforces a **zero-compromise test coverage gate** using **Vitest** and `@vitest/coverage-v8`.

### 3.1 Tiered Coverage Thresholds

| Layer / Package | Scope & Responsibility | Min Lines | Min Branches | Min Functions | Min Statements |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Tier 1: Core Domain Packages**<br>`@groundwave/audio-core`<br>`@groundwave/database` (geo/helpers) | Playback state machine, queue mutations, H3 spatial calculations, royalty math | **85%** | **80%** | **85%** | **85%** |
| **Tier 2: Backend Services**<br>`apps/api`<br>`apps/media-worker` | Auth/RBAC middleware, presigned media ingestion, routes, FFmpeg transcode pipeline | **80%** | **75%** | **80%** | **80%** |
| **Tier 3: Frontend Client Apps**<br>`apps/web`<br>`apps/mobile` | Player dock hooks (`useAudioEngine`), release upload forms, localized scene radio UI | **70%** | **65%** | **70%** | **70%** |

### 3.2 Test Types & Co-Location
* **Unit Tests (`*.test.ts`)**: Co-located next to implementation code (e.g. `packages/audio-core/src/index.test.ts`). Pure, deterministic, < 10ms execution.
* **API Integration Tests (`*.test.ts`)**: Supertest integration tests validating status codes, validation errors, and DB operations against live/test databases.
* **Continuous Testing**: Always run `pnpm test:coverage` locally before committing or opening a PR.

---

## 4. Git, Branching Strategy & Pre-Push Guard

GroundWave follows **Trunk-Based Development with Short-Lived Feature Branches**:

```
main (production-ready)
  ├── feat/GW-201-presigned-audio-upload  ──► PR ──► Merge to main
  ├── feat/GW-301-persistent-audio-dock   ──► PR ──► Merge to main
  └── fix/GW-101-curator-schema-typo      ──► PR ──► Merge to main
```

### 4.1 Husky Pre-Push Guard
* A `.husky/pre-push` hook is installed on all contributor environments.
* **Direct pushes to `main` are automatically blocked**.
* **Pre-push quality check**: Automatically runs `pnpm lint` and `pnpm test:coverage` before any branch push is sent to GitHub.

### 4.2 Branch Naming Conventions
* `feat/GW-<issue-number>-<short-description>` (e.g. `feat/GW-201-audio-ingestion`)
* `fix/GW-<issue-number>-<short-description>` (e.g. `fix/GW-101-schema-reset`)
* `chore/<short-description>` (e.g. `chore/upgrade-turborepo`)
* `docs/<short-description>` (e.g. `docs/api-specification`)

### 4.3 Conventional Commit Standard
All commit messages must strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short imperative summary> (fixes #<issue-number>)

[optional body explaining non-obvious rationale]
```

* **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
* **Scopes**: `web`, `api`, `media-worker`, `mobile`, `database`, `types`, `audio-core`, `config`.
* **Examples**:
  * `feat(api): implement presigned direct upload endpoint (fixes #3)`
  * `test(audio-core): add queue transition and coverage thresholds (fixes #11)`
  * `fix(database): add missing curator_profiles table to init.sql (fixes #1)`

---

## 5. Pull Request (PR) & Review Process

Every PR must be linked to an active issue in the **GroundWave-fm/GroundWave** repository.

### 5.1 Pre-PR Checklist (The Quality Gate)
Before opening a PR, the agent and developer MUST verify that:
- [ ] Read and adhered to the specifications in [`docs/`](./docs).
- [ ] `pnpm build` passes with zero TypeScript or compilation errors across all packages.
- [ ] `pnpm lint` passes with zero linting warnings.
- [ ] `pnpm test:coverage` passes and meets all package coverage thresholds.
- [ ] Database migrations (`pnpm db:migrate`) and seed scripts (`pnpm db:seed`) run cleanly.
- [ ] Automated tests or manual verification logs are documented in the PR body.

### 5.2 PR Description Template
All Pull Requests must use the standard template in [`.github/pull_request_template.md`](./.github/pull_request_template.md):

```markdown
### Summary of Changes
- Bulleted description of what was implemented.

### Related Issue
Closes #<issue-number>

### Verification & Testing
- [x] Ran `pnpm build` successfully across all packages.
- [x] Ran `pnpm test:coverage` with all thresholds satisfied.
- [x] Ran `pnpm db:reset` and verified database seeding.
- [x] Tested endpoint / UI flow via curl / browser.

```json
// Example test payload or curl response
```
```

---

## 6. Agent Guidelines & Collaboration Rules

When an AI Agent is acting as a lead developer on a task:

1. **Read Before Writing**: Always inspect the relevant `packages/types/src/index.ts`, `docs/ARCHITECTURE_SPEC.md`, `docs/TECH_MENU.md`, and existing code before generating solutions.
2. **Execute Locally & Verify**: Never claim a task is complete without running `pnpm build`, `pnpm test:coverage`, or testing the execution output.
3. **Respect the Entity Model**:
   * Human authentication belongs in `users`.
   * Bands, Solo Acts, Record Labels, Curators, and Venues are `creator_entities`.
   * Permissions and band member shares are stored in `entity_memberships`.
4. **Issue Traceability**: Always include `(fixes #<number>)` in commit messages so GitHub automatically tracks and closes completed issues.

---

## 7. Standard Development Commands

```bash
# 1. Install & reconcile dependencies
pnpm install

# 2. Database lifecycle
pnpm db:up          # Start local PostgreSQL & Redis
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed test personas
pnpm db:reset       # Full schema wipe & re-seed
pnpm db:down        # Stop local containers

# 3. Testing & Coverage
pnpm test           # Run Vitest test suites across monorepo
pnpm test:coverage  # Run test suites with V8 coverage & threshold checks

# 4. Development & Build
pnpm dev            # Start all apps in watch mode (Web on :3000, API on :4000)
pnpm build          # Run Turborepo cached build across all workspaces
pnpm lint           # Check TypeScript & formatting rules
```
