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
