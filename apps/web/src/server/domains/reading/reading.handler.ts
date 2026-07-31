import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { ReadingRepository } from './reading.repository'
import { ReadingService } from './reading.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

function buildService(db: import('@prisma/client').PrismaClient) {
  return new ReadingService(new ReadingRepository(db), new ItemRepository(db))
}

export const readingRouter = createTRPCRouter({
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
        recordedAt: z.coerce.date(),
        metrics: z.record(z.string(), z.number()),
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
        recordedAt: z.coerce.date().optional(),
        metrics: z.record(z.string(), z.number()).optional(),
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
