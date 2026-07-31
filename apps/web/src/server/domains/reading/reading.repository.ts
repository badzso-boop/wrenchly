import { type PrismaClient, type ItemReading } from '@prisma/client'

export class ReadingRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<ItemReading | null> {
    return this.db.itemReading.findFirst({ where: { id, userId } })
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<ItemReading[]> {
    return this.db.itemReading.findMany({
      where: { itemId, userId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
  }

  async findAllByItemId(itemId: string, userId: string): Promise<ItemReading[]> {
    return this.db.itemReading.findMany({
      where: { itemId, userId },
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
