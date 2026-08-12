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
- **E2E Testing**: E2E tests are configured via Playwright (`pnpm --filter @wrenchly/web test:e2e:mock`). The sandbox's `.ai-os/sandbox.json` `"image"` is pinned to `mcr.microsoft.com/playwright:v<version>-noble`, matching `@playwright/test`'s exact resolved version in `apps/web/package.json`/`pnpm-lock.yaml` — the browsers are baked into that image (no network needed at test time). **If you bump `@playwright/test`, bump the `sandbox.json` image tag to the same version in the same change**, otherwise `test:e2e:mock` fails inside the sandbox with a browser-version mismatch or a missing-executable error.
