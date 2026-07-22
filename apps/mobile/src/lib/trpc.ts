import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query'
import { httpBatchLink, type TRPCClient } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@wrenchly/web/src/server/router'
import { getStoredToken } from './auth'

// Explicit annotations here (rather than letting TS infer `api`'s and
// `createTRPCClient`'s return types) sidestep TS2742: inference would need to
// print a type that names `next/server`, which this package can't resolve
// (the web app's tRPC context uses NextRequest, but mobile has no `next`
// dependency of its own — nor should it, for a type-only import).
export const api: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function createTRPCClient(): TRPCClient<AppRouter> {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = await getStoredToken()
          return token ? { Authorization: `Bearer ${token}` } : {}
        },
      }),
    ],
  })
}
