import { type PrismaClient, type MaintenanceRecord, type Part } from '@prisma/client'

type MaintenanceRecordWithParts = MaintenanceRecord & { parts: Part[] }

export class MaintenanceRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<MaintenanceRecordWithParts | null> {
    return this.db.maintenanceRecord.findUnique({
      where: { id },
      include: { parts: true },
    })
  }

  async findByIdAndUserId(id: string, userId: string): Promise<MaintenanceRecordWithParts | null> {
    return this.db.maintenanceRecord.findFirst({
      where: { id, userId },
      include: { parts: true },
    })
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<MaintenanceRecordWithParts[]> {
    return this.db.maintenanceRecord.findMany({
      where: { itemId, userId },
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
}
