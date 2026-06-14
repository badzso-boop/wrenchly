import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { InventoryRepository } from './inventory.repository'

export const inventoryRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    const repo = new InventoryRepository(ctx.db)
    return repo.findAllByUserId(ctx.userId)
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        category: z.string().min(1).max(100),
        brand: z.string().optional(),
        spec: z.string().optional(),
        quantity: z.number().nonnegative(),
        unit: z.string().min(1).max(20),
        location: z.string().optional(),
        minQuantity: z.number().nonnegative().optional(),
        costPerUnit: z.number().nonnegative().optional(),
        expiryDate: z.coerce.date().optional(),
        purchaseDate: z.coerce.date().optional(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const repo = new InventoryRepository(ctx.db)
      return repo.create({ userId: ctx.userId, ...input })
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        category: z.string().min(1).max(100).optional(),
        brand: z.string().nullable().optional(),
        spec: z.string().nullable().optional(),
        quantity: z.number().nonnegative().optional(),
        unit: z.string().min(1).max(20).optional(),
        location: z.string().nullable().optional(),
        minQuantity: z.number().nonnegative().nullable().optional(),
        costPerUnit: z.number().nonnegative().nullable().optional(),
        notes: z.string().max(1000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new InventoryRepository(ctx.db)
      const { id, ...data } = input
      const existing = await repo.findByIdAndUserId(id, ctx.userId)
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.inventory.not_found' })
      return repo.update(id, data)
    }),

  adjustQuantity: protectedProcedure
    .input(z.object({ id: z.string(), delta: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new InventoryRepository(ctx.db)
      const item = await repo.findByIdAndUserId(input.id, ctx.userId)
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.inventory.not_found' })
      const newQty = Math.max(0, Number(item.quantity) + input.delta)
      return repo.update(input.id, { quantity: newQty })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new InventoryRepository(ctx.db)
      const existing = await repo.findByIdAndUserId(input.id, ctx.userId)
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.inventory.not_found' })
      await repo.delete(input.id)
      return { success: true }
    }),
})
