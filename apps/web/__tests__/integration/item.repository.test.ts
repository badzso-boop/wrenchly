import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { db } from '@/server/db'
import { ItemRepository } from '@/server/domains/item/item.repository'
import { ItemType, ItemStatus } from '@prisma/client'
import { createTestUser, deleteTestUser } from './helpers/db'

// Unlike the mocked ItemRepository used in the unit tests, this exercises the
// real Prisma queries against a real Postgres database — the thing the unit
// suite structurally cannot verify (SQL correctness, defaults, constraints).
const repo = new ItemRepository(db)

describe('ItemRepository (real database)', () => {
  let userId: string

  beforeAll(async () => {
    const user = await createTestUser()
    userId = user.id
  })

  afterAll(async () => {
    await deleteTestUser(userId)
    await db.$disconnect()
  })

  afterEach(async () => {
    await db.item.deleteMany({ where: { userId } })
  })

  it('creates an item and persists it with the schema default status', async () => {
    const item = await repo.create({ userId, name: 'Ford Focus', type: ItemType.VEHICLE })
    expect(item.id).toBeTruthy()
    expect(item.status).toBe(ItemStatus.ACTIVE)

    const found = await repo.findById(item.id)
    expect(found?.name).toBe('Ford Focus')
  })

  it('findByIdAndUserId returns null when the item belongs to a different user', async () => {
    const item = await repo.create({ userId, name: 'Bike', type: ItemType.BICYCLE })
    const otherUser = await createTestUser()

    const found = await repo.findByIdAndUserId(item.id, otherUser.id)
    expect(found).toBeNull()

    await deleteTestUser(otherUser.id)
  })

  it('findAllByUserId filters by status', async () => {
    await repo.create({ userId, name: 'Active drill', type: ItemType.TOOL })
    const archived = await repo.create({ userId, name: 'Old mower', type: ItemType.TOOL })
    await repo.update(archived.id, { status: ItemStatus.ARCHIVED })

    const activeOnly = await repo.findAllByUserId(userId, ItemStatus.ACTIVE)
    expect(activeOnly.map((i) => i.name)).toEqual(['Active drill'])

    const all = await repo.findAllByUserId(userId)
    expect(all).toHaveLength(2)
  })

  it('update persists partial changes without touching other fields', async () => {
    const item = await repo.create({ userId, name: 'Kayak', type: ItemType.BOAT })
    const updated = await repo.update(item.id, { brand: 'Old Town', purchasePrice: 899.99 })

    expect(updated.brand).toBe('Old Town')
    expect(Number(updated.purchasePrice)).toBeCloseTo(899.99)
    expect(updated.name).toBe('Kayak')
  })

  it('delete removes the row', async () => {
    const item = await repo.create({ userId, name: 'Broken drone', type: ItemType.DRONE })
    await repo.delete(item.id)

    expect(await repo.findById(item.id)).toBeNull()
  })
})
