import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { MaintenanceRepository } from './maintenance.repository'
import { MaintenanceService } from './maintenance.service'

const PartInputSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitPrice: z.number().nonnegative().optional(),
})

export const maintenanceRouter = createTRPCRouter({
  listByItemId: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(({ ctx, input }) => {
      const repo = new MaintenanceRepository(ctx.db)
      const service = new MaintenanceService(repo)
      return service.listByItemId(input.itemId, ctx.userId, input.cursor, input.limit)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = new MaintenanceRepository(ctx.db)
      const service = new MaintenanceService(repo)
      return service.getById(input.id, ctx.userId)
    }),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        title: z.string().min(1).max(200),
        category: z.string(),
        performedAt: z.coerce.date(),
        odometerValue: z.number().nonnegative().optional(),
        notes: z.string().max(2000).optional(),
        parts: z.array(PartInputSchema).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const repo = new MaintenanceRepository(ctx.db)
      const service = new MaintenanceService(repo)
      return service.create(ctx.userId, input)
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        category: z.string().optional(),
        performedAt: z.coerce.date().optional(),
        odometerValue: z.number().nonnegative().optional(),
        notes: z.string().max(2000).optional(),
        parts: z.array(PartInputSchema).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input
      const repo = new MaintenanceRepository(ctx.db)
      const service = new MaintenanceService(repo)
      return service.update(id, ctx.userId, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new MaintenanceRepository(ctx.db)
      const service = new MaintenanceService(repo)
      await service.delete(input.id, ctx.userId)
      return { success: true }
    }),

  getTotalCost: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => {
      const repo = new MaintenanceRepository(ctx.db)
      const service = new MaintenanceService(repo)
      return service.getTotalCost(input.itemId)
    }),
})
