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

const mockDb = {
  boatProfile: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  bicycleProfile: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  droneProfile: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}

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
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car', type: 'VEHICLE' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput)

    expect(mockTripRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ startOdometer: 50000, distanceKm: 300, endOdometer: 50300 })
    )
  })

  // "calculates fuel totals from fuel stops" removed — fuel is no longer entered through
  // TripService.create() at all (see the standalone FuelUp model, fork 2 of the fuel-up
  // decoupling initiative); create() now always passes totalFuelQty/totalFuelCost as 0.

  it('calculates expense totals', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car', type: 'VEHICLE' })
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
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car', type: 'VEHICLE' })
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
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car', type: 'VEHICLE' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 50000 })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput) // endOdometer = 50300

    expect(mockVehicleRepo.updateOdometer).toHaveBeenCalledWith('item-1', 50300)
  })

  it('does not sync or throw when trip end odometer is lower than current (backfilled trip)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Car', type: 'VEHICLE' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 60000 })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await expect(service.create('user-1', baseInput)).resolves.not.toThrow() // endOdometer = 50300 < 60000

    expect(mockVehicleRepo.updateOdometer).not.toHaveBeenCalled()
  })

  it('skips odometer sync entirely when item has no vehicle profile', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Item', type: 'VEHICLE' })
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
      { startedAt: now, distanceKm: 500, totalFuelQty: 35, totalFuelCost: 21000, totalExpenseCost: 0, expenses: []  },
      { startedAt: now, distanceKm: 500, totalFuelQty: 35, totalFuelCost: 21000, totalExpenseCost: 0, expenses: []  },
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
      { startedAt: recent, distanceKm: 300, totalFuelQty: 21, totalFuelCost: 12600, totalExpenseCost: 0, expenses: []  },
      { startedAt: old, distanceKm: 300, totalFuelQty: 21, totalFuelCost: 12600, totalExpenseCost: 0, expenses: []  },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.allTime.distanceKm).toBe(600)
    expect(stats.last30Days.distanceKm).toBe(300)
  })

  it('reports a single currency from expenses', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockTripRepo.findAllByItemId.mockResolvedValue([
      {
        startedAt: new Date(), distanceKm: 300, totalFuelQty: 20, totalFuelCost: 12000, totalExpenseCost: 1000,
        expenses: [{ currency: 'HUF' }],
      },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies).toEqual(['HUF'])
  })

  it('reports every distinct currency when expenses mix them', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockTripRepo.findAllByItemId.mockResolvedValue([
      {
        startedAt: new Date(), distanceKm: 300, totalFuelQty: 20, totalFuelCost: 12000, totalExpenseCost: 1000,
        expenses: [{ currency: 'EUR' }, { currency: 'HUF' }],
      },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.currencies.sort()).toEqual(['EUR', 'HUF'])
  })

  // NOTE (fuel-up decoupling, fork 1 of 4): `currencies` temporarily only reflects expense
  // currencies, not fuel — fuel no longer lives on TripLog (see the new FuelUp model). Fork 2
  // must extend this once it rewires getStatistics() to source fuel data from FuelUp.

  it('computes BOAT consumption as L/hour (distanceKm holds engine hours for this type)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'BOAT' })
    const now = new Date()
    mockTripRepo.findAllByItemId.mockResolvedValue([
      { startedAt: now, distanceKm: 10, totalFuelQty: 25, totalFuelCost: 15000, totalExpenseCost: 0, expenses: []  },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.consumptionUnit).toBe('L/hour')
    expect(stats.allTime.avgConsumption).toBeCloseTo(2.5) // 25L / 10h
    expect(stats.consumptionTrend[0]?.consumption).toBeCloseTo(2.5)
  })

  it('derives a BICYCLE speed trend from distance+duration, skipping rides with no duration', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'BICYCLE' })
    const now = new Date()
    mockTripRepo.findAllByItemId.mockResolvedValue([
      { startedAt: now, distanceKm: 30, durationMin: 60, totalFuelQty: 0, totalFuelCost: 0, totalExpenseCost: 0, expenses: []  },
      { startedAt: now, distanceKm: 15, durationMin: null, totalFuelQty: 0, totalFuelCost: 0, totalExpenseCost: 0, expenses: []  },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.speedTrend).toHaveLength(1)
    expect(stats.speedTrend[0]?.speedKmh).toBeCloseTo(30) // 30km in 60min = 30 km/h
  })

  it('returns a DRONE battery-used trend, skipping flights with no battery reading', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'DRONE' })
    const now = new Date()
    mockTripRepo.findAllByItemId.mockResolvedValue([
      { startedAt: now, distanceKm: 0, batteryPercentUsed: 45, totalFuelQty: 0, totalFuelCost: 0, totalExpenseCost: 0, expenses: []  },
      { startedAt: now, distanceKm: 0, batteryPercentUsed: null, totalFuelQty: 0, totalFuelCost: 0, totalExpenseCost: 0, expenses: []  },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.batteryTrend).toEqual([{ date: now, batteryPercentUsed: 45 }])
  })
})

describe('TripService non-VEHICLE profile counter sync', () => {
  const baseInput = { itemId: 'item-1', startedAt: new Date('2026-07-01') }

  it('BOAT: adds this voyage\'s hours to engineHours (read-then-write, not a blind increment)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Boat', type: 'BOAT' })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })
    mockDb.boatProfile.findUnique.mockResolvedValue({ engineHours: 10 })

    await service.create('user-1', { ...baseInput, distanceKm: 4 })

    expect(mockDb.boatProfile.update).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { engineHours: 14 },
    })
  })

  it('BOAT: treats a null engineHours as 0 instead of propagating NULL', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Boat', type: 'BOAT' })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })
    mockDb.boatProfile.findUnique.mockResolvedValue({ engineHours: null })

    await service.create('user-1', { ...baseInput, distanceKm: 4 })

    expect(mockDb.boatProfile.update).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { engineHours: 4 },
    })
  })

  it('BOAT: no-ops when the item has no BoatProfile yet', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Boat', type: 'BOAT' })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })
    mockDb.boatProfile.findUnique.mockResolvedValue(null)

    await expect(service.create('user-1', { ...baseInput, distanceKm: 4 })).resolves.not.toThrow()
    expect(mockDb.boatProfile.update).not.toHaveBeenCalled()
  })

  it('BICYCLE: increments both totalKm and chainKm by the ride distance', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Bike', type: 'BICYCLE' })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', { ...baseInput, distanceKm: 25 })

    expect(mockDb.bicycleProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalKm: { increment: 25 }, chainKm: { increment: 25 } },
    })
  })

  it('DRONE: increments totalFlights on create and adds duration to totalFlightHours', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Drone', type: 'DRONE' })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })
    mockDb.droneProfile.findUnique.mockResolvedValue({ totalFlightHours: 2 })

    await service.create('user-1', { ...baseInput, durationMin: 30 })

    expect(mockDb.droneProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalFlights: { increment: 1 } },
    })
    expect(mockDb.droneProfile.update).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalFlightHours: 2.5 }, // 2h + 30min
    })
  })

  it('DRONE: skips the totalFlightHours read/write entirely when no duration was logged', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', name: 'Test Drone', type: 'DRONE' })
    mockTripRepo.create.mockResolvedValue({ id: 'trip-1' })

    await service.create('user-1', baseInput)

    expect(mockDb.droneProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalFlights: { increment: 1 } },
    })
    expect(mockDb.droneProfile.findUnique).not.toHaveBeenCalled()
  })

  it('update: applies only the delta, not the full new value, to avoid double-counting an edit', async () => {
    mockTripRepo.findByIdAndUserId.mockResolvedValue({ id: 'trip-1', itemId: 'item-1', distanceKm: 20, durationMin: null })
    mockItemRepo.findById.mockResolvedValue({ id: 'item-1', type: 'BICYCLE' })
    mockTripRepo.update.mockResolvedValue({ id: 'trip-1' })

    await service.update('trip-1', 'user-1', { distanceKm: 25 }) // was 20, now 25 -> delta 5

    expect(mockDb.bicycleProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalKm: { increment: 5 }, chainKm: { increment: 5 } },
    })
  })

  it("update: does not re-increment DRONE's totalFlights (a trip already counted once at creation)", async () => {
    mockTripRepo.findByIdAndUserId.mockResolvedValue({ id: 'trip-1', itemId: 'item-1', distanceKm: 0, durationMin: 20 })
    mockItemRepo.findById.mockResolvedValue({ id: 'item-1', type: 'DRONE' })
    mockTripRepo.update.mockResolvedValue({ id: 'trip-1' })
    mockDb.droneProfile.findUnique.mockResolvedValue({ totalFlightHours: 1 })

    await service.update('trip-1', 'user-1', { durationMin: 40 }) // was 20, now 40 -> delta 20min

    expect(mockDb.droneProfile.updateMany).not.toHaveBeenCalled()
    expect(mockDb.droneProfile.update).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalFlightHours: 1 + 20 / 60 },
    })
  })
})
