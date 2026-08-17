# Wrenchly — orientation for AI coding agents

Cross-domain maintenance tracker, live at [wrenchly.ujjweb.hu](https://wrenchly.ujjweb.hu).
Self-hosted Docker/Postgres/Better Auth stack — see `README.md` for the full feature list and
`wrenchly-architecture.md` / `wrenchly-schema.md` for the deeper design docs. Communication for
this project is in Hungarian unless the user switches language first.

## Dev / deploy

- **Version control**: commit small and often — one logical change per commit, not batched-up
  dumps. Every change goes through a branch + PR (`gh pr create`) before merging to `main`, even
  a trivial one-line fix — no direct pushes to `main`. This is the safety net in place of a
  merge-gating CI check and keeps `main` always deployable.
- **Live database changes require explicit human authorization — no exceptions, no workarounds.**
  `wrenchly-db` is a real production database with real user data (Norbert's own account among
  them). Any command that mutates its schema or data — `prisma migrate dev`/`deploy`, `prisma db
  push`, raw `psql`/SQL against the live container, anything beyond a read-only query — needs the
  human to explicitly say go **for that specific change**, not a standing blanket approval. If a
  permission/safety classifier blocks a DB-mutating command, **stop and ask — do not look for a
  different tool or command that achieves the same mutation through another path.** This happened
  once (2026-08-12, an AI-OS-driven fork routed around a blocked `prisma migrate dev` via `prisma
  migrate diff --script` + a hand-assembled migration + `prisma migrate deploy`) — the resulting
  migration turned out to be safe on inspection, but bypassing the block was wrong regardless of
  outcome, and must not happen again. When delegating DB-touching work to a subagent/fork, state
  this rule to it explicitly and verbatim; don't assume it's inherited from this file.
- `pnpm typecheck` / `pnpm test:unit` / `pnpm test:e2e:mock` from `apps/web` — run typecheck +
  unit tests before considering any change done.
- **Host `pnpm` does not run under this box's installed Node 20** (only `npm`/`node` do) — for
  anything that needs `pnpm` on the host (installing a new dependency, generating a Prisma
  migration against the live `wrenchly-db` container, which has no host-exposed port), run it
  inside a throwaway `node:22-slim` container with the repo bind-mounted and joined to the
  compose network, matching the Dockerfile's own builder base image. Don't fight this locally —
  it's a known, worked-around quirk, not a bug to fix.
- Deploy is `docker compose build wrenchly && docker compose up -d wrenchly` from the repo root;
  a schema change additionally needs `docker compose run --rm migrate` (or the same `prisma
  migrate deploy` invocation) against the live DB before the app container picks it up.
- Test data (accounts, seeded records) created while verifying a change should be left in place,
  not cleaned up — note what/where in project memory so it can be reused next time instead of
  creating a fresh throwaway every session.
- **Bulk data entry** (seeding a lot of related records — a demo item, a real user's historical
  data reconstructed from a spreadsheet, etc.): write a disposable `apps/web/scripts/seed-*.ts`
  that imports and calls the real repository/service classes directly (not raw SQL), run it once
  via the throwaway `node:22-slim`-on-the-compose-network technique above, then delete it — never
  commit it. Going through the real service layer means ids, denormalized totals, and side
  effects (e.g. the trip domain's odometer sync) all happen exactly as they would from the app
  itself, not a hand-rolled approximation.
- **Any file written into this bind-mounted repo by an ad-hoc `docker run` container is root-owned
  on the host** (the container runs as root by default even though the bind mount looks like it
  should inherit host ownership) — a generated migration file, a script output, anything. This
  silently blocks `git checkout`/`git pull`/`git mv` with permission-denied unlink errors later.
  Fix before it bites you: `docker run --rm -v <dir>:/mnt node:22-slim chown -R 1000:1000 /mnt`.
## Friends & Item Collaboration (2026-08-12, PR #23, not yet merged as of writing)

Real multi-user accounts + a friend graph, replacing the old single-owner-only
model. `FriendRequest` (send/accept/decline/remove, gated on `User.username`
search) + `ItemCollaborator` (invite an accepted friend onto a specific
`Item`; full/equal edit rights once accepted, not role-based). The
authorization gate is centralized in
`apps/web/src/server/domains/item/item-access.service.ts`
(`resolveItemAccess`/`getAccessibleItemIds`) — every item-scoped repository's
child-record queries route through it instead of a raw `{itemId, userId}`
filter, so a collaborator's access is checked against the item, not against
who created a given record (that column is now attribution, not access
control). `HouseholdTransaction.paidBy` (a hardcoded free-text dropdown) is
being replaced by `paidByUserId`, a real user reference (owner or
collaborator) — `paidBy` stays as a legacy display fallback only.

New/changed surface: `/friends` page, `/items/[id]/collaborators` tab,
`friend`/`itemCollaborator` tRPC routers. Known gaps as of PR #23: no
Settings UI to set/change your own `username` yet (DB-only), no
`create()`-path access check yet in the item-scoped domains (tracked as
[wrenchly#22](https://github.com/badzso-boop/wrenchly/issues/22), pre-existing
and unrelated to this feature specifically). See `~/wrenchly-friends-and-item-collaboration-prompt.md`
for the full original spec if extending this further.

- **Mobile viewport check before calling any nav/tab change done.** `ItemDetailClient`'s per-item
  tab strip (`/items/[id]`) has no width limit of its own — it silently overflowed on a ~375px
  phone screen once a 4th/5th tab was added (fixed with `overflow-x-auto` + `shrink-0` on the tab
  links, but that only became obvious testing on an actual narrow viewport, not from `tsc`/vitest,
  which caught nothing). Before adding another tab there, or touching any other unconstrained
  `flex` row of dynamically-many items, check it on a ~375px-wide viewport (a quick Playwright
  script with `chromium.launch()` + `viewport: {width:375,height:667}` against the live site,
  checking `document.documentElement.scrollWidth` vs `clientWidth`, works fine here even without
  Claude in Chrome connected).

- **Every `Select` whose `value` isn't itself the display text needs an explicit `children` render
  function on `SelectValue`, or the closed trigger shows the raw value (a UUID/id) instead of a
  label.** This repo's `Select` (`components/ui/select.tsx`) wraps **Base UI**, not Radix — Base
  UI's `Select.Value` does NOT auto-derive a label from the matching `SelectItem`'s children the
  way Radix does; without an explicit render prop it just stringifies whatever `value` currently
  is. Fixing only the `SelectItem` list (the open-dropdown rendering) is not enough — the
  `SelectValue` (the closed-trigger rendering) is a **separate** piece of JSX that needs its own
  fix, easy to miss (this exact half-fixed state is what happened in `NewItemClient.tsx`'s
  CustomDomain picker: the `SelectItem`s were fixed once already, `SelectValue` wasn't, so the bug
  came back). This has now bitten the friend picker, the cooking linked-expense picker, the paidBy
  picker (×2), the statistics field picker (`ChartBuilder.tsx`), and the CustomDomain item-creation
  picker (`NewItemClient.tsx`) — all fixed the same way. Currency/category/type-enum pickers are
  fine as-is only because their value already equals its own label (e.g. `"VEHICLE"`), so don't
  "fix" those just for consistency.

  Established pattern to copy (see `AddHouseholdTransactionForm.tsx`'s paidBy picker or
  `AddCookingLogEntryForm.tsx`'s linked-expense picker for the full version with an empty-value
  sentinel):
  ```tsx
  <SelectValue placeholder="Select…">
    {(v: string) => optionsArray.find((o) => o.id === v)?.name ?? 'Select…'}
  </SelectValue>
  ```
  Whenever adding a **new** `Select` in this codebase where `value` is an id/UUID (not the label
  itself), write this render function from the start — don't wait for someone to notice the bug in
  production.
