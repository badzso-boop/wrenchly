import { db } from '@/server/db'

let counter = 0

export function uniqueEmail(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}@integration.test`
}

export async function createTestUser(overrides: Partial<{ email: string; name: string }> = {}) {
  return db.user.create({
    data: {
      email: overrides.email ?? uniqueEmail('user'),
      name: overrides.name ?? 'Integration Test User',
    },
  })
}

export async function deleteTestUser(userId: string) {
  // The user (and anything still hanging off it) may already be gone if the
  // test itself deleted it — e.g. a cascade-delete assertion. That's fine.
  await db.user.delete({ where: { id: userId } }).catch(() => {})
}
