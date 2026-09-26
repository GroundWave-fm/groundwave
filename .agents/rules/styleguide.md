---
trigger: always_on
description: GroundWave Coding Style Guide and formatting rules.
---

# GroundWave Coding Style Guide

## 1. TypeScript & Typing Standards
- **Strict Typing:** No `any` types. Avoid `unknown` unless necessary for type guards.
- **Shared Types:** All domain data models, API payloads, and database entities MUST be defined in `@groundwave/types`. Do not redefine types locally in apps.
- **Interfaces vs Types:** Use `type` for unions and intersections. Use `interface` for object shapes and extending.
- **Nullability:** Prefer `null` over `undefined` for database records. Use optional chaining (`?.`) safely.

## 2. Frontend / React (Next.js & Mobile)
- **Component Structure:** Use functional components. Export default for Next.js page routes (`page.tsx`, `layout.tsx`), but use named exports for shared components.
- **Styling:** Use **Tailwind CSS v4** + **Radix UI** primitives exclusively. Never use UI kit abstractions like MUI, Chakra, or Ant Design.
- **Class Names:** Use `clsx` and `tailwind-merge` (e.g., `cn()` utility) to conditionally merge class names safely.
- **State Management:** Keep state as close to where it's needed as possible. Use React Context only for global states like Auth and Audio Queues.

## 3. Backend (API & Worker)
- **Database Access:** Use raw SQL migrations and parameterized SQL queries. **Do not use heavy ORMs** (Prisma, TypeORM, Sequelize). This ensures full control over PostGIS spatial operators (`ST_DWithin`) and `pgvector` queries.
- **Error Handling:** Never swallow errors. Bubble errors to global error middleware and return standard JSON error structures (`{ error: "Description", success: false }`).
- **Media Handling:** Never buffer large files in Node.js memory. Always use Presigned S3/R2 direct-to-storage uploads.

## 4. Naming Conventions
- **Files/Folders:** `kebab-case` for file names and directories (e.g., `waitlist-form.tsx`, `audio-core`).
- **Variables/Functions:** `camelCase`.
- **Types/Classes:** `PascalCase`.
- **Environment Variables:** `UPPER_SNAKE_CASE` (e.g., `NEXT_PUBLIC_API_URL`). Add new variables to `.env.example`.

## 5. Comments & Documentation
- Document "Why" not "What". Let the code explain what it's doing; use comments to explain the business context or non-obvious workarounds.
- Add JSDoc (`/** ... */`) to exported functions and interfaces in the core libraries (`@groundwave/audio-core`, `@groundwave/types`).
