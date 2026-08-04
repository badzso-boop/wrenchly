import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import { type TripRepository } from './trip.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { type VehicleRepository } from '@/server/domains/vehicle/vehicle.repository'
import { ReminderService } from '@/server/domains/reminder/reminder.service'
import { type ReminderRepository } from '@/server/domains/reminder/reminder.repository'
import { type FuelUpRepository, type FuelUpWithTrips } from '@/server/domains/fuel-up/fuel-up.repository'
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

interface FullTankWindow {
  date: Date
  fuelQty: number
  distanceKm: number
}

// The "full-to-full" method: a full tank is the one reproducible reference level, so whatever
// liters get added between one full tank and the next — a partial top-up's own liters mean
// nothing in isolation, they only become meaningful once pooled up to the next full fill —
// exactly equal what was burned over that same stretch of distance. Walking the fuel-ups in
// date order, each full-tank fill closes out one window (using everything pooled since the
// previous full tank, including its own quantity) and opens the next. The very first full tank
// ever recorded has nothing before it to close, so it only sets the baseline; distance/qty from
// before it (if any) is intentionally dropped, since there's no anchor to measure it against.
function fullTankWindows(fuelUps: FuelUpWithTrips[]): FullTankWindow[] {
  const sorted = [...fuelUps].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
  const windows: FullTankWindow[] = []
  let pendingQty = 0
  let pendingDistance = 0
  let haveAnchor = false

  for (const f of sorted) {
    pendingQty += Number(f.quantity)
    pendingDistance += f.trips.reduce((sum, t) => sum + t.distanceKm, 0)

    if (f.isFullTank) {
      if (haveAnchor && pendingDistance > 0) {
        windows.push({ date: f.occurredAt, fuelQty: pendingQty, distanceKm: pendingDistance })
      }
      pendingQty = 0
      pendingDistance = 0
      haveAnchor = true
    }
  }

  return windows
}

// `distanceKm`/`expenseCost`/`fuelQty`/`fuelCost` here are raw totals (all trips driven, all fuel
// bought, full or partial) — unaffected by the full-to-full method, since "how much did I drive"
// and "how much did I spend" don't need a full-tank anchor to be meaningful. `avgConsumption` is
// the one figure that does — it's derived entirely from `windows` (see fullTankWindows above),
// weighted across every window in the bucket rather than averaging each window's own L/100km,
// so a long low-consumption window doesn't get equal footing with a short high-consumption one.
function aggregate(
  trips: TripLogWithChildren[],
  fuelUps: FuelUpWithTrips[],
  windows: FullTankWindow[],
  itemType: ItemType
): StatsBucket {
  const distanceKm = trips.reduce((sum, t) => sum + t.distanceKm, 0)
  const fuelQty = fuelUps.reduce((sum, f) => sum + Number(f.quantity), 0)
  const fuelCost = fuelUps.reduce((sum, f) => sum + Number(f.totalPaid), 0)
  const expenseCost = trips.reduce((sum, t) => sum + Number(t.totalExpenseCost), 0)
  const elevationGainM = trips.reduce((sum, t) => sum + (t.elevationGainM ?? 0), 0)
  const windowQty = windows.reduce((sum, w) => sum + w.fuelQty, 0)
  const windowDistance = windows.reduce((sum, w) => sum + w.distanceKm, 0)
  const avgConsumption = windowDistance > 0 ? windowQty / consumptionDivisor(itemType, windowDistance) : 0
  return { distanceKm, fuelQty, fuelCost, expenseCost, avgConsumption, elevationGainM }
}

export class TripService {
  constructor(
    private tripRepo: TripRepository,
    private itemRepo: ItemRepository,
    private vehicleRepo: VehicleRepository,
    private reminderRepo: ReminderRepository,
    private fuelUpRepo: FuelUpRepository,
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
      endedAt?: Date | null
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
      endedAt: input.endedAt,
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
      endedAt?: Date | null
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
    const fuelUps = await this.fuelUpRepo.findAllByItemId(itemId, userId)
    // Computed once over the complete, unfiltered fuel-up history — a window's boundaries
    // (which full tank closes it) don't care about an arbitrary bucket cutoff, only about
    // chronological order. Buckets below just filter which already-computed windows count.
    const windows = fullTankWindows(fuelUps)

    const allTime = aggregate(trips, fuelUps, windows, item.type)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30Days = aggregate(
      trips.filter((t) => t.startedAt >= thirtyDaysAgo),
      fuelUps.filter((f) => f.occurredAt >= thirtyDaysAgo),
      windows.filter((w) => w.date >= thirtyDaysAgo),
      item.type
    )

    const monthlyMap = new Map<
      string,
      { distanceKm: number; fuelCost: number; expenseCost: number; durationMin: number; tripCount: number }
    >()
    for (const t of trips) {
      const key = format(t.startedAt, 'yyyy-MM')
      const bucket = monthlyMap.get(key) ?? { distanceKm: 0, fuelCost: 0, expenseCost: 0, durationMin: 0, tripCount: 0 }
      bucket.distanceKm += t.distanceKm
      bucket.expenseCost += Number(t.totalExpenseCost)
      bucket.durationMin += t.durationMin ?? 0
      bucket.tripCount += 1
      monthlyMap.set(key, bucket)
    }
    // Fuel cost is bucketed by FuelUp.occurredAt (the finalized "authoritative date" decision),
    // a separate loop from trips above since a fuel-up's month doesn't have to match any of its
    // linked trips' months.
    for (const f of fuelUps) {
      const key = format(f.occurredAt, 'yyyy-MM')
      const bucket = monthlyMap.get(key) ?? { distanceKm: 0, fuelCost: 0, expenseCost: 0, durationMin: 0, tripCount: 0 }
      bucket.fuelCost += Number(f.totalPaid)
      monthlyMap.set(key, bucket)
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    // One point per full-tank window (see fullTankWindows above) — not per FuelUp anymore. A
    // partial top-up never gets its own point; it just pools into whichever full-tank window
    // closes next.
    const consumptionTrend = windows.map((w) => ({
      date: w.date,
      consumption: w.fuelQty / consumptionDivisor(item.type, w.distanceKm),
    }))

    // BICYCLE: derived average speed per ride (needs both distance and a logged duration).
    const speedTrend = trips
      .filter((t) => t.durationMin != null && t.durationMin > 0 && t.distanceKm > 0)
      .map((t) => ({ date: t.startedAt, speedKmh: t.distanceKm / (t.durationMin! / 60) }))

    // DRONE: battery percent used per flight.
    const batteryTrend = trips
      .filter((t) => t.batteryPercentUsed != null)
      .map((t) => ({ date: t.startedAt, batteryPercentUsed: t.batteryPercentUsed! }))

    // From PR #7: which currencies actually appear across this item's spend (only ever non-empty
    // for VEHICLE/BOAT) — lets the UI show a real currency label, or flag mixed currencies,
    // instead of a bare unlabeled number. Now spans both expenses (per-trip) and fuel-ups
    // (standalone) — fuel-up decoupling fork 1 had temporarily dropped fuel out of this set,
    // this restores it.
    const currencies = Array.from(
      new Set([...trips.flatMap((t) => t.expenses.map((e) => e.currency)), ...fuelUps.map((f) => f.currency)])
    )

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
