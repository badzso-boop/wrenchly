import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MaintenanceService } from '@/server/domains/maintenance/maintenance.service'
import { TRPCError } from '@trpc/server'

const mockMaintenanceRepo = {
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  sumCostByItemId: vi.fn(),
  countByCategoryPerMonth: vi.fn(),
}

const service = new MaintenanceService(mockMaintenanceRepo as any)

beforeEach(() => vi.clearAllMocks())

describe('MaintenanceService.create', () => {
  it('calculates costTotal from parts', async () => {
    const input = {
      itemId: 'item-1',
      title: 'Oil change',
      category: 'oil_change',
      performedAt: new Date(),
      parts: [
        { name: 'Castrol 5W-40', quantity: 5, unit: 'liter', unitPrice: 4200 },
        { name: 'Oil filter', quantity: 1, unit: 'pcs', unitPrice: 2800 },
      ],
    }
    const expected = { id: 'rec-1', costTotal: 23800 }
    mockMaintenanceRepo.create.mockResolvedValue(expected)

    await service.create('user-1', input)

    expect(mockMaintenanceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ costTotal: 23800 })
    )
  })

  it('subtracts a negative unitPrice (discount) from costTotal', async () => {
    const input = {
      itemId: 'item-1',
      title: 'Oil change',
      category: 'oil_change',
      performedAt: new Date(),
      parts: [
        { name: 'Castrol 5W-40', quantity: 5, unit: 'liter', unitPrice: 4200 },
        { name: 'Loyalty discount', quantity: 1, unit: 'pcs', unitPrice: -2000 },
      ],
    }
    mockMaintenanceRepo.create.mockResolvedValue({ id: 'rec-1', costTotal: 19000 })

    await service.create('user-1', input)

    expect(mockMaintenanceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ costTotal: 19000 })
    )
  })

  it('sets costTotal to 0 when no parts', async () => {
    const input = {
      itemId: 'item-1',
      title: 'Inspection',
      category: 'inspection',
      performedAt: new Date(),
    }
    mockMaintenanceRepo.create.mockResolvedValue({ id: 'rec-1', costTotal: 0 })

    await service.create('user-1', input)

    expect(mockMaintenanceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ costTotal: 0 })
    )
  })

  it('includes totalPrice per part', async () => {
    const input = {
      itemId: 'item-1',
      title: 'Oil change',
      category: 'oil_change',
      performedAt: new Date(),
      parts: [{ name: 'Oil', quantity: 4, unit: 'liter', unitPrice: 1000 }],
    }
    mockMaintenanceRepo.create.mockResolvedValue({ id: 'rec-1' })

    await service.create('user-1', input)

    expect(mockMaintenanceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parts: [expect.objectContaining({ totalPrice: 4000 })],
      })
    )
  })
})

describe('MaintenanceService.getById', () => {
  it('returns record when found', async () => {
    const record = { id: 'rec-1', userId: 'user-1', parts: [] }
    mockMaintenanceRepo.findByIdAndUserId.mockResolvedValue(record)

    const result = await service.getById('rec-1', 'user-1')
    expect(result).toEqual(record)
  })

  it('throws NOT_FOUND when not found', async () => {
    mockMaintenanceRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getById('rec-1', 'user-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.maintenance.not_found',
    })
  })
})

describe('MaintenanceService.delete', () => {
  it('deletes record when user owns it', async () => {
    mockMaintenanceRepo.findByIdAndUserId.mockResolvedValue({ id: 'rec-1' })
    mockMaintenanceRepo.delete.mockResolvedValue(undefined)

    await service.delete('rec-1', 'user-1')
    expect(mockMaintenanceRepo.delete).toHaveBeenCalledWith('rec-1')
  })

  it('throws NOT_FOUND when record not found', async () => {
    mockMaintenanceRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.delete('rec-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('MaintenanceService.getTotalCost', () => {
  it('returns summed cost for item', async () => {
    mockMaintenanceRepo.sumCostByItemId.mockResolvedValue(55000)

    const result = await service.getTotalCost('item-1')
    expect(result).toBe(55000)
  })
})

describe('MaintenanceService.getFrequencyByMonth', () => {
  it('delegates to the repository with itemId/userId/category, used by the reading-statistics watering/water-change charts', async () => {
    const monthly = [{ month: '2026-01', count: 2 }, { month: '2026-02', count: 1 }]
    mockMaintenanceRepo.countByCategoryPerMonth.mockResolvedValue(monthly)

    const result = await service.getFrequencyByMonth('item-1', 'user-1', 'WATERING')

    expect(mockMaintenanceRepo.countByCategoryPerMonth).toHaveBeenCalledWith('item-1', 'user-1', 'WATERING')
    expect(result).toEqual(monthly)
  })
})
