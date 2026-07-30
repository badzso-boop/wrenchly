import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { VehicleRepository } from './vehicle.repository'
import { VehicleService } from './vehicle.service'
import { ItemRepository } from '@/server/domains/item/item.repository'
import { ReminderRepository } from '@/server/domains/reminder/reminder.repository'

export const vehicleRouter = createTRPCRouter({
  getByItemId: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => {
      const vehicleRepo = new VehicleRepository(ctx.db)
      const itemRepo = new ItemRepository(ctx.db)
      const reminderRepo = new ReminderRepository(ctx.db)
      const service = new VehicleService(vehicleRepo, itemRepo, reminderRepo, ctx.db)
      return service.getByItemId(input.itemId, ctx.userId)
    }),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        make: z.string().min(1).max(100),
        model: z.string().min(1).max(100),
        year: z.number().int().min(1886).max(2100).optional(),
        vin: z.string().length(17).optional(),
        fuelType: z.string().optional(),
        engineDisplacement: z.number().int().nonnegative().optional(),
        currentOdometer: z.number().nonnegative().optional(),
        licensePlate: z.string().max(20).optional(),
        color: z.string().max(50).optional(),
        fuelTankLiters: z.number().int().positive().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const vehicleRepo = new VehicleRepository(ctx.db)
      const itemRepo = new ItemRepository(ctx.db)
      const reminderRepo = new ReminderRepository(ctx.db)
      const service = new VehicleService(vehicleRepo, itemRepo, reminderRepo, ctx.db)
      return service.create(ctx.userId, input)
    }),

  update: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        make: z.string().min(1).max(100).optional(),
        model: z.string().min(1).max(100).optional(),
        year: z.number().int().min(1886).max(2100).optional(),
        vin: z.string().length(17).optional(),
        fuelType: z.string().optional(),
        engineDisplacement: z.number().int().nonnegative().optional(),
        licensePlate: z.string().max(20).optional(),
        color: z.string().max(50).optional(),
        fuelTankLiters: z.number().int().positive().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { itemId, ...data } = input
      const vehicleRepo = new VehicleRepository(ctx.db)
      const itemRepo = new ItemRepository(ctx.db)
      const reminderRepo = new ReminderRepository(ctx.db)
      const service = new VehicleService(vehicleRepo, itemRepo, reminderRepo, ctx.db)
      return service.update(itemId, ctx.userId, data)
    }),

  updateOdometer: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        odometer: z.number().nonnegative(),
      })
    )
    .mutation(({ ctx, input }) => {
      const vehicleRepo = new VehicleRepository(ctx.db)
      const itemRepo = new ItemRepository(ctx.db)
      const reminderRepo = new ReminderRepository(ctx.db)
      const service = new VehicleService(vehicleRepo, itemRepo, reminderRepo, ctx.db)
      return service.updateOdometer(input.itemId, ctx.userId, input.odometer)
    }),
})
