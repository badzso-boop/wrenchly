import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { HouseholdFinanceRepository } from './household-finance.repository'
import { HouseholdFinanceService } from './household-finance.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

function buildService(db: PrismaClient) {
  const repo = new HouseholdFinanceRepository(db)
  const itemRepo = new ItemRepository(db)
  return new HouseholdFinanceService(db, repo, itemRepo)
}

const TransactionTypeSchema = z.enum(['EXPENSE', 'INCOME'])

export const householdFinanceRouter = createTRPCRouter({
  listByItemId: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
        type: TransactionTypeSchema.optional(),
      })
    )
    .query(({ ctx, input }) => {
      const service = buildService(ctx.db)
      return service.listByItemId(input.itemId, ctx.userId, { month: input.month, type: input.type })
    }),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        type: TransactionTypeSchema,
        amount: z.number().positive(),
        currency: z.string().min(1).max(10).default('HUF'),
        category: z.string().max(50).optional(),
        paidByUserId: z.string().min(1),
        store: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
        occurredAt: z.coerce.date(),
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
        type: TransactionTypeSchema.optional(),
        amount: z.number().positive().optional(),
        currency: z.string().min(1).max(10).optional(),
        category: z.string().max(50).nullable().optional(),
        paidByUserId: z.string().min(1).optional(),
        store: z.string().max(200).nullable().optional(),
        description: z.string().max(500).nullable().optional(),
        occurredAt: z.coerce.date().optional(),
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
