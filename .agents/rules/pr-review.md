---
trigger: model_decision
description: Guidelines and checklist for reviewing Pull Requests (PRs) in the GroundWave repository.
---

# Pull Request (PR) Review Guidelines

When reviewing PRs or generating PR feedback, follow these stringent guidelines to ensure high code quality, security, and architectural compliance.

## 1. Zero-Compromise Coverage Gate
Always check the PR description and actual coverage output. **Do not approve PRs that drop coverage below thresholds:**
- `@groundwave/audio-core`, `@groundwave/database`: **85%**
- `apps/api`, `apps/media-worker`: **80%**
- `apps/web`, `apps/mobile`: **70%**

Ensure that UI/route folders (e.g., `src/app/**`) are NOT being excluded from vitest configurations to game the metrics.

## 2. Architecture & Design Enforcement
- **Tech Menu Violations:** Instantly reject PRs introducing forbidden technologies (ORMs, MUI/Chakra, memory storage for files).
- **Domain Boundaries:** Cross-boundary API or DB interactions MUST be typed from `@groundwave/types`. Reject PRs defining temporary `interface` structures for global concepts within local packages.
- **Dependency Violations:** Reject PRs where `packages/*` import from `apps/*`.

## 3. Database Safety
- Look closely at migration scripts (`apps/database/migrations`).
- Are migrations backward-compatible?
- Has `pg_stat_statements` or indexes been considered for large table queries?
- If PostGIS or `pgvector` features are introduced, verify raw SQL implementation over an ORM abstraction.

## 4. Constructive Feedback Structure
When commenting on a PR:
1. **Praise:** Start with what works well (if applicable).
2. **Critique:** Reference explicit rules from `GEMINI.md` or `.agents/rules/styleguide.md` when requesting changes.
3. **Provide Solutions:** Offer the exact code snippet required to fix the issue instead of just pointing it out.

## 5. Security Check
- Ensure no credentials, secrets, or internal URLs are hardcoded.
- Ensure all environment variables are correctly proxied and updated in `.env.example`.
- Ensure new API routes have appropriate authorization middleware (`requireAuth`).

## 6. Strict Manual Merge Policy (No Auto-Merging)
- **NEVER execute `gh pr merge` or automatically merge PRs.**
- The AI agent's role during PR review is strictly to audit, test, review comments, and (if requested) push fixes to the PR's feature branch.
- Merge control belongs strictly and exclusively to the user. Do not execute `gh pr merge` unless the user explicitly commands: "merge PR #<number>".

