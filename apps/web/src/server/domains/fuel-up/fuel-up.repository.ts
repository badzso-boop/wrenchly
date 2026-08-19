import type { PrismaClient, FuelUp } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { resolveItemAccess } from '../item/item-access.service'

export type FuelUpWithTrips = FuelUp & {
  trips: { id: string; startedAt: Date; distanceKm: number; description: string | null }[]
}

const TRIP_SELECT = { id: true, startedAt: true, distanceKm: true, description: true } as const

export class FuelUpRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<FuelUpWithTrips | null> {
    const fuelUp = await this.db.fuelUp.findUnique({
      where: { id },
      include: { trips: { select: TRIP_SELECT } },
    })
    if (!fuelUp) return null
    const access = await resolveItemAccess(this.db, fuelUp.itemId, userId)
    return access ? fuelUp : null
  }

  async listByItemId(itemId: string, userId: string): Promise<FuelUpWithTrips[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.fuelUp.findMany({
      where: { itemId },
      include: { trips: { select: TRIP_SELECT } },
      orderBy: { occurredAt: 'desc' },
    })
  }

  // Statistics need the full, unfiltered set for the item to compute all-time/monthly buckets
  // and the per-fuel-up consumption trend.
  async findAllByItemId(itemId: string, userId: string): Promise<FuelUpWithTrips[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.fuelUp.findMany({
      where: { itemId },
      include: { trips: { select: TRIP_SELECT } },
      orderBy: { occurredAt: 'asc' },
    })
  }

  // Every trip for this item, each with the ids of the fuel-up(s) already covering it — the
  // assignment UI shows all trips (not just unassigned ones), since a trip can belong to more
  // than one fuel-up. Also doubles as the access check for assigning trips to a fuel-up: any
  // id not present in this list doesn't belong to this item.
  async listTripsForItem(itemId: string, userId: string) {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.tripLog.findMany({
      where: { itemId },
      select: {
        id: true,
        startedAt: true,
        distanceKm: true,
        description: true,
        fuelUps: { select: { id: true } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  async create(data: {
    itemId: string
    userId: string
    occurredAt: Date
    quantity: number
    unit: string
    isFullTank: boolean
    pricePerUnit: number
    totalPaid: number
    currency: string
    fuelType?: string | null
    station?: string | null
    notes?: string | null
    tripIds?: string[]
  }): Promise<FuelUpWithTrips> {
    const access = await resolveItemAccess(this.db, data.itemId, data.userId)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

    const { tripIds, ...fuelUp } = data
    return this.db.fuelUp.create({
      data: {
        ...fuelUp,
        trips: tripIds && tripIds.length > 0 ? { connect: tripIds.map((id) => ({ id })) } : undefined,
      },
      include: { trips: { select: TRIP_SELECT } },
    })
  }

  async update(
    id: string,
    data: Partial<{
      occurredAt: Date
      quantity: number
      unit: string
      isFullTank: boolean
      pricePerUnit: number
      totalPaid: number
      currency: string
      fuelType: string | null
      station: string | null
      notes: string | null
      tripIds: string[]
    }>
  ): Promise<FuelUpWithTrips> {
    const { tripIds, ...fuelUp } = data
    return this.db.fuelUp.update({
      where: { id },
      data: {
        ...fuelUp,
        // Full replace (disconnect all, reconnect the new set) — simpler than diffing, mirrors
        // trip.repository.ts's expenses deleteMany+create pattern for the same "editing this
        // record means the new set wins" semantics.
        trips: tripIds ? { set: tripIds.map((id) => ({ id })) } : undefined,
      },
      include: { trips: { select: TRIP_SELECT } },
    })
  }

  async delete(id: string): Promise<void> {
    await this.db.fuelUp.delete({ where: { id } })
  }
}
