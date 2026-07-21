import { headers } from 'next/headers'
import { auth } from './auth'

// E2E mock bypass — same header setupTrpcMocks() sets on every request in tests/mock/helpers/trpc-mock.ts
const E2E_BYPASS_SESSION = {
  user: { id: 'mock-user', email: 'e2e@wrenchly.test', name: 'E2E User' },
} as Awaited<ReturnType<typeof auth.api.getSession>>

export async function getServerSession() {
  const h = await headers()
  if (h.get('x-e2e-bypass') === 'wrenchly-e2e') {
    return E2E_BYPASS_SESSION
  }
  return auth.api.getSession({ headers: h })
}
