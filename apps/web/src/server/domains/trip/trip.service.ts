import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import { type TripRepository } from './trip.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { type VehicleRepository } from '@/server/domains/vehicle/vehicle.repository'
import { ReminderService } from '@/server/domains/reminder/reminder.service'
import { type ReminderRepository } from '@/server/domains/reminder/reminder.repository'
import { type PrismaClient, type TripLog, type TripExpense, type TripExpenseType, type ItemType } from '@prisma/client'

type TripLogWithChildren = TripLog & { expenses: TripExpense[] }

interface ExpenseInput {
  type: TripExpenseType
  amount: number
  currency: string
  description?: string | null
}

export interface StatsBucket {
  distanceKm: number
  fuelQty: number
  fuelCost: number
  expenseCost: number
  avgConsumption: number
  elevationGainM: number
}

// NOTE (fuel-up decoupling, fork 1 of 4 — minimum-to-compile pass only): fuel is no longer
// entered through the trip domain at all (see the standalone FuelUp model + its own domain,
// built by fork 2). totalFuelQty/totalFuelCost stay on TripLog for now but are never written by
// create()/update() anymore, and getStatistics() below still reads them for OLD trips only (their
// historical cached values survive the migration) — this is a known, temporary inconsistency:
// aggregate()/consumptionTrend/currencies all still assume fuel lives on the trip. Rewiring all of
// this to source from FuelUp (via the new N-N relation) is fork 2's job, not fixed here.

function calculateExpenseTotal(expenses: ExpenseInput[]) {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

/** BOAT's `distanceKm` column actually holds engine hours (see trip.labels.ts) — its consumption
 * is L/hour, a plain division, not the L/100km formula every other fuel-tracking type uses. */
function consumptionDivisor(itemType: ItemType, distanceKm: number): number {
  return itemType === 'BOAT' ? distanceKm : distanceKm / 100
}

function consumptionUnitFor(itemType: ItemType): string {
  return itemType === 'BOAT' ? 'L/hour' : 'L/100km'
}

function aggregate(trips: TripLogWithChildren[], itemType: ItemType): StatsBucket {
  const distanceKm = trips.reduce((sum, t) => sum + t.distanceKm, 0)
  const fuelQty = trips.reduce((sum, t) => sum + Number(t.totalFuelQty), 0)
  const fuelCost = trips.reduce((sum, t) => sum + Number(t.totalFuelCost), 0)
  const expenseCost = trips.reduce((sum, t) => sum + Number(t.totalExpenseCost), 0)
  const elevationGainM = trips.reduce((sum, t) => sum + (t.elevationGainM ?? 0), 0)
  const avgConsumption = distanceKm > 0 && fuelQty > 0 ? fuelQty / consumptionDivisor(itemType, distanceKm) : 0
  return { distanceKm, fuelQty, fuelCost, expenseCost, avgConsumption, elevationGainM }
}

export class TripService {
  constructor(
    private tripRepo: TripRepository,
    private itemRepo: ItemRepository,
    private vehicleRepo: VehicleRepository,
    private reminderRepo: ReminderRepository,
    private db: PrismaClient
  ) {}

  async getById(id: string, userId: string): Promise<TripLogWithChildren> {
    const trip = await this.tripRepo.findByIdAndUserId(id, userId)
    if (!trip) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.trip.not_found' })
    return trip
  }

  async listByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<TripLogWithChildren[]> {
    return this.tripRepo.findByItemId(itemId, userId, cursor, limit)
  }

  async create(
    userId: string,
    input: {
      itemId: string
      startedAt: Date
      description?: string | null
      notes?: string | null
      startOdometer?: number
      distanceKm?: number
      startFuelLiters?: number | null
      durationMin?: number | null
      elevationGainM?: number | null
      batteryPercentUsed?: number | null
      maxAltitudeM?: number | null
      expenses?: ExpenseInput[]
    }
  ): Promise<TripLogWithChildren> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    // BICYCLE/DRONE have no per-trip "starting reading" concept (trip.labels.ts's
    // showOdometerFields) and DRONE's distance is itself optional — default both to 0 so the
    // schema's required startOdometer/distanceKm/endOdometer columns still get sane values.
    const startOdometer = input.startOdometer ?? 0
    const distanceKm = input.distanceKm ?? 0
    const endOdometer = startOdometer + distanceKm
    const expenses = input.expenses ?? []
    const totalExpenseCost = calculateExpenseTotal(expenses)

    const trip = await this.tripRepo.create({
      userId,
      itemId: input.itemId,
      startedAt: input.startedAt,
      description: input.description,
      notes: input.notes,
      startOdometer,
      distanceKm,
      endOdometer,
      startFuelLiters: input.startFuelLiters,
      durationMin: input.durationMin,
      elevationGainM: input.elevationGainM,
      batteryPercentUsed: input.batteryPercentUsed,
      maxAltitudeM: input.maxAltitudeM,
      totalFuelQty: 0,
      totalFuelCost: 0,
      totalExpenseCost,
      expenses,
    })

    if (item.type === 'VEHICLE') {
      await this.syncVehicleOdometer(input.itemId, item.name, endOdometer)
    } else {
      await this.syncTripTypeCounters(item.type, input.itemId, {
        distanceKm,
        durationMin: input.durationMin ?? 0,
        isNewTrip: true,
      })
    }

    return trip
  }

  async update(
    id: string,
    userId: string,
    input: {
      startedAt?: Date
      description?: string | null
      notes?: string | null
      startOdometer?: number
      distanceKm?: number
      startFuelLiters?: number | null
      durationMin?: number | null
      elevationGainM?: number | null
      batteryPercentUsed?: number | null
      maxAltitudeM?: number | null
      expenses?: ExpenseInput[]
    }
  ): Promise<TripLogWithChildren> {
    const existing = await this.tripRepo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.trip.not_found' })

    const startOdometer = input.startOdometer ?? existing.startOdometer
    const distanceKm = input.distanceKm ?? existing.distanceKm
    const endOdometer = startOdometer + distanceKm

    const { expenses, ...rest } = input
    const data: Parameters<TripRepository['update']>[1] = {
      ...rest,
      startOdometer,
      distanceKm,
      endOdometer,
    }

    if (expenses) {
      data.expenses = expenses
      data.totalExpenseCost = calculateExpenseTotal(expenses)
    }

    const trip = await this.tripRepo.update(id, data)

    const item = await this.itemRepo.findById(existing.itemId)
    if (item?.type === 'VEHICLE') {
      await this.syncVehicleOdometer(existing.itemId, undefined, endOdometer)
    } else if (item) {
      const distanceDelta = distanceKm - existing.distanceKm
      const durationDelta = (input.durationMin ?? existing.durationMin ?? 0) - (existing.durationMin ?? 0)
      await this.syncTripTypeCounters(item.type, existing.itemId, {
        distanceKm: distanceDelta,
        durationMin: durationDelta,
        isNewTrip: false,
      })
    }

    return trip
  }

  async delete(id: string, userId: string): Promise<void> {
    const trip = await this.tripRepo.findByIdAndUserId(id, userId)
    if (!trip) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.trip.not_found' })
    await this.tripRepo.delete(id)
  }

  async getStatistics(itemId: string, userId: string) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const trips = await this.tripRepo.findAllByItemId(itemId, userId)

    const allTime = aggregate(trips, item.type)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30Days = aggregate(trips.filter((t) => t.startedAt >= thirtyDaysAgo), item.type)

    const monthlyMap = new Map<
      string,
      { distanceKm: number; fuelCost: number; expenseCost: number; durationMin: number; tripCount: number }
    >()
    for (const t of trips) {
      const key = format(t.startedAt, 'yyyy-MM')
      const bucket = monthlyMap.get(key) ?? { distanceKm: 0, fuelCost: 0, expenseCost: 0, durationMin: 0, tripCount: 0 }
      bucket.distanceKm += t.distanceKm
      bucket.fuelCost += Number(t.totalFuelCost)
      bucket.expenseCost += Number(t.totalExpenseCost)
      bucket.durationMin += t.durationMin ?? 0
      bucket.tripCount += 1
      monthlyMap.set(key, bucket)
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    const consumptionTrend = trips
      .filter((t) => Number(t.totalFuelQty) > 0 && t.distanceKm > 0)
      .map((t) => ({
        date: t.startedAt,
        consumption: Number(t.totalFuelQty) / consumptionDivisor(item.type, t.distanceKm),
      }))

    // BICYCLE: derived average speed per ride (needs both distance and a logged duration).
    const speedTrend = trips
      .filter((t) => t.durationMin != null && t.durationMin > 0 && t.distanceKm > 0)
      .map((t) => ({ date: t.startedAt, speedKmh: t.distanceKm / (t.durationMin! / 60) }))

    // DRONE: battery percent used per flight.
    const batteryTrend = trips
      .filter((t) => t.batteryPercentUsed != null)
      .map((t) => ({ date: t.startedAt, batteryPercentUsed: t.batteryPercentUsed! }))

    // From PR #7: which currencies actually appear across this item's expenses (only ever
    // non-empty for VEHICLE/BOAT) — lets the UI show a real currency label, or flag mixed
    // currencies, instead of a bare unlabeled number.
    // TEMPORARY (fuel-up decoupling, fork 1 of 4): fuel currencies dropped out of this set since
    // fuel no longer lives on TripLog — fork 2 must add the FuelUp table's currencies back in
    // here once its own domain/statistics rewrite lands, or this under-reports mixed currencies
    // for any item whose only non-HUF spend was on fuel.
    const currencies = Array.from(new Set(trips.flatMap((t) => t.expenses.map((e) => e.currency))))

    return {
      allTime,
      last30Days,
      monthly,
      consumptionTrend,
      consumptionUnit: consumptionUnitFor(item.type),
      speedTrend,
      batteryTrend,
      currencies,
      tripCount: trips.length,
    }
  }

  /**
   * Best-effort: keeps VehicleProfile.currentOdometer (and its reminder triggers) in sync when
   * a trip pushes the odometer forward. Unlike VehicleService.updateOdometer this never throws
   * on a lower/equal value — backfilling a past trip after a newer one was already logged is a
   * normal case here, not an error.
   */
  private async syncVehicleOdometer(itemId: string, itemName: string | undefined, endOdometer: number): Promise<void> {
    const profile = await this.vehicleRepo.findByItemId(itemId)
    if (!profile) return
    if (profile.currentOdometer !== null && endOdometer <= Number(profile.currentOdometer)) return

    await this.vehicleRepo.updateOdometer(itemId, endOdometer)

    const name = itemName ?? (await this.itemRepo.findById(itemId))?.name ?? ''
    const reminderService = new ReminderService(this.reminderRepo)
    await reminderService.dispatchOdometerTriggers(this.db, itemId, name, endOdometer)
  }

  /**
   * BOAT/BICYCLE/DRONE profile counters, mirroring what syncVehicleOdometer does for VEHICLE but
   * as cumulative accumulators rather than a "current state" value — so create() passes the
   * trip's own full values as the delta, and update() passes (new - old) to avoid double-counting
   * an edited trip. `distanceKm`/`durationMin` here are deltas, not absolute values.
   *
   * engineHours/totalFlightHours are nullable Decimal columns with no DB default (unlike
   * chainKm/totalKm/totalFlights, which default to 0) — a Prisma `{ increment }` on a genuinely
   * NULL value would silently stay NULL (SQL NULL + n = NULL), so those two go through a
   * read-then-write instead of an atomic increment. Fine at this app's single-user scale.
   */
  private async syncTripTypeCounters(
    itemType: ItemType,
    itemId: string,
    delta: { distanceKm: number; durationMin: number; isNewTrip: boolean }
  ): Promise<void> {
    if (itemType === 'BOAT') {
      if (delta.distanceKm === 0) return
      const profile = await this.db.boatProfile.findUnique({ where: { itemId }, select: { engineHours: true } })
      if (!profile) return
      await this.db.boatProfile.update({
        where: { itemId },
        data: { engineHours: Number(profile.engineHours ?? 0) + delta.distanceKm },
      })
      return
    }

    if (itemType === 'BICYCLE') {
      if (delta.distanceKm === 0) return
      await this.db.bicycleProfile.updateMany({
        where: { itemId },
        data: { totalKm: { increment: delta.distanceKm }, chainKm: { increment: delta.distanceKm } },
      })
      return
    }

    if (itemType === 'DRONE') {
      if (delta.isNewTrip) {
        await this.db.droneProfile.updateMany({ where: { itemId }, data: { totalFlights: { increment: 1 } } })
      }
      if (delta.durationMin !== 0) {
        const profile = await this.db.droneProfile.findUnique({ where: { itemId }, select: { totalFlightHours: true } })
        if (profile) {
          await this.db.droneProfile.update({
            where: { itemId },
            data: { totalFlightHours: Number(profile.totalFlightHours ?? 0) + delta.durationMin / 60 },
          })
        }
      }
    }
  }
}
