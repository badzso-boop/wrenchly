import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import { type PrintJobRepository } from './printjob.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { type PrismaClient, type PrintJob } from '@prisma/client'

export class PrintJobService {
  constructor(
    private printJobRepo: PrintJobRepository,
    private itemRepo: ItemRepository,
    private db: PrismaClient
  ) {}

  async getById(id: string, userId: string): Promise<PrintJob> {
    const job = await this.printJobRepo.findByIdAndUserId(id, userId)
    if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.printjob.not_found' })
    return job
  }

  async listByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<PrintJob[]> {
    return this.printJobRepo.findByItemId(itemId, userId, cursor, limit)
  }

  async create(
    userId: string,
    input: {
      itemId: string
      startedAt: Date
      durationMin?: number | null
      filamentGrams: number
      materialType: string
      success?: boolean
      notes?: string | null
    }
  ): Promise<PrintJob> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const job = await this.printJobRepo.create({
      userId,
      itemId: input.itemId,
      startedAt: input.startedAt,
      durationMin: input.durationMin,
      filamentGrams: input.filamentGrams,
      materialType: input.materialType,
      success: input.success ?? true,
      notes: input.notes,
    })

    await this.syncPrinterCounters(input.itemId, {
      filamentGrams: input.filamentGrams,
      durationMin: input.durationMin ?? 0,
      isNewJob: true,
    })

    return job
  }

  async update(
    id: string,
    userId: string,
    input: {
      startedAt?: Date
      durationMin?: number | null
      filamentGrams?: number
      materialType?: string
      success?: boolean
      notes?: string | null
    }
  ): Promise<PrintJob> {
    const existing = await this.printJobRepo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.printjob.not_found' })

    const job = await this.printJobRepo.update(id, input)

    // Only the delta (new - old), not the full new value, so editing an existing job doesn't
    // double-count what it already contributed on create -- same principle as Phase 3's
    // BOAT/BICYCLE/DRONE counter sync.
    const filamentDelta = input.filamentGrams !== undefined ? input.filamentGrams - existing.filamentGrams : 0
    const durationDelta = input.durationMin !== undefined
      ? (input.durationMin ?? 0) - (existing.durationMin ?? 0)
      : 0
    await this.syncPrinterCounters(existing.itemId, {
      filamentGrams: filamentDelta,
      durationMin: durationDelta,
      isNewJob: false,
    })

    return job
  }

  async delete(id: string, userId: string): Promise<void> {
    const job = await this.printJobRepo.findByIdAndUserId(id, userId)
    if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.printjob.not_found' })
    await this.printJobRepo.delete(id)
  }

  async getStatistics(itemId: string, userId: string) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const jobs = await this.printJobRepo.findAllByItemId(itemId, userId)

    const totalPrints = jobs.length
    const totalFilamentGrams = jobs.reduce((sum, j) => sum + j.filamentGrams, 0)
    const totalHours = jobs.reduce((sum, j) => sum + (j.durationMin ?? 0), 0) / 60
    const successCount = jobs.filter((j) => j.success).length
    const successRate = totalPrints > 0 ? (successCount / totalPrints) * 100 : 0

    const monthlyMap = new Map<
      string,
      { filamentGrams: number; durationMin: number; total: number; successCount: number }
    >()
    for (const j of jobs) {
      const key = format(j.startedAt, 'yyyy-MM')
      const bucket = monthlyMap.get(key) ?? { filamentGrams: 0, durationMin: 0, total: 0, successCount: 0 }
      bucket.filamentGrams += j.filamentGrams
      bucket.durationMin += j.durationMin ?? 0
      bucket.total += 1
      bucket.successCount += j.success ? 1 : 0
      monthlyMap.set(key, bucket)
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        filamentGrams: v.filamentGrams,
        printHours: v.durationMin / 60,
        successRate: v.total > 0 ? (v.successCount / v.total) * 100 : 0,
      }))

    return { totalPrints, totalFilamentGrams, totalHours, successRate, monthly }
  }

  /** Printer3dProfile's totalPrints/totalPrintHours/filamentConsumedG have all existed since the
   * first migration but were never incremented anywhere until this phase. Unlike an odometer,
   * these are pure accumulators with no "is this actually forward progress" check needed -- a
   * plain atomic `{ increment }` is safe since all three default to 0, not NULL. */
  private async syncPrinterCounters(
    itemId: string,
    delta: { filamentGrams: number; durationMin: number; isNewJob: boolean }
  ): Promise<void> {
    const data: {
      totalPrints?: { increment: number }
      totalPrintHours?: { increment: number }
      filamentConsumedG?: { increment: number }
    } = {}
    if (delta.isNewJob) data.totalPrints = { increment: 1 }
    if (delta.durationMin !== 0) data.totalPrintHours = { increment: delta.durationMin / 60 }
    if (delta.filamentGrams !== 0) data.filamentConsumedG = { increment: delta.filamentGrams }

    if (Object.keys(data).length > 0) {
      await this.db.printer3dProfile.updateMany({ where: { itemId }, data })
    }
  }
}
