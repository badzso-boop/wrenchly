import { type PrismaClient, type PrintJob } from '@prisma/client'

export class PrintJobRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<PrintJob | null> {
    return this.db.printJob.findFirst({ where: { id, userId } })
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<PrintJob[]> {
    return this.db.printJob.findMany({
      where: { itemId, userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
  }

  async findAllByItemId(itemId: string, userId: string): Promise<PrintJob[]> {
    return this.db.printJob.findMany({
      where: { itemId, userId },
      orderBy: { startedAt: 'asc' },
    })
  }

  async create(data: {
    userId: string
    itemId: string
    startedAt: Date
    durationMin?: number | null
    filamentGrams: number
    materialType: string
    success: boolean
    notes?: string | null
  }): Promise<PrintJob> {
    return this.db.printJob.create({ data })
  }

  async update(
    id: string,
    data: {
      startedAt?: Date
      durationMin?: number | null
      filamentGrams?: number
      materialType?: string
      success?: boolean
      notes?: string | null
    }
  ): Promise<PrintJob> {
    return this.db.printJob.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.db.printJob.delete({ where: { id } })
  }
}
