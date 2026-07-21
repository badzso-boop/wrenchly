FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/schema/package.json packages/schema/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/i18n/package.json packages/i18n/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
# apps/web has no public/ dir yet — keep the later COPY from failing if that stays true.
RUN mkdir -p apps/web/public
# `next build` statically executes every route module once ("collecting page data"), which runs
# top-level SDK constructors (Resend, Better Auth) and env.ts's zod validation. None of this is a
# live network call and none of it leaks into the running container — real secrets are read fresh
# from process.env when the runner container starts. These placeholders only need to satisfy the
# URL/min-length shape checks so the build can complete without real credentials.
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/db \
    DIRECT_URL=postgresql://user:pass@localhost:5432/db \
    BETTER_AUTH_SECRET=build-placeholder-must-be-32-chars-min \
    RESEND_API_KEY=re_build_placeholder \
    CRON_SECRET=build-placeholder-must-be-32-chars-min \
    NEXT_PUBLIC_APP_URL=http://localhost:3000
RUN pnpm --filter @wrenchly/web db:generate
RUN pnpm --filter @wrenchly/web build

# The runner below ships the traced Prisma *client* but not the `prisma` CLI, so it can't run
# migrations. This stage reuses the full builder (which has the CLI + schema) for that instead;
# run it with `docker compose run --rm migrate` (see docker-compose.yml). Placed BEFORE `runner`
# on purpose — the last stage in the file is Docker's default build target when no `--target`/
# `target:` is given, and `runner` (the actual app) must stay that default, not this one.
FROM builder AS migrator
WORKDIR /app/apps/web
ENTRYPOINT ["npx", "prisma"]
CMD ["migrate", "deploy"]

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
RUN mkdir -p apps/web/.next && chown nextjs:nodejs apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
