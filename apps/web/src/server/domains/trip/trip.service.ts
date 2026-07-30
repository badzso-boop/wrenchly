import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import { type TripRepository } from './trip.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { type VehicleRepository } from '@/server/domains/vehicle/vehicle.repository'
import { ReminderService } from '@/server/domains/reminder/reminder.service'
import { type ReminderRepository } from '@/server/domains/reminder/reminder.repository'
import { type PrismaClient, type TripLog, type TripFuelStop, type TripExpense, type TripExpenseType } from '@prisma/client'

type TripLogWithChildren = TripLog & { fuelStops: TripFuelStop[]; expenses: TripExpense[] }

interface FuelStopInput {
  quantity: number
  unit: string
  pricePerUnit: number
  currency: string
  fuelType?: string | null
  station?: string | null
}

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
}

function calculateFuelTotals(fuelStops: FuelStopInput[]) {
  const withTotals = fuelStops.map((f) => ({ ...f, totalPaid: f.quantity * f.pricePerUnit }))
  const totalFuelQty = withTotals.reduce((sum, f) => sum + f.quantity, 0)
  const totalFuelCost = withTotals.reduce((sum, f) => sum + f.totalPaid, 0)
  return { withTotals, totalFuelQty, totalFuelCost }
}

function calculateExpenseTotal(expenses: ExpenseInput[]) {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

function aggregate(trips: TripLogWithChildren[]): StatsBucket {
  const distanceKm = trips.reduce((sum, t) => sum + t.distanceKm, 0)
  const fuelQty = trips.reduce((sum, t) => sum + Number(t.totalFuelQty), 0)
  const fuelCost = trips.reduce((sum, t) => sum + Number(t.totalFuelCost), 0)
  const expenseCost = trips.reduce((sum, t) => sum + Number(t.totalExpenseCost), 0)
  const avgConsumption = distanceKm > 0 && fuelQty > 0 ? fuelQty / (distanceKm / 100) : 0
  return { distanceKm, fuelQty, fuelCost, expenseCost, avgConsumption }
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
      startOdometer: number
      distanceKm: number
      startFuelLiters?: number | null
      fuelStops?: FuelStopInput[]
      expenses?: ExpenseInput[]
    }
  ): Promise<TripLogWithChildren> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const endOdometer = input.startOdometer + input.distanceKm
    const { withTotals: fuelStops, totalFuelQty, totalFuelCost } = calculateFuelTotals(input.fuelStops ?? [])
    const expenses = input.expenses ?? []
    const totalExpenseCost = calculateExpenseTotal(expenses)

    const trip = await this.tripRepo.create({
      userId,
      itemId: input.itemId,
      startedAt: input.startedAt,
      description: input.description,
      notes: input.notes,
      startOdometer: input.startOdometer,
      distanceKm: input.distanceKm,
      endOdometer,
      startFuelLiters: input.startFuelLiters,
      totalFuelQty,
      totalFuelCost,
      totalExpenseCost,
      fuelStops,
      expenses,
    })

    await this.syncVehicleOdometer(input.itemId, item.name, endOdometer)

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
      fuelStops?: FuelStopInput[]
      expenses?: ExpenseInput[]
    }
  ): Promise<TripLogWithChildren> {
    const existing = await this.tripRepo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.trip.not_found' })

    const startOdometer = input.startOdometer ?? existing.startOdometer
    const distanceKm = input.distanceKm ?? existing.distanceKm
    const endOdometer = startOdometer + distanceKm

    const { fuelStops, expenses, ...rest } = input
    const data: Parameters<TripRepository['update']>[1] = {
      ...rest,
      startOdometer,
      distanceKm,
      endOdometer,
    }

    if (fuelStops) {
      const totals = calculateFuelTotals(fuelStops)
      data.fuelStops = totals.withTotals
      data.totalFuelQty = totals.totalFuelQty
      data.totalFuelCost = totals.totalFuelCost
    }
    if (expenses) {
      data.expenses = expenses
      data.totalExpenseCost = calculateExpenseTotal(expenses)
    }

    const trip = await this.tripRepo.update(id, data)

    await this.syncVehicleOdometer(existing.itemId, undefined, endOdometer)

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

    const allTime = aggregate(trips)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30Days = aggregate(trips.filter((t) => t.startedAt >= thirtyDaysAgo))

    const monthlyMap = new Map<string, { distanceKm: number; fuelCost: number; expenseCost: number }>()
    for (const t of trips) {
      const key = format(t.startedAt, 'yyyy-MM')
      const bucket = monthlyMap.get(key) ?? { distanceKm: 0, fuelCost: 0, expenseCost: 0 }
      bucket.distanceKm += t.distanceKm
      bucket.fuelCost += Number(t.totalFuelCost)
      bucket.expenseCost += Number(t.totalExpenseCost)
      monthlyMap.set(key, bucket)
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    const consumptionTrend = trips
      .filter((t) => Number(t.totalFuelQty) > 0 && t.distanceKm > 0)
      .map((t) => ({
        date: t.startedAt,
        consumption: Number(t.totalFuelQty) / (t.distanceKm / 100),
      }))

    const currencies = Array.from(
      new Set(trips.flatMap((t) => [...t.fuelStops.map((f) => f.currency), ...t.expenses.map((e) => e.currency)]))
    )

    return { allTime, last30Days, monthly, consumptionTrend, tripCount: trips.length, currencies }
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
}
