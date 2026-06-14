import { TRPCError } from '@trpc/server'
import { type VehicleRepository } from './vehicle.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { type VehicleProfile } from '@prisma/client'

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/

export class VehicleService {
  constructor(
    private vehicleRepo: VehicleRepository,
    private itemRepo: ItemRepository
  ) {}

  async getByItemId(itemId: string, userId: string): Promise<VehicleProfile> {
    await this.assertItemOwnership(itemId, userId)
    const profile = await this.vehicleRepo.findByItemId(itemId)
    if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.vehicle.not_found' })
    return profile
  }

  async create(
    userId: string,
    input: {
      itemId: string
      make: string
      model: string
      year?: number | null
      vin?: string | null
      fuelType?: string | null
      engineDisplacement?: number | null
      currentOdometer?: number | null
      licensePlate?: string | null
      color?: string | null
    }
  ): Promise<VehicleProfile> {
    await this.assertItemOwnership(input.itemId, userId)

    if (input.vin) this.validateVin(input.vin)

    const existing = await this.vehicleRepo.findByItemId(input.itemId)
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.vehicle.profile_already_exists' })
    }

    return this.vehicleRepo.create(input)
  }

  async update(
    itemId: string,
    userId: string,
    input: {
      make?: string
      model?: string
      year?: number | null
      vin?: string | null
      fuelType?: string | null
      engineDisplacement?: number | null
      licensePlate?: string | null
      color?: string | null
    }
  ): Promise<VehicleProfile> {
    await this.assertItemOwnership(itemId, userId)

    const profile = await this.vehicleRepo.findByItemId(itemId)
    if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.vehicle.not_found' })

    if (input.vin) this.validateVin(input.vin)

    return this.vehicleRepo.update(itemId, input)
  }

  async updateOdometer(itemId: string, userId: string, newKm: number): Promise<VehicleProfile> {
    await this.assertItemOwnership(itemId, userId)

    const profile = await this.vehicleRepo.findByItemId(itemId)
    if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.vehicle.not_found' })

    if (profile.currentOdometer !== null && newKm < Number(profile.currentOdometer)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'errors.vehicle.odometer_must_increase',
      })
    }

    return this.vehicleRepo.updateOdometer(itemId, newKm)
  }

  private async assertItemOwnership(itemId: string, userId: string): Promise<void> {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
  }

  private validateVin(vin: string): void {
    if (!VIN_REGEX.test(vin.toUpperCase())) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.vehicle.vin_invalid' })
    }
  }
}
