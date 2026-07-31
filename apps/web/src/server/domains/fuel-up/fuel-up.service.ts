import { TRPCError } from '@trpc/server'
import type { ItemRepository } from '@/server/domains/item/item.repository'
import type { FuelUpRepository, FuelUpWithTrips } from './fuel-up.repository'

interface FuelUpCreateInput {
  itemId: string
  occurredAt: Date
  quantity: number
  unit?: string
  pricePerUnit: number
  currency?: string
  fuelType?: string | null
  station?: string | null
  notes?: string | null
  tripIds?: string[]
}

interface FuelUpUpdateInput {
  occurredAt?: Date
  quantity?: number
  unit?: string
  pricePerUnit?: number
  currency?: string
  fuelType?: string | null
  station?: string | null
  notes?: string | null
  tripIds?: string[]
}

// Only VEHICLE/BOAT track fuel (trip.labels.ts's showFuelSection) — BICYCLE/DRONE have no fuel
// concept at all.
const FUEL_TRACKED_TYPES = new Set(['VEHICLE', 'BOAT'])

export class FuelUpService {
  constructor(
    private repo: FuelUpRepository,
    private itemRepo: ItemRepository
  ) {}

  async create(userId: string, input: FuelUpCreateInput): Promise<FuelUpWithTrips> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    if (!FUEL_TRACKED_TYPES.has(item.type)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.fuelUp.unsupported_item_type' })
    }
    if (input.tripIds?.length) await this.assertTripsBelongToItem(input.tripIds, input.itemId, userId)

    const quantity = input.quantity
    const pricePerUnit = input.pricePerUnit
    return this.repo.create({
      itemId: input.itemId,
      userId,
      occurredAt: input.occurredAt,
      quantity,
      unit: input.unit ?? 'liter',
      pricePerUnit,
      totalPaid: quantity * pricePerUnit,
      currency: input.currency ?? 'HUF',
      fuelType: input.fuelType,
      station: input.station,
      notes: input.notes,
      tripIds: input.tripIds,
    })
  }

  async update(id: string, userId: string, input: FuelUpUpdateInput): Promise<FuelUpWithTrips> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.fuelUp.not_found' })
    if (input.tripIds) await this.assertTripsBelongToItem(input.tripIds, existing.itemId, userId)

    const quantity = input.quantity ?? Number(existing.quantity)
    const pricePerUnit = input.pricePerUnit ?? Number(existing.pricePerUnit)
    const recomputeTotalPaid = input.quantity !== undefined || input.pricePerUnit !== undefined

    return this.repo.update(id, {
      occurredAt: input.occurredAt,
      quantity: input.quantity,
      unit: input.unit,
      pricePerUnit: input.pricePerUnit,
      totalPaid: recomputeTotalPaid ? quantity * pricePerUnit : undefined,
      currency: input.currency,
      fuelType: input.fuelType,
      station: input.station,
      notes: input.notes,
      tripIds: input.tripIds,
    })
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.fuelUp.not_found' })
    await this.repo.delete(id)
  }

  async listByItemId(itemId: string, userId: string): Promise<FuelUpWithTrips[]> {
    return this.repo.listByItemId(itemId, userId)
  }

  // Every trip for the item, each annotated with which fuel-up(s) already cover it — the
  // multi-select assignment UI shows all of them (not just unassigned ones), since the
  // relationship is N-N: a trip can belong to more than one fuel-up.
  async listAssignableTrips(itemId: string, userId: string) {
    return this.repo.listTripsForItem(itemId, userId)
  }

  private async assertTripsBelongToItem(tripIds: string[], itemId: string, userId: string): Promise<void> {
    const trips = await this.repo.listTripsForItem(itemId, userId)
    const validIds = new Set(trips.map((t) => t.id))
    const invalid = tripIds.filter((id) => !validIds.has(id))
    if (invalid.length > 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.fuelUp.invalid_trip_assignment' })
    }
  }
}
