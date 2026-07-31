import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { TripRepository } from './trip.repository'
import { TripService } from './trip.service'
import { ItemRepository } from '@/server/domains/item/item.repository'
import { VehicleRepository } from '@/server/domains/vehicle/vehicle.repository'
import { ReminderRepository } from '@/server/domains/reminder/reminder.repository'

const FuelStopInputSchema = z.object({
  quantity: z.number().positive(),
  unit: z.enum(['liter', 'kWh']).default('liter'),
  pricePerUnit: z.number().nonnegative(),
  currency: z.string().min(1).max(10).default('HUF'),
  fuelType: z.string().max(50).optional(),
  station: z.string().max(200).optional(),
})

const ExpenseInputSchema = z.object({
  type: z.enum(['TOLL', 'VIGNETTE', 'PARKING', 'OTHER']),
  amount: z.number().nonnegative(),
  currency: z.string().min(1).max(10).default('HUF'),
  description: z.string().max(500).optional(),
})

function buildService(db: import('@prisma/client').PrismaClient) {
  const tripRepo = new TripRepository(db)
  const itemRepo = new ItemRepository(db)
  const vehicleRepo = new VehicleRepository(db)
  const reminderRepo = new ReminderRepository(db)
  return new TripService(tripRepo, itemRepo, vehicleRepo, reminderRepo, db)
}

export const tripRouter = createTRPCRouter({
  listByItemId: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(({ ctx, input }) => {
      const service = buildService(ctx.db)
      return service.listByItemId(input.itemId, ctx.userId, input.cursor, input.limit)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const service = buildService(ctx.db)
      return service.getById(input.id, ctx.userId)
    }),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        startedAt: z.coerce.date(),
        description: z.string().max(500).optional(),
        notes: z.string().max(2000).optional(),
        // Optional: BICYCLE/DRONE have no per-trip "starting reading" concept (see
        // trip.labels.ts's showOdometerFields) and DRONE's distance itself is optional — the
        // service fills sane defaults (start=0, end=distanceKm) when omitted.
        startOdometer: z.number().int().nonnegative().optional(),
        distanceKm: z.number().int().nonnegative().optional(),
        startFuelLiters: z.number().nonnegative().optional(),
        durationMin: z.number().int().positive().optional(),
        elevationGainM: z.number().int().nonnegative().optional(),
        batteryPercentUsed: z.number().int().min(0).max(100).optional(),
        maxAltitudeM: z.number().int().nonnegative().optional(),
        fuelStops: z.array(FuelStopInputSchema).optional(),
        expenses: z.array(ExpenseInputSchema).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const service = buildService(ctx.db)
      return service.create(ctx.userId, input)
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startedAt: z.coerce.date().optional(),
        description: z.string().max(500).optional(),
        notes: z.string().max(2000).optional(),
        startOdometer: z.number().int().nonnegative().optional(),
        distanceKm: z.number().int().nonnegative().optional(),
        startFuelLiters: z.number().nonnegative().optional(),
        durationMin: z.number().int().positive().optional(),
        elevationGainM: z.number().int().nonnegative().optional(),
        batteryPercentUsed: z.number().int().min(0).max(100).optional(),
        maxAltitudeM: z.number().int().nonnegative().optional(),
        fuelStops: z.array(FuelStopInputSchema).optional(),
        expenses: z.array(ExpenseInputSchema).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input
      const service = buildService(ctx.db)
      return service.update(id, ctx.userId, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = buildService(ctx.db)
      await service.delete(input.id, ctx.userId)
      return { success: true }
    }),

  getStatistics: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => {
      const service = buildService(ctx.db)
      return service.getStatistics(input.itemId, ctx.userId)
    }),
})
