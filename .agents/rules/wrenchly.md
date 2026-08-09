---
description: Project conventions, build guidelines, and verification rules for Wrenchly
globs: ["apps/web/**", "packages/**", "prisma/**"]
---

# Wrenchly Agent Rules

1. **Safety & Git Workflow**:
   - Small, logical commits. Never push directly to `main`.
   - All changes must be delivered via a topic branch and Pull Request (`gh pr create`).

2. **Validation**:
   - Run typecheck and unit tests before completing any task:
     `pnpm --filter @wrenchly/web typecheck`
     `pnpm --filter @wrenchly/web test:unit`

3. **Prisma & DB**:
   - Run `pnpm --filter @wrenchly/web db:generate` whenever `schema.prisma` is modified.

4. **UI Viewport Check**:
   - Check dynamic tab rows and dynamic flex items on a 375px mobile viewport to ensure no horizontal layout overflow occurs (`overflow-x-auto` + `shrink-0`).
