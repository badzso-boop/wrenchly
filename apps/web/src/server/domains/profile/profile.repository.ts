import { type PrismaClient, type ItemType } from '@prisma/client'
import { getProfileFields } from './profile.fields'

type ProfileRecord = Record<string, unknown> | null

export class ProfileRepository {
  constructor(private db: PrismaClient) {}

  async find(itemType: ItemType, itemId: string): Promise<ProfileRecord> {
    const record = await this.findRaw(itemType, itemId)
    return record ? this.normalize(itemType, record) : null
  }

  async upsert(
    itemType: ItemType,
    itemId: string,
    data: Record<string, unknown>
  ): Promise<ProfileRecord> {
    const record = await this.upsertRaw(itemType, itemId, data)
    return this.normalize(itemType, record)
  }

  // Prisma returns Decimal-typed fields as Decimal.js instances, which don't survive
  // superjson's default (de)serialization cleanly — convert them to plain numbers.
  private normalize(itemType: ItemType, record: Record<string, unknown>): Record<string, unknown> {
    const fields = getProfileFields(itemType) ?? []
    const decimalKeys = fields.filter((f) => f.type === 'decimal').map((f) => f.key)
    if (decimalKeys.length === 0) return record

    const normalized = { ...record }
    for (const key of decimalKeys) {
      const value = normalized[key]
      if (value !== null && value !== undefined) normalized[key] = Number(value)
    }
    return normalized
  }

  private findRaw(itemType: ItemType, itemId: string) {
    switch (itemType) {
      case 'PROPERTY':
        return this.db.propertyProfile.findUnique({ where: { itemId } })
      case 'PLANT':
        return this.db.plantProfile.findUnique({ where: { itemId } })
      case 'PRINTER_3D':
        return this.db.printer3dProfile.findUnique({ where: { itemId } })
      case 'PET':
        return this.db.petProfile.findUnique({ where: { itemId } })
      case 'BICYCLE':
        return this.db.bicycleProfile.findUnique({ where: { itemId } })
      case 'AQUARIUM':
        return this.db.aquariumProfile.findUnique({ where: { itemId } })
      case 'POOL':
        return this.db.poolProfile.findUnique({ where: { itemId } })
      case 'BOAT':
        return this.db.boatProfile.findUnique({ where: { itemId } })
      case 'DRONE':
        return this.db.droneProfile.findUnique({ where: { itemId } })
      case 'INSTRUMENT':
        return this.db.instrumentProfile.findUnique({ where: { itemId } })
      case 'SOLAR':
        return this.db.solarProfile.findUnique({ where: { itemId } })
      default:
        return Promise.resolve(null)
    }
  }

  private upsertRaw(itemType: ItemType, itemId: string, data: Record<string, unknown>) {
    switch (itemType) {
      case 'PROPERTY':
        return this.db.propertyProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.propertyProfile.create>[0]['data'],
          update: data,
        })
      case 'PLANT':
        return this.db.plantProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.plantProfile.create>[0]['data'],
          update: data,
        })
      case 'PRINTER_3D':
        return this.db.printer3dProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.printer3dProfile.create>[0]['data'],
          update: data,
        })
      case 'PET':
        return this.db.petProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.petProfile.create>[0]['data'],
          update: data,
        })
      case 'BICYCLE':
        return this.db.bicycleProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.bicycleProfile.create>[0]['data'],
          update: data,
        })
      case 'AQUARIUM':
        return this.db.aquariumProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.aquariumProfile.create>[0]['data'],
          update: data,
        })
      case 'POOL':
        return this.db.poolProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.poolProfile.create>[0]['data'],
          update: data,
        })
      case 'BOAT':
        return this.db.boatProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.boatProfile.create>[0]['data'],
          update: data,
        })
      case 'DRONE':
        return this.db.droneProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.droneProfile.create>[0]['data'],
          update: data,
        })
      case 'INSTRUMENT':
        return this.db.instrumentProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.instrumentProfile.create>[0]['data'],
          update: data,
        })
      case 'SOLAR':
        return this.db.solarProfile.upsert({
          where: { itemId },
          create: { itemId, ...data } as Parameters<typeof this.db.solarProfile.create>[0]['data'],
          update: data,
        })
      default:
        throw new Error(`No profile table for item type ${itemType}`)
    }
  }
}
