/**
 * Cross-domain proof that every item-scoped repository refactored for the
 * Friends & Item Collaboration feature actually delegates its access check
 * to `resolveItemAccess` (owner OR ACCEPTED collaborator) instead of the old
 * `{ itemId, userId }` ownership-only filter. `item-access.service.test.ts`
 * already covers `resolveItemAccess`'s own access matrix exhaustively; this
 * file proves each repository's `findByIdAndUserId`/`findByItemId` actually
 * calls into it correctly, for the three cases that matter most: the owner
 * still works (no regression), an ACCEPTED collaborator now works (new
 * behavior), and a completely unrelated user gets nothing (the
 * security-critical negative case).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ItemCollaboratorStatus } from '@prisma/client'
import { MaintenanceRepository } from '@/server/domains/maintenance/maintenance.repository'
import { TripRepository } from '@/server/domains/trip/trip.repository'
import { FuelUpRepository } from '@/server/domains/fuel-up/fuel-up.repository'
import { ReadingRepository } from '@/server/domains/reading/reading.repository'
import { PrintJobRepository } from '@/server/domains/printjob/printjob.repository'
import { HouseholdFinanceRepository } from '@/server/domains/household-finance/household-finance.repository'
import { CookingRepository } from '@/server/domains/cooking/cooking.repository'
import { FavoriteMealRepository } from '@/server/domains/favorite-meal/favorite-meal.repository'
import { ReminderRepository } from '@/server/domains/reminder/reminder.repository'
import { CustomDomainRepository } from '@/server/domains/custom-domain/custom-domain.repository'
import { ItemRepository } from '@/server/domains/item/item.repository'

const OWNER = 'owner-1'
const COLLABORATOR = 'collab-1'
const STRANGER = 'stranger-1'
const ITEM_ID = 'item-1'

function mockDb() {
  return {
    item: { findUnique: vi.fn(), findMany: vi.fn() },
    itemCollaborator: { findUnique: vi.fn(), findMany: vi.fn() },
    maintenanceRecord: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    tripLog: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    fuelUp: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    itemReading: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    printJob: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    householdTransaction: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    cookingLogEntry: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    favoriteMeal: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    reminder: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    customItemDataEntry: { findUnique: vi.fn(), findMany: vi.fn() },
  }
}

/** Wires the shared item.findUnique / itemCollaborator.findUnique mocks that
 * resolveItemAccess() calls internally, for a given requesting userId. */
function wireItemAccess(db: ReturnType<typeof mockDb>, requestingUserId: string) {
  db.item.findUnique.mockResolvedValue({ id: ITEM_ID, userId: OWNER })
  if (requestingUserId === COLLABORATOR) {
    db.itemCollaborator.findUnique.mockResolvedValue({
      itemId: ITEM_ID,
      userId: COLLABORATOR,
      status: ItemCollaboratorStatus.ACCEPTED,
    })
  } else {
    db.itemCollaborator.findUnique.mockResolvedValue(null)
  }
}

type Case = {
  name: string
  build: (db: any) => { findByIdAndUserId: (id: string, userId: string) => Promise<unknown> }
  wireRecord: (db: any) => void
}

const cases: Case[] = [
  {
    name: 'MaintenanceRepository',
    build: (db) => new MaintenanceRepository(db),
    wireRecord: (db) => db.maintenanceRecord.findUnique.mockResolvedValue({ id: 'rec-1', itemId: ITEM_ID, parts: [] }),
  },
  {
    name: 'TripRepository',
    build: (db) => new TripRepository(db),
    wireRecord: (db) => db.tripLog.findUnique.mockResolvedValue({ id: 'trip-1', itemId: ITEM_ID, expenses: [] }),
  },
  {
    name: 'FuelUpRepository',
    build: (db) => new FuelUpRepository(db),
    wireRecord: (db) => db.fuelUp.findUnique.mockResolvedValue({ id: 'fuel-1', itemId: ITEM_ID, trips: [] }),
  },
  {
    name: 'ReadingRepository',
    build: (db) => new ReadingRepository(db),
    wireRecord: (db) => db.itemReading.findUnique.mockResolvedValue({ id: 'reading-1', itemId: ITEM_ID }),
  },
  {
    name: 'PrintJobRepository',
    build: (db) => new PrintJobRepository(db),
    wireRecord: (db) => db.printJob.findUnique.mockResolvedValue({ id: 'job-1', itemId: ITEM_ID }),
  },
  {
    name: 'HouseholdFinanceRepository',
    build: (db) => new HouseholdFinanceRepository(db),
    wireRecord: (db) => db.householdTransaction.findUnique.mockResolvedValue({ id: 'tx-1', itemId: ITEM_ID }),
  },
  {
    name: 'CookingRepository',
    build: (db) => new CookingRepository(db),
    wireRecord: (db) => db.cookingLogEntry.findUnique.mockResolvedValue({ id: 'log-1', itemId: ITEM_ID }),
  },
  {
    name: 'FavoriteMealRepository',
    build: (db) => new FavoriteMealRepository(db),
    wireRecord: (db) => db.favoriteMeal.findUnique.mockResolvedValue({ id: 'meal-1', itemId: ITEM_ID }),
  },
  {
    name: 'ReminderRepository',
    build: (db) => new ReminderRepository(db),
    wireRecord: (db) => db.reminder.findUnique.mockResolvedValue({ id: 'rem-1', itemId: ITEM_ID }),
  },
]

describe.each(cases)('$name.findByIdAndUserId', ({ build, wireRecord }) => {
  let db: ReturnType<typeof mockDb>
  let repo: { findByIdAndUserId: (id: string, userId: string) => Promise<unknown> }

  beforeEach(() => {
    db = mockDb()
    wireRecord(db)
    repo = build(db)
  })

  it('grants access to the owner', async () => {
    wireItemAccess(db, OWNER)
    const result = await repo.findByIdAndUserId('rec-1', OWNER)
    expect(result).not.toBeNull()
  })

  it('grants access to an ACCEPTED collaborator', async () => {
    wireItemAccess(db, COLLABORATOR)
    const result = await repo.findByIdAndUserId('rec-1', COLLABORATOR)
    expect(result).not.toBeNull()
  })

  it('denies access to an unrelated user', async () => {
    wireItemAccess(db, STRANGER)
    const result = await repo.findByIdAndUserId('rec-1', STRANGER)
    expect(result).toBeNull()
  })
})

describe('CustomDomainRepository.findEntryByIdAndUserId', () => {
  let db: ReturnType<typeof mockDb>
  let repo: CustomDomainRepository

  beforeEach(() => {
    db = mockDb()
    db.customItemDataEntry.findUnique.mockResolvedValue({ id: 'entry-1', itemId: ITEM_ID, values: [] })
    repo = new CustomDomainRepository(db as any)
  })

  it('grants access to the owner', async () => {
    wireItemAccess(db, OWNER)
    expect(await repo.findEntryByIdAndUserId('entry-1', OWNER)).not.toBeNull()
  })

  it('grants access to an ACCEPTED collaborator', async () => {
    wireItemAccess(db, COLLABORATOR)
    expect(await repo.findEntryByIdAndUserId('entry-1', COLLABORATOR)).not.toBeNull()
  })

  it('denies access to an unrelated user', async () => {
    wireItemAccess(db, STRANGER)
    expect(await repo.findEntryByIdAndUserId('entry-1', STRANGER)).toBeNull()
  })
})

// wrenchly#22: create() must gate on resolveItemAccess just like the read paths above — a
// caller who knows/guesses another user's itemId must not be able to insert a child record
// against it (IDOR).
type CreateCase = {
  name: string
  build: (db: any) => { create: (data: any) => Promise<unknown> }
  data: (userId: string) => Record<string, unknown>
}

const createCases: CreateCase[] = [
  {
    name: 'MaintenanceRepository',
    build: (db) => new MaintenanceRepository(db),
    data: (userId) => ({ userId, itemId: ITEM_ID, title: 'Oil change', category: 'OIL', performedAt: new Date() }),
  },
  {
    name: 'TripRepository',
    build: (db) => new TripRepository(db),
    data: (userId) => ({
      userId,
      itemId: ITEM_ID,
      startedAt: new Date(),
      startOdometer: 0,
      distanceKm: 10,
      endOdometer: 10,
      totalExpenseCost: 0,
    }),
  },
  {
    name: 'FuelUpRepository',
    build: (db) => new FuelUpRepository(db),
    data: (userId) => ({
      userId,
      itemId: ITEM_ID,
      occurredAt: new Date(),
      quantity: 10,
      unit: 'L',
      isFullTank: true,
      pricePerUnit: 1,
      totalPaid: 10,
      currency: 'EUR',
    }),
  },
  {
    name: 'ReadingRepository',
    build: (db) => new ReadingRepository(db),
    data: (userId) => ({ userId, itemId: ITEM_ID, recordedAt: new Date(), metrics: {} }),
  },
  {
    name: 'PrintJobRepository',
    build: (db) => new PrintJobRepository(db),
    data: (userId) => ({ userId, itemId: ITEM_ID, startedAt: new Date(), filamentGrams: 10, materialType: 'PLA', success: true }),
  },
  {
    name: 'HouseholdFinanceRepository',
    build: (db) => new HouseholdFinanceRepository(db),
    data: (userId) => ({
      userId,
      itemId: ITEM_ID,
      type: 'EXPENSE',
      amount: 10,
      currency: 'EUR',
      category: null,
      paidByUserId: userId,
      store: null,
      description: null,
      occurredAt: new Date(),
    }),
  },
  {
    name: 'CookingRepository',
    build: (db) => new CookingRepository(db),
    data: (userId) => ({
      userId,
      itemId: ITEM_ID,
      name: 'Dinner',
      ingredients: null,
      servings: null,
      daysCovered: null,
      cost: null,
      currency: 'EUR',
      linkedTransactionId: null,
      cookedAt: new Date(),
    }),
  },
  {
    name: 'FavoriteMealRepository',
    build: (db) => new FavoriteMealRepository(db),
    data: (userId) => ({ userId, itemId: ITEM_ID, name: 'Pasta', notes: null }),
  },
  {
    name: 'ReminderRepository',
    build: (db) => new ReminderRepository(db),
    data: (userId) => ({ userId, itemId: ITEM_ID, title: 'Check oil', triggerType: 'DATE', triggerConfig: {} }),
  },
]

describe.each(createCases)('$name.create', ({ build, data }) => {
  let db: ReturnType<typeof mockDb>
  let repo: { create: (data: any) => Promise<unknown> }

  beforeEach(() => {
    db = mockDb()
    repo = build(db)
  })

  it('allows the owner to create a record', async () => {
    wireItemAccess(db, OWNER)
    await expect(repo.create(data(OWNER))).resolves.toBeDefined()
  })

  it('allows an ACCEPTED collaborator to create a record', async () => {
    wireItemAccess(db, COLLABORATOR)
    await expect(repo.create(data(COLLABORATOR))).resolves.toBeDefined()
  })

  it('rejects an unrelated user with FORBIDDEN (IDOR)', async () => {
    wireItemAccess(db, STRANGER)
    await expect(repo.create(data(STRANGER))).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('ItemRepository.findAllByUserId', () => {
  it('includes items owned by the user AND items they collaborate on (ACCEPTED only)', async () => {
    const db = mockDb()
    db.item.findMany
      .mockResolvedValueOnce([{ id: 'owned-1' }]) // owned lookup inside getAccessibleItemIds
      .mockResolvedValueOnce([{ id: 'owned-1' }, { id: 'shared-1' }]) // the final findMany by id-in
    db.itemCollaborator.findMany.mockResolvedValue([{ itemId: 'shared-1' }])
    const repo = new ItemRepository(db as any)

    const result = await repo.findAllByUserId(OWNER)

    expect(db.item.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: ['owned-1', 'shared-1'] } }) })
    )
    expect(result).toEqual([{ id: 'owned-1' }, { id: 'shared-1' }])
  })

  it('returns an empty list without querying further when the user has no accessible items', async () => {
    const db = mockDb()
    db.item.findMany.mockResolvedValueOnce([]) // owned lookup
    db.itemCollaborator.findMany.mockResolvedValue([])
    const repo = new ItemRepository(db as any)

    const result = await repo.findAllByUserId(STRANGER)

    expect(result).toEqual([])
    expect(db.item.findMany).toHaveBeenCalledTimes(1) // never got to the id-in query
  })
})
