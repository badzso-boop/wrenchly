import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { CookingRepository } from './cooking.repository'
import { CookingService } from './cooking.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

function buildService(db: PrismaClient) {
  return new CookingService(new CookingRepository(db), new ItemRepository(db), db)
}

export const cookingRouter = createTRPCRouter({
  listByItemId: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => buildService(ctx.db).listByItemId(input.itemId, ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        name: z.string().min(1).max(200),
        ingredients: z.string().max(2000).optional(),
        servings: z.number().int().positive().optional(),
        daysCovered: z.number().int().positive().optional(),
        cost: z.number().nonnegative().optional(),
        currency: z.string().min(1).max(10).default('HUF'),
        linkedTransactionId: z.string().optional(),
        cookedAt: z.coerce.date(),
        forceNew: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { forceNew, ...rest } = input
      return buildService(ctx.db).create(ctx.userId, rest, forceNew)
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        ingredients: z.string().max(2000).nullable().optional(),
        servings: z.number().int().positive().nullable().optional(),
        daysCovered: z.number().int().positive().nullable().optional(),
        cost: z.number().nonnegative().nullable().optional(),
        currency: z.string().min(1).max(10).optional(),
        linkedTransactionId: z.string().nullable().optional(),
        cookedAt: z.coerce.date().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input
      return buildService(ctx.db).update(id, ctx.userId, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await buildService(ctx.db).delete(input.id, ctx.userId)
      return { success: true }
    }),

  assignShoppingListItems: protectedProcedure
    .input(z.object({ cookingLogEntryId: z.string(), shoppingListItemIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await buildService(ctx.db).assignShoppingListItems(
        input.cookingLogEntryId,
        ctx.userId,
        input.shoppingListItemIds
      )
      return { success: true }
    }),

  createShoppingListItemsForRecipe: protectedProcedure
    .input(z.object({ cookingLogEntryId: z.string(), names: z.array(z.string().min(1).max(200)) }))
    .mutation(({ ctx, input }) =>
      buildService(ctx.db).createShoppingListItemsForRecipe(input.cookingLogEntryId, ctx.userId, input.names)
    ),
})
