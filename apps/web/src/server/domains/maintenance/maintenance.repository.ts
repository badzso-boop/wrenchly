import { type PrismaClient, type MaintenanceRecord, type Part } from '@prisma/client'
import { format } from 'date-fns'
import { TRPCError } from '@trpc/server'
import { resolveItemAccess } from '../item/item-access.service'

type MaintenanceRecordWithParts = MaintenanceRecord & { parts: Part[] }

export class MaintenanceRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<MaintenanceRecordWithParts | null> {
    return this.db.maintenanceRecord.findUnique({
      where: { id },
      include: { parts: true },
    })
  }

  /** Owner OR an ACCEPTED collaborator on the record's item — NOT ownership-only. */
  async findByIdAndUserId(id: string, userId: string): Promise<MaintenanceRecordWithParts | null> {
    const record = await this.db.maintenanceRecord.findUnique({ where: { id }, include: { parts: true } })
    if (!record) return null
    const access = await resolveItemAccess(this.db, record.itemId, userId)
    return access ? record : null
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<MaintenanceRecordWithParts[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.maintenanceRecord.findMany({
      where: { itemId },
      include: { parts: true },
      orderBy: { performedAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
  }

  async create(data: {
    userId: string
    itemId: string
    title: string
    category: string
    performedAt: Date
    odometerValue?: number | null
    notes?: string | null
    costTotal?: number | null
    parts?: Array<{
      name: string
      category?: string | null
      quantity: number
      unit: string
      unitPrice?: number | null
      totalPrice?: number | null
    }>
  }): Promise<MaintenanceRecordWithParts> {
    const access = await resolveItemAccess(this.db, data.itemId, data.userId)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

    const { parts, ...record } = data
    return this.db.maintenanceRecord.create({
      data: {
        ...record,
        parts: parts ? { create: parts } : undefined,
      },
      include: { parts: true },
    })
  }

  async update(
    id: string,
    data: {
      title?: string
      category?: string
      performedAt?: Date
      odometerValue?: number | null
      notes?: string | null
      costTotal?: number | null
      parts?: Array<{
        name: string
        category?: string | null
        quantity: number
        unit: string
        unitPrice?: number | null
        totalPrice?: number | null
      }>
    }
  ): Promise<MaintenanceRecordWithParts> {
    const { parts, ...record } = data
    return this.db.maintenanceRecord.update({
      where: { id },
      data: {
        ...record,
        // Full replace: simpler and safer than diffing individual part rows,
        // and matches how create() writes parts in one shot.
        parts: parts ? { deleteMany: {}, create: parts } : undefined,
      },
      include: { parts: true },
    })
  }

  async delete(id: string): Promise<void> {
    await this.db.maintenanceRecord.delete({ where: { id } })
  }

  async sumCostByItemId(itemId: string): Promise<number> {
    const result = await this.db.maintenanceRecord.aggregate({
      where: { itemId },
      _sum: { costTotal: true },
    })
    return Number(result._sum.costTotal ?? 0)
  }

  /** Used by reading statistics for domains whose "frequency" chart is really a count of
   * existing MaintenanceRecords (e.g. PLANT watering, AQUARIUM water changes) rather than a new
   * ItemReading metric — no new schema needed for these. */
  async countByCategoryPerMonth(
    itemId: string,
    userId: string,
    category: string
  ): Promise<{ month: string; count: number }[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    const records = await this.db.maintenanceRecord.findMany({
      where: { itemId, category },
      select: { performedAt: true },
    })

    const monthlyMap = new Map<string, number>()
    for (const r of records) {
      const key = format(r.performedAt, 'yyyy-MM')
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
    }
    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))
  }
}
