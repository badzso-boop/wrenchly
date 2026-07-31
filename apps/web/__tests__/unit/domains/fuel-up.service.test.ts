import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FuelUpService } from '@/server/domains/fuel-up/fuel-up.service'

const mockRepo = {
  findByIdAndUserId: vi.fn(),
  listByItemId: vi.fn(),
  findAllByItemId: vi.fn(),
  listTripsForItem: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
}

const service = new FuelUpService(mockRepo as any, mockItemRepo as any)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FuelUpService.create', () => {
  const baseInput = {
    itemId: 'item-1',
    occurredAt: new Date('2026-07-31'),
    quantity: 40,
    pricePerUnit: 600,
  }

  it('throws NOT_FOUND when the item does not belong to the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.create('user-1', baseInput)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('rejects item types that do not track fuel (e.g. BICYCLE)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'BICYCLE' })

    await expect(service.create('user-1', baseInput)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('accepts VEHICLE and BOAT', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    mockRepo.create.mockResolvedValue({ id: 'fu-1' })

    await expect(service.create('user-1', baseInput)).resolves.toBeDefined()

    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'BOAT' })
    await expect(service.create('user-1', baseInput)).resolves.toBeDefined()
  })

  it('computes totalPaid as quantity * pricePerUnit', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    mockRepo.create.mockResolvedValue({ id: 'fu-1' })

    await service.create('user-1', { ...baseInput, quantity: 40, pricePerUnit: 605.5 })

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 40, pricePerUnit: 605.5, totalPaid: 24220 })
    )
  })

  it('defaults unit to "liter" and currency to "HUF"', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    mockRepo.create.mockResolvedValue({ id: 'fu-1' })

    await service.create('user-1', baseInput)

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ unit: 'liter', currency: 'HUF' }))
  })

  it('rejects a tripId that does not belong to the same item/user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    mockRepo.listTripsForItem.mockResolvedValue([{ id: 'trip-1', startedAt: new Date(), distanceKm: 100, fuelUps: [] }])

    await expect(
      service.create('user-1', { ...baseInput, tripIds: ['trip-1', 'trip-does-not-belong'] })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('accepts multiple valid tripIds (N-N: one fuel-up can cover several trips)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    mockRepo.listTripsForItem.mockResolvedValue([
      { id: 'trip-1', startedAt: new Date(), distanceKm: 100, fuelUps: [] },
      { id: 'trip-2', startedAt: new Date(), distanceKm: 200, fuelUps: [] },
    ])
    mockRepo.create.mockResolvedValue({ id: 'fu-1' })

    await service.create('user-1', { ...baseInput, tripIds: ['trip-1', 'trip-2'] })

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tripIds: ['trip-1', 'trip-2'] }))
  })
})

describe('FuelUpService.update', () => {
  it('throws NOT_FOUND when the fuel-up does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.update('fu-1', 'user-1', { quantity: 10 })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockRepo.update).not.toHaveBeenCalled()
  })

  it('recomputes totalPaid when quantity or pricePerUnit changes', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'fu-1', itemId: 'item-1', quantity: 40, pricePerUnit: 600 })

    await service.update('fu-1', 'user-1', { quantity: 50 })

    expect(mockRepo.update).toHaveBeenCalledWith('fu-1', expect.objectContaining({ totalPaid: 30000 })) // 50 * 600
  })

  it('does not recompute totalPaid when neither quantity nor pricePerUnit changes', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'fu-1', itemId: 'item-1', quantity: 40, pricePerUnit: 600 })

    await service.update('fu-1', 'user-1', { station: 'Shell' })

    expect(mockRepo.update).toHaveBeenCalledWith('fu-1', expect.objectContaining({ totalPaid: undefined }))
  })

  it('allows reassigning a trip to a different set of fuel-ups (a trip is never permanently locked to one)', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'fu-1', itemId: 'item-1', quantity: 40, pricePerUnit: 600 })
    mockRepo.listTripsForItem.mockResolvedValue([{ id: 'trip-3', startedAt: new Date(), distanceKm: 50, fuelUps: [] }])
    mockRepo.update.mockResolvedValue({ id: 'fu-1' })

    await service.update('fu-1', 'user-1', { tripIds: ['trip-3'] })

    expect(mockRepo.update).toHaveBeenCalledWith('fu-1', expect.objectContaining({ tripIds: ['trip-3'] }))
  })

  it('rejects reassignment to a trip belonging to a different item', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'fu-1', itemId: 'item-1', quantity: 40, pricePerUnit: 600 })
    mockRepo.listTripsForItem.mockResolvedValue([]) // trip-from-other-item isn't in this item's trip list

    await expect(
      service.update('fu-1', 'user-1', { tripIds: ['trip-from-other-item'] })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockRepo.update).not.toHaveBeenCalled()
  })
})

describe('FuelUpService.delete', () => {
  it('throws NOT_FOUND when the fuel-up does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.delete('fu-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockRepo.delete).not.toHaveBeenCalled()
  })

  it('deletes when owned by user (linked trips just lose the association, untouched otherwise)', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'fu-1', itemId: 'item-1' })

    await service.delete('fu-1', 'user-1')

    expect(mockRepo.delete).toHaveBeenCalledWith('fu-1')
  })
})

describe('FuelUpService.listAssignableTrips', () => {
  it('returns every trip for the item regardless of existing fuel-up assignment (N-N: a trip can get more than one)', async () => {
    mockRepo.listTripsForItem.mockResolvedValue([
      { id: 'trip-1', startedAt: new Date(), distanceKm: 100, fuelUps: [{ id: 'fu-existing' }] },
      { id: 'trip-2', startedAt: new Date(), distanceKm: 200, fuelUps: [] },
    ])

    const trips = await service.listAssignableTrips('item-1', 'user-1')

    expect(trips).toHaveLength(2)
    expect(trips[0]?.fuelUps).toEqual([{ id: 'fu-existing' }])
  })
})
