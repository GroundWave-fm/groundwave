# Groundwave Development & Agent Collaboration Guidelines (`GEMINI.md`)

> **Single Source of Truth** for human lead developers and AI coding agents contributing to **Groundwave (`groundwave.fm`)**.

---

## 1. Core Engineering Principles

1. **Feature Atomization**: Every task, feature, or bug fix MUST be broken down into small, self-contained, reviewable units. Never bundle unrelated changes across apps/packages into a single PR.
2. **End-to-End Type Safety**: All domain data models, API payloads, and database entities MUST be defined in `@groundwave/types` before implementation. No `any` types or loose untyped JSON objects.
3. **Monorepo Dependency Integrity**:
   * Applications (`apps/*`) depend on shared packages (`packages/*`).
   * Packages MUST NEVER import from `apps/*` or create circular dependencies.
   * Business and domain logic shared across Web and Mobile belongs in `packages/*`.
4. **Zero-Breaking-Change Database Migrations**: All schema updates must be backward-compatible and tested via `pnpm db:migrate` and `pnpm db:seed`.
5. **Mandatory Test Coverage**: All critical modules, APIs, and algorithmic utilities must meet or exceed tiered test coverage thresholds before merge.
6. **No Secret Leaks**: Never hardcode API keys, Stripe secrets, or credentials. Always update `.env.example` when introducing new environment variables.

---

## 2. Test Coverage & Quality Engineering Standards

Groundwave enforces a **zero-compromise test coverage gate** using **Vitest** and `@vitest/coverage-v8`.

### 2.1 Tiered Coverage Thresholds

| Layer / Package | Scope & Responsibility | Min Lines | Min Branches | Min Functions | Min Statements |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Tier 1: Core Domain Packages**<br>`@groundwave/audio-core`<br>`@groundwave/database` (geo/helpers) | Playback state machine, queue mutations, H3 spatial calculations, royalty math | **85%** | **80%** | **85%** | **85%** |
| **Tier 2: Backend Services**<br>`apps/api`<br>`apps/media-worker` | Auth/RBAC middleware, presigned media ingestion, routes, FFmpeg transcode pipeline | **80%** | **75%** | **80%** | **80%** |
| **Tier 3: Frontend Client Apps**<br>`apps/web`<br>`apps/mobile` | Player dock hooks (`useAudioEngine`), release upload forms, localized scene radio UI | **70%** | **65%** | **70%** | **70%** |

### 2.2 Test Types & Co-Location
* **Unit Tests (`*.test.ts`)**: Co-located next to implementation code (e.g. `packages/audio-core/src/index.test.ts`). Pure, deterministic, < 10ms execution.
* **API Integration Tests (`*.test.ts`)**: Supertest integration tests validating status codes, validation errors, and DB operations against live/test databases.
* **Continuous Testing**: Always run `pnpm test:coverage` locally before committing or opening a PR.

---

## 3. Git & Branching Strategy

Groundwave follows **Trunk-Based Development with Short-Lived Feature Branches**:

```
main (production-ready)
  ├── feat/GW-201-presigned-audio-upload  ──► PR ──► Merge to main
  ├── feat/GW-301-persistent-audio-dock   ──► PR ──► Merge to main
  └── fix/GW-101-curator-schema-typo      ──► PR ──► Merge to main
```

### 3.1 Branch Naming Conventions
* `feat/GW-<issue-number>-<short-description>` (e.g. `feat/GW-201-audio-ingestion`)
* `fix/GW-<issue-number>-<short-description>` (e.g. `fix/GW-101-schema-reset`)
* `chore/<short-description>` (e.g. `chore/upgrade-turborepo`)
* `docs/<short-description>` (e.g. `docs/api-specification`)

### 3.2 Conventional Commit Standard
All commit messages must strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short imperative summary> (fixes #<issue-number>)

[optional body explaining non-obvious rationale]
```

* **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
* **Scopes**: `web`, `api`, `media-worker`, `mobile`, `database`, `types`, `audio-core`, `config`.
* **Examples**:
  * `feat(api): implement JWT login and entity membership RBAC (fixes #2)`
  * `test(audio-core): add queue transition and coverage thresholds (fixes #11)`
  * `fix(database): add missing curator_profiles table to init.sql (fixes #1)`

---

## 4. Pull Request (PR) & Review Process

Every PR must be linked to an active issue in the **GroundWave-fm/GroundWave** repository.

### 4.1 Pre-PR Checklist (The Quality Gate)
Before opening a PR, the agent and developer MUST verify that:
- [ ] `pnpm build` passes with zero TypeScript or compilation errors across all packages.
- [ ] `pnpm lint` passes with zero linting warnings.
- [ ] `pnpm test:coverage` passes and meets all package coverage thresholds.
- [ ] Database migrations (`pnpm db:migrate`) and seed scripts (`pnpm db:seed`) run cleanly.
- [ ] Automated tests or manual verification logs are documented in the PR body.

### 4.2 PR Description Template
All Pull Requests must use the following standard format:

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

## 5. Agent Guidelines & Collaboration Rules

When an AI Agent is acting as a lead developer on a task:

1. **Read Before Writing**: Always inspect the relevant `packages/types/src/index.ts`, `docs/ARCHITECTURE_SPEC.md`, and existing routes before generating code.
2. **Execute Locally & Verify**: Never claim a task is complete without running `pnpm build`, `pnpm test:coverage`, or testing the execution output.
3. **Respect the Entity Model**:
   * Human authentication belongs in `users`.
   * Bands, Solo Acts, Record Labels, Curators, and Venues are `creator_entities`.
   * Permissions and band member shares are stored in `entity_memberships`.
4. **Issue Traceability**: Always include `(fixes #<number>)` in commit messages so GitHub automatically tracks and closes completed issues.

---

## 6. Standard Development Commands

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
