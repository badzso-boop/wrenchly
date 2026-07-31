import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { FavoriteMealRepository } from './favorite-meal.repository'
import { FavoriteMealService } from './favorite-meal.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

function buildService(db: PrismaClient) {
  return new FavoriteMealService(new FavoriteMealRepository(db), new ItemRepository(db), db)
}

export const favoriteMealRouter = createTRPCRouter({
  listByItemId: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => buildService(ctx.db).listByItemId(input.itemId, ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        name: z.string().min(1).max(200),
        notes: z.string().max(1000).optional(),
        forceNew: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { forceNew, ...rest } = input
      return buildService(ctx.db).create(ctx.userId, rest, forceNew)
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(200).optional(), notes: z.string().max(1000).nullable().optional() }))
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
})
