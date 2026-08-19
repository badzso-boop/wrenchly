import { type PrismaClient, type ItemReading } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { resolveItemAccess } from '../item/item-access.service'

export class ReadingRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<ItemReading | null> {
    const reading = await this.db.itemReading.findUnique({ where: { id } })
    if (!reading) return null
    const access = await resolveItemAccess(this.db, reading.itemId, userId)
    return access ? reading : null
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<ItemReading[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.itemReading.findMany({
      where: { itemId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
  }

  async findAllByItemId(itemId: string, userId: string): Promise<ItemReading[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.itemReading.findMany({
      where: { itemId },
      orderBy: { recordedAt: 'asc' },
    })
  }

  async create(data: {
    userId: string
    itemId: string
    recordedAt: Date
    metrics: Record<string, number>
    notes?: string | null
  }): Promise<ItemReading> {
    const access = await resolveItemAccess(this.db, data.itemId, data.userId)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

    return this.db.itemReading.create({
      data: data as Parameters<typeof this.db.itemReading.create>[0]['data'],
    })
  }

  async update(
    id: string,
    data: {
      recordedAt?: Date
      metrics?: Record<string, number>
      notes?: string | null
    }
  ): Promise<ItemReading> {
    return this.db.itemReading.update({
      where: { id },
      data: data as Parameters<typeof this.db.itemReading.update>[0]['data'],
    })
  }

  async delete(id: string): Promise<void> {
    await this.db.itemReading.delete({ where: { id } })
  }
}
