import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { PrintJobRepository } from './printjob.repository'
import { PrintJobService } from './printjob.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

function buildService(db: import('@prisma/client').PrismaClient) {
  return new PrintJobService(new PrintJobRepository(db), new ItemRepository(db), db)
}

export const printJobRouter = createTRPCRouter({
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
        durationMin: z.number().int().positive().optional(),
        filamentGrams: z.number().int().nonnegative(),
        materialType: z.string().min(1).max(50),
        success: z.boolean().default(true),
        notes: z.string().max(2000).optional(),
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
        durationMin: z.number().int().positive().optional(),
        filamentGrams: z.number().int().nonnegative().optional(),
        materialType: z.string().min(1).max(50).optional(),
        success: z.boolean().optional(),
        notes: z.string().max(2000).optional(),
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
