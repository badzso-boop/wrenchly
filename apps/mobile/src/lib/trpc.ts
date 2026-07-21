import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@wrenchly/web/src/server/router'
import { getStoredToken } from './auth'

export const api = createTRPCReact<AppRouter>()

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function createTRPCClient() {
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
