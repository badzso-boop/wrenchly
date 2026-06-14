import { type PrismaClient, type VehicleProfile } from '@prisma/client'

export class VehicleRepository {
  constructor(private db: PrismaClient) {}

  async findByItemId(itemId: string): Promise<VehicleProfile | null> {
    return this.db.vehicleProfile.findUnique({ where: { itemId } })
  }

  async create(data: {
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
  }): Promise<VehicleProfile> {
    return this.db.vehicleProfile.create({ data })
  }

  async update(
    itemId: string,
    data: {
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
    return this.db.vehicleProfile.update({ where: { itemId }, data })
  }

  async updateOdometer(itemId: string, km: number): Promise<VehicleProfile> {
    return this.db.vehicleProfile.update({
      where: { itemId },
      data: { currentOdometer: km, lastOdometerUpdate: new Date() },
    })
  }

  async delete(itemId: string): Promise<void> {
    await this.db.vehicleProfile.delete({ where: { itemId } })
  }
}
