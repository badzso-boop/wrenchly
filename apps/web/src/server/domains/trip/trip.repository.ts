import { type PrismaClient, type TripLog, type TripExpense } from '@prisma/client'

type TripLogWithChildren = TripLog & { expenses: TripExpense[] }

export class TripRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<TripLogWithChildren | null> {
    return this.db.tripLog.findFirst({
      where: { id, userId },
      include: { expenses: true },
    })
  }

  async findByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<TripLogWithChildren[]> {
    return this.db.tripLog.findMany({
      where: { itemId, userId },
      include: { expenses: true },
      orderBy: { startedAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
  }

  async findAllByItemId(itemId: string, userId: string): Promise<TripLogWithChildren[]> {
    return this.db.tripLog.findMany({
      where: { itemId, userId },
      include: { expenses: true },
      orderBy: { startedAt: 'asc' },
    })
  }

  async create(data: {
    userId: string
    itemId: string
    startedAt: Date
    description?: string | null
    notes?: string | null
    startOdometer: number
    distanceKm: number
    endOdometer: number
    startFuelLiters?: number | null
    totalExpenseCost: number
    durationMin?: number | null
    elevationGainM?: number | null
    batteryPercentUsed?: number | null
    maxAltitudeM?: number | null
    expenses?: Array<{
      type: 'TOLL' | 'VIGNETTE' | 'PARKING' | 'OTHER'
      amount: number
      currency: string
      description?: string | null
    }>
  }): Promise<TripLogWithChildren> {
    const { expenses, ...trip } = data
    return this.db.tripLog.create({
      data: {
        ...trip,
        expenses: expenses ? { create: expenses } : undefined,
      },
      include: { expenses: true },
    })
  }

  async update(
    id: string,
    data: {
      startedAt?: Date
      description?: string | null
      notes?: string | null
      startOdometer?: number
      distanceKm?: number
      endOdometer?: number
      startFuelLiters?: number | null
      totalExpenseCost?: number
      durationMin?: number | null
      elevationGainM?: number | null
      batteryPercentUsed?: number | null
      maxAltitudeM?: number | null
      expenses?: Array<{
        type: 'TOLL' | 'VIGNETTE' | 'PARKING' | 'OTHER'
        amount: number
        currency: string
        description?: string | null
      }>
    }
  ): Promise<TripLogWithChildren> {
    const { expenses, ...trip } = data
    return this.db.tripLog.update({
      where: { id },
      data: {
        ...trip,
        // Full replace: simpler and safer than diffing individual rows, mirrors how
        // maintenance.repository.ts handles parts on update.
        expenses: expenses ? { deleteMany: {}, create: expenses } : undefined,
      },
      include: { expenses: true },
    })
  }

  async delete(id: string): Promise<void> {
    await this.db.tripLog.delete({ where: { id } })
  }
}
