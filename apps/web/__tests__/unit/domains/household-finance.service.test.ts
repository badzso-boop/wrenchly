import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HouseholdFinanceService } from '@/server/domains/household-finance/household-finance.service'

vi.mock('@/server/domains/item/item-access.service', () => ({
  resolveItemAccess: vi.fn().mockResolvedValue({ item: { userId: 'user-1' }, role: 'owner' }),
}))

const mockRepo = {
  findByIdAndUserId: vi.fn(),
  listByItemId: vi.fn(),
  findAllByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
}

const mockDb = {} as any

const service = new HouseholdFinanceService(mockDb, mockRepo as any, mockItemRepo as any)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('HouseholdFinanceService.create', () => {
  const baseInput = {
    itemId: 'item-1',
    type: 'EXPENSE' as const,
    amount: 5000,
    paidByUserId: 'user-1',
    occurredAt: new Date('2026-07-01'),
  }

  it('throws NOT_FOUND when the item does not belong to the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.create('user-1', baseInput)).rejects.toThrow('errors.item.not_found')
  })

  it('throws BAD_REQUEST when the item is not type HOME', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    await expect(service.create('user-1', baseInput)).rejects.toThrow('errors.household_finance.not_home_item')
  })

  it('accepts a valid EXPENSE category', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.create.mockResolvedValue({ id: 'tx-1' })
    await service.create('user-1', { ...baseInput, category: 'GROCERY' })
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ category: 'GROCERY' }))
  })

  it('rejects an invalid EXPENSE category', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    await expect(service.create('user-1', { ...baseInput, category: 'SALARY' })).rejects.toThrow(
      'errors.household_finance.invalid_category'
    )
  })

  it('accepts a valid INCOME category', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.create.mockResolvedValue({ id: 'tx-1' })
    await service.create('user-1', { ...baseInput, type: 'INCOME', category: 'SALARY' })
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ category: 'SALARY' }))
  })

  it('rejects an invalid INCOME category', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    await expect(
      service.create('user-1', { ...baseInput, type: 'INCOME', category: 'GROCERY' })
    ).rejects.toThrow('errors.household_finance.invalid_category')
  })

  it('allows an omitted category', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.create.mockResolvedValue({ id: 'tx-1' })
    await expect(service.create('user-1', baseInput)).resolves.toEqual({ id: 'tx-1' })
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ category: null }))
  })

  it('defaults currency to HUF when omitted', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.create.mockResolvedValue({ id: 'tx-1' })
    await service.create('user-1', baseInput)
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ currency: 'HUF' }))
  })
})

describe('HouseholdFinanceService.update/delete', () => {
  it('update throws NOT_FOUND when the transaction does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.update('tx-1', 'user-1', { amount: 100 })).rejects.toThrow(
      'errors.household_finance.not_found'
    )
  })

  it('update rejects an invalid category for the existing type', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'tx-1', type: 'EXPENSE', category: 'GROCERY' })
    await expect(service.update('tx-1', 'user-1', { category: 'SALARY' })).rejects.toThrow(
      'errors.household_finance.invalid_category'
    )
  })

  it('update validates against the new type when type itself is being changed', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'tx-1', type: 'EXPENSE', category: 'GROCERY' })
    mockRepo.update.mockResolvedValue({ id: 'tx-1' })
    await expect(
      service.update('tx-1', 'user-1', { type: 'INCOME', category: 'SALARY' })
    ).resolves.toEqual({ id: 'tx-1' })
  })

  it('delete throws NOT_FOUND when the transaction does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.delete('tx-1', 'user-1')).rejects.toThrow('errors.household_finance.not_found')
  })

  it('delete removes an owned transaction', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'tx-1' })
    mockRepo.delete.mockResolvedValue(undefined)
    await service.delete('tx-1', 'user-1')
    expect(mockRepo.delete).toHaveBeenCalledWith('tx-1')
  })
})

describe('HouseholdFinanceService.getStatistics', () => {
  it('throws NOT_FOUND when the item does not belong to the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.getStatistics('item-1', 'user-1')).rejects.toThrow('errors.item.not_found')
  })

  it('buckets monthly expense/income and computes monthly balance', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 1000, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date('2026-06-05') },
      { type: 'INCOME', amount: 3000, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date('2026-06-10') },
      { type: 'EXPENSE', amount: 500, currency: 'HUF', category: 'UTILITIES', paidBy: 'Dori', occurredAt: new Date('2026-07-01') },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.monthly).toEqual([
      { month: '2026-06', expense: 1000, income: 3000, balance: 2000 },
      { month: '2026-07', expense: 500, income: 0, balance: -500 },
    ])
  })

  it('splits all-time totals by direction', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 1000, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'EXPENSE', amount: 200, currency: 'HUF', category: 'OTHER', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'INCOME', amount: 5000, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.allTime).toEqual({ expense: 1200, income: 5000 })
  })

  it('excludes transactions older than 30 days from the last30Days bucket', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    const recent = new Date()
    const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 100, currency: 'HUF', category: 'OTHER', paidBy: 'Norbi', occurredAt: recent },
      { type: 'EXPENSE', amount: 900, currency: 'HUF', category: 'OTHER', paidBy: 'Norbi', occurredAt: old },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.allTime.expense).toBe(1000)
    expect(stats.last30Days.expense).toBe(100)
  })

  it('breaks down expense and income by category separately', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 300, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'EXPENSE', amount: 200, currency: 'HUF', category: 'GROCERY', paidBy: 'Dori', occurredAt: new Date() },
      { type: 'INCOME', amount: 4000, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.expenseByCategory).toEqual([{ category: 'GROCERY', amount: 500 }])
    expect(stats.incomeByCategory).toEqual([{ category: 'SALARY', amount: 4000 }])
  })

  it('computes net balance per person: all-expense person is negative', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 700, currency: 'HUF', category: 'GROCERY', paidBy: 'Dori', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.netBalanceByPerson).toEqual([{ paidBy: 'Dori', net: -700 }])
  })

  it('computes net balance per person: all-income person is positive', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'INCOME', amount: 2000, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.netBalanceByPerson).toEqual([{ paidBy: 'Norbi', net: 2000 }])
  })

  it('computes net balance per person: mixed contributions net out correctly for two people', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'INCOME', amount: 3000, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'EXPENSE', amount: 1000, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'INCOME', amount: 2000, currency: 'HUF', category: 'SALARY', paidBy: 'Dori', occurredAt: new Date() },
      { type: 'EXPENSE', amount: 2500, currency: 'HUF', category: 'UTILITIES', paidBy: 'Dori', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.netBalanceByPerson.sort((a, b) => a.paidBy.localeCompare(b.paidBy))).toEqual([
      { paidBy: 'Dori', net: -500 },
      { paidBy: 'Norbi', net: 2000 },
    ])
  })

  it('paidBy breakdown is tracked separately for expense and income', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 400, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'INCOME', amount: 4000, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.expenseByPaidBy).toEqual([{ paidBy: 'Norbi', amount: 400 }])
    expect(stats.incomeByPaidBy).toEqual([{ paidBy: 'Norbi', amount: 4000 }])
  })

  it('returns an empty currencies list when there are no transactions', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies).toEqual([])
  })

  it('returns a single currency when every transaction uses it', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 100, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'INCOME', amount: 500, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies).toEqual(['HUF'])
  })

  it('dedups mixed currencies', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findAllByItemId.mockResolvedValue([
      { type: 'EXPENSE', amount: 100, currency: 'HUF', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'EXPENSE', amount: 20, currency: 'EUR', category: 'GROCERY', paidBy: 'Norbi', occurredAt: new Date() },
      { type: 'INCOME', amount: 500, currency: 'HUF', category: 'SALARY', paidBy: 'Norbi', occurredAt: new Date() },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies.sort()).toEqual(['EUR', 'HUF'])
  })
})
