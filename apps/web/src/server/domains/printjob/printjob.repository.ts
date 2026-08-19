import { type PrismaClient, type PrintJob } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { resolveItemAccess } from '../item/item-access.service'

export class PrintJobRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<PrintJob | null> {
    const job = await this.db.printJob.findUnique({ where: { id } })
    if (!job) return null
    const access = await resolveItemAccess(this.db, job.itemId, userId)
    return access ? job : null
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<PrintJob[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.printJob.findMany({
      where: { itemId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
  }

  async findAllByItemId(itemId: string, userId: string): Promise<PrintJob[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.printJob.findMany({
      where: { itemId },
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
    const access = await resolveItemAccess(this.db, data.itemId, data.userId)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

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
