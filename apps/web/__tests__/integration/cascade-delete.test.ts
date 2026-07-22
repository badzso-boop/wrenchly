import { describe, it, expect, afterAll } from 'vitest'
import { db } from '@/server/db'
import { ItemType } from '@prisma/client'
import { createTestUser } from './helpers/db'

// The `onDelete: Cascade` relations in prisma/schema.prisma are a database-level
// guarantee — mocked-repository unit tests can't catch a missing or wrong
// cascade rule, only a real database enforcing real foreign keys can.
describe('Cascade deletes (real database)', () => {
  afterAll(async () => {
    await db.$disconnect()
  })

  it('deleting a user cascades to their items and maintenance records', async () => {
    const user = await createTestUser()
    const item = await db.item.create({
      data: { userId: user.id, name: 'Lawn mower', type: ItemType.TOOL },
    })
    const record = await db.maintenanceRecord.create({
      data: {
        itemId: item.id,
        userId: user.id,
        performedAt: new Date(),
        title: 'Oil change',
        category: 'engine',
      },
    })

    await db.user.delete({ where: { id: user.id } })

    expect(await db.item.findUnique({ where: { id: item.id } })).toBeNull()
    expect(await db.maintenanceRecord.findUnique({ where: { id: record.id } })).toBeNull()
  })

  it('deleting an item cascades to its maintenance records but leaves the user intact', async () => {
    const user = await createTestUser()
    const item = await db.item.create({
      data: { userId: user.id, name: 'Water heater', type: ItemType.PROPERTY },
    })
    const record = await db.maintenanceRecord.create({
      data: {
        itemId: item.id,
        userId: user.id,
        performedAt: new Date(),
        title: 'Descale',
        category: 'plumbing',
      },
    })

    await db.item.delete({ where: { id: item.id } })

    expect(await db.maintenanceRecord.findUnique({ where: { id: record.id } })).toBeNull()
    expect(await db.user.findUnique({ where: { id: user.id } })).not.toBeNull()

    await db.user.delete({ where: { id: user.id } })
  })

  it('enforces the unique constraint on user email', async () => {
    const user = await createTestUser()

    await expect(
      db.user.create({ data: { email: user.email, name: 'Duplicate' } })
    ).rejects.toThrow()

    await db.user.delete({ where: { id: user.id } })
  })
})
