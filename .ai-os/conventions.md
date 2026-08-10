# Wrenchly Project Conventions

This document provides project-specific rules, architectural patterns, and validation requirements for AI-OS agents working on Wrenchly.

---

## 1. Monorepo Architecture & Package Layout

- **Frontend & Backend**: Next.js App Router application located in `apps/web` (`@wrenchly/web`).
- **Shared Packages**:
  - `packages/schema`: Shared Prisma schema definitions and database client.
  - `packages/types`: Shared TypeScript interfaces and DTOs.
  - `packages/i18n`: Internationalization translations (Hungarian / English).
- **Workspace Imports**: Always import shared packages via their workspace names (`@wrenchly/schema`, `@wrenchly/types`, `@wrenchly/i18n`).

---

## 2. Database & Schema Changes

- **Prisma Schema**: Located in `apps/web/prisma/schema.prisma`.
- **Code Generation**: Whenever modifying `schema.prisma`, always run `pnpm --filter @wrenchly/web db:generate` before running typechecks or tests.
- **Service Layer Seeding**: When writing bulk seed data, create disposable scripts in `apps/web/scripts/seed-*.ts` that invoke the real service/repository classes directly (never raw SQL) so denormalized fields, IDs, and domain events remain consistent.

---

## 3. Responsive UI & Mobile Viewport Rule

- **375px Mobile Viewport Safety**: All UI tabs, flex rows, and navigation strips must be tested on narrow viewports (~375px width).
- **Tab Strip Protection**: Use `overflow-x-auto` and `shrink-0` on dynamic tab links (e.g., `ItemDetailClient` per-item tab strip) to prevent horizontal layout overflow on mobile screens.

---

## 4. Verification & Testing Standards

- **Pre-commit Validation**: Every change must pass both typechecking and unit tests:
  ```bash
  pnpm --filter @wrenchly/web typecheck
  pnpm --filter @wrenchly/web test:unit
  ```
- **E2E Testing**: E2E tests are configured via Playwright (`pnpm --filter @wrenchly/web test:e2e:mock`).

---

## 5. AI Agent Testing & Git Execution Rules

- **Unit Testing Framework**: Use `vitest` with native node/element structure checks or standard exported prop unit testing for React components under `apps/web/__tests__/unit/`.
- **Do Not Generate Unused JSDOM / React Testing Library Tests**: Do NOT generate unit tests importing `@testing-library/react` or `@testing-library/jest-dom` unless JSDOM setup and matchers are configured in `vitest.config.ts`.
- **Root Page Auth Redirect Convention**: When modifying root route files (`apps/web/src/app/page.tsx`), always preserve the authentication/session redirect check via `getServerSession()`. Authenticated requests must redirect to `/dashboard` so E2E navigation tests remain unbroken, while unauthenticated users see the marketing landing page.
- **Strict Verification Before Staging**: Standard tasks must run typecheck and unit tests (`pnpm --filter @wrenchly/web typecheck && pnpm --filter @wrenchly/web test:unit`). For **HIGH** and **CRITICAL** risk tasks (e.g. routing, layout shells, navigation, global auth), the agent MUST also run `pnpm --filter @wrenchly/web test:e2e:mock` in its terminal execution loop to verify Playwright E2E mock navigation and layout flows before marking the task complete.
- **Git Staging Cleanliness**: Never leave dirty / unstaged modified files in the working directory before running `git merge --ff-only` or completing task staging.



