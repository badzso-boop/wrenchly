import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VehicleService } from '@/server/domains/vehicle/vehicle.service'
import { TRPCError } from '@trpc/server'

const mockVehicleRepo = {
  findByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateOdometer: vi.fn(),
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

const mockReminderRepo = {
  findOdometerByItemIdWithUser: vi.fn(),
  update: vi.fn(),
}

const mockDb = {}

const service = new VehicleService(
  mockVehicleRepo as any,
  mockItemRepo as any,
  mockReminderRepo as any,
  mockDb as any
)

beforeEach(() => {
  vi.clearAllMocks()
  mockReminderRepo.findOdometerByItemIdWithUser.mockResolvedValue([])
})

describe('VehicleService.updateOdometer', () => {
  it('updates odometer when new value is greater', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 50000 })
    mockVehicleRepo.updateOdometer.mockResolvedValue({ currentOdometer: 55000 })

    const result = await service.updateOdometer('item-1', 'user-1', 55000)
    expect(result.currentOdometer).toBe(55000)
    expect(mockVehicleRepo.updateOdometer).toHaveBeenCalledWith('item-1', 55000)
  })

  it('throws BAD_REQUEST when new km is less than current', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 50000 })

    await expect(service.updateOdometer('item-1', 'user-1', 49000)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'errors.vehicle.odometer_must_increase',
    })
  })

  it('throws NOT_FOUND when vehicle profile does not exist', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)

    await expect(service.updateOdometer('item-1', 'user-1', 55000)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.vehicle.not_found',
    })
  })

  it('throws NOT_FOUND when item does not belong to user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.updateOdometer('item-1', 'user-2', 55000)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('allows equal odometer value (same reading is not decrease)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 50000 })
    mockVehicleRepo.updateOdometer.mockResolvedValue({ currentOdometer: 50000 })

    await expect(service.updateOdometer('item-1', 'user-1', 50000)).resolves.not.toThrow()
  })
})

describe('VehicleService.create', () => {
  it('creates vehicle profile when item is owned by user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    const profile = { id: 'vp-1', itemId: 'item-1', make: 'Ford', model: 'Focus' }
    mockVehicleRepo.create.mockResolvedValue(profile)

    const result = await service.create('user-1', {
      itemId: 'item-1',
      make: 'Ford',
      model: 'Focus',
    })
    expect(result).toEqual(profile)
  })

  it('throws CONFLICT when profile already exists', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue({ id: 'existing' })

    await expect(
      service.create('user-1', { itemId: 'item-1', make: 'Ford', model: 'Focus' })
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'errors.vehicle.profile_already_exists',
    })
  })

  it('throws BAD_REQUEST for invalid VIN', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)

    await expect(
      service.create('user-1', { itemId: 'item-1', make: 'Ford', model: 'Focus', vin: 'INVALID' })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'errors.vehicle.vin_invalid',
    })
  })

  it('accepts valid 17-char VIN', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockVehicleRepo.findByItemId.mockResolvedValue(null)
    mockVehicleRepo.create.mockResolvedValue({ id: 'vp-1' })

    await expect(
      service.create('user-1', {
        itemId: 'item-1',
        make: 'Ford',
        model: 'Focus',
        vin: 'WVWZZZ3BZ9E123456',
      })
    ).resolves.not.toThrow()
  })
})
