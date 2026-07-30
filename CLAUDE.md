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
- **Mobile viewport check before calling any nav/tab change done.** `ItemDetailClient`'s per-item
  tab strip (`/items/[id]`) has no width limit of its own — it silently overflowed on a ~375px
  phone screen once a 4th/5th tab was added (fixed with `overflow-x-auto` + `shrink-0` on the tab
  links, but that only became obvious testing on an actual narrow viewport, not from `tsc`/vitest,
  which caught nothing). Before adding another tab there, or touching any other unconstrained
  `flex` row of dynamically-many items, check it on a ~375px-wide viewport (a quick Playwright
  script with `chromium.launch()` + `viewport: {width:375,height:667}` against the live site,
  checking `document.documentElement.scrollWidth` vs `clientWidth`, works fine here even without
  Claude in Chrome connected).
