import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TripService } from '@/server/domains/trip/trip.service'

const mockTripRepo = {
  findByIdAndUserId: vi.fn(),
  findByItemId: vi.fn(),
  findAllByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
  findById: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockVehicleRepo = {
  findByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateOdometer: vi.fn(),
  delete: vi.fn(),
}

const mockReminderRepo = {
  findOdometerByItemIdWithUser: vi.fn(),
  update: vi.fn(),
}

const mockDb = {}

const service = new TripService(
  mockTripRepo as any,
  mockItemRepo as any,
  mockVehicleRepo as any,
  mockReminderRepo as any,
  mockDb as any
)

beforeEach(() => {
  vi.clearAllMocks()
  mockReminderRepo.findOdometerByItemIdWithUser.mockResolvedValue([])
})

describe('TripService.create', () => {
  const baseInput = {
    itemId: 'item-1',
    startedAt: new Date('2026-07-01'),
    startOdometer: 50000,
    distanceKm: 300,
  }

  it('computes endOdometer from startOdometer + distanceKm', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput)

    expect(mockTripRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ startOdometer: 50000, distanceKm: 300, endOdometer: 50300 })
    )
  })

  it('calculates fuel totals from fuel stops', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', {
      ...baseInput,
      fuelStops: [
        { quantity: 30, unit: 'liter', pricePerUnit: 600, currency: 'HUF' },
        { quantity: 10, unit: 'liter', pricePerUnit: 620, currency: 'HUF' },
      ],
    })

    expect(mockTripRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        totalFuelQty: 40,
        totalFuelCost: 30 * 600 + 10 * 620,
        fuelStops: [
          expect.objectContaining({ totalPaid: 18000 }),
          expect.objectContaining({ totalPaid: 6200 }),
        ],
      })
    )
  })

  it('calculates expense totals', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', {
      ...baseInput,
      expenses: [
        { type: 'TOLL', amount: 1500, currency: 'HUF' },
        { type: 'PARKING', amount: 500, currency: 'HUF' },
      ],
    })

    expect(mockTripRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalExpenseCost: 2000 })
    )
  })

  it('sets totals to 0 when no fuel stops or expenses', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput)

    expect(mockTripRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalFuelQty: 0, totalFuelCost: 0, totalExpenseCost: 0 })
    )
  })

  it('throws NOT_FOUND when item is not owned by user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.create('user-1', baseInput)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.item.not_found',
    })
    expect(mockTripRepo.create).not.toHaveBeenCalled()
  })

  it('syncs vehicle odometer when trip end odometer is greater than current', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 50000 })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput) // endOdometer = 50300

    expect(mockVehicleRepo.updateOdometer).toHaveBeenCalledWith('item-1', 50300)
  })

  it('does not sync or throw when trip end odometer is lower than current (backfilled trip)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 60000 })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await expect(service.create('user-1', baseInput)).resolves.not.toThrow() // endOdometer = 50300 < 60000

    expect(mockVehicleRepo.updateOdometer).not.toHaveBeenCalled()
  })

  it('skips odometer sync entirely when item has no vehicle profile', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Item' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput)

    expect(mockVehicleRepo.updateOdometer).not.toHaveBeenCalled()
  })
})

describe('TripService.getById / delete', () => {
  it('throws NOT_FOUND when trip does not belong to user', async () => {
    mockTripRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getById('trip-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(service.delete('trip-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('deletes trip when owned by user', async () => {
    mockTripRepo.findByIdAndUserId.mockResolvedValue({ id: 'trip-1' })

    await service.delete('trip-1', 'user-1')
    expect(mockTripRepo.delete).toHaveBeenCalledWith('trip-1')
  })
})

describe('TripService.getStatistics', () => {
  it('throws NOT_FOUND when item is not owned by user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getStatistics('item-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('computes average consumption as L/100km across all trips', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    const now = new Date()
    mockTripRepo.findAllByItemId.mockResolvedValue([
      { startedAt: now, distanceKm: 500, totalFuelQty: 35, totalFuelCost: 21000, totalExpenseCost: 0, fuelStops: [], expenses: [] },
      { startedAt: now, distanceKm: 500, totalFuelQty: 35, totalFuelCost: 21000, totalExpenseCost: 0, fuelStops: [], expenses: [] },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    // 70 liters / (1000km / 100) = 7 L/100km
    expect(stats.allTime.avgConsumption).toBeCloseTo(7)
    expect(stats.allTime.distanceKm).toBe(1000)
    expect(stats.tripCount).toBe(2)
  })

  it('returns 0 average consumption when there is no distance or fuel data', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockTripRepo.findAllByItemId.mockResolvedValue([])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.allTime.avgConsumption).toBe(0)
    expect(stats.last30Days.avgConsumption).toBe(0)
  })

  it('excludes trips older than 30 days from the last30Days bucket', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    const recent = new Date()
    const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    mockTripRepo.findAllByItemId.mockResolvedValue([
      { startedAt: recent, distanceKm: 300, totalFuelQty: 21, totalFuelCost: 12600, totalExpenseCost: 0, fuelStops: [], expenses: [] },
      { startedAt: old, distanceKm: 300, totalFuelQty: 21, totalFuelCost: 12600, totalExpenseCost: 0, fuelStops: [], expenses: [] },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.allTime.distanceKm).toBe(600)
    expect(stats.last30Days.distanceKm).toBe(300)
  })

  it('reports a single currency when every fuel stop and expense uses it', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockTripRepo.findAllByItemId.mockResolvedValue([
      {
        startedAt: new Date(), distanceKm: 300, totalFuelQty: 20, totalFuelCost: 12000, totalExpenseCost: 1000,
        fuelStops: [{ currency: 'HUF' }],
        expenses: [{ currency: 'HUF' }],
      },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies).toEqual(['HUF'])
  })

  it('reports every distinct currency when trips mix them', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockTripRepo.findAllByItemId.mockResolvedValue([
      {
        startedAt: new Date(), distanceKm: 300, totalFuelQty: 20, totalFuelCost: 12000, totalExpenseCost: 1000,
        fuelStops: [{ currency: 'HUF' }, { currency: 'EUR' }],
        expenses: [{ currency: 'EUR' }],
      },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies.sort()).toEqual(['EUR', 'HUF'])
  })
})
