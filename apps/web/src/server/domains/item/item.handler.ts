import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { ItemRepository } from './item.repository'
import { ItemService } from './item.service'
import { ItemStatus, ItemType } from '@prisma/client'

export const itemRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ status: z.nativeEnum(ItemStatus).optional() }))
    .query(({ ctx, input }) => {
      const repo = new ItemRepository(ctx.db)
      const service = new ItemService(repo)
      return service.list(ctx.userId, input.status)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = new ItemRepository(ctx.db)
      const service = new ItemService(repo)
      return service.getById(input.id, ctx.userId)
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        type: z.nativeEnum(ItemType),
        subtype: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        purchaseDate: z.coerce.date().optional(),
        purchasePrice: z.number().nonnegative().optional(),
        description: z.string().max(2000).optional(),
        coverPhotoUrl: z.string().url().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const repo = new ItemRepository(ctx.db)
      const service = new ItemService(repo)
      return service.create(ctx.userId, input)
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        subtype: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        purchaseDate: z.coerce.date().optional(),
        purchasePrice: z.number().nonnegative().optional(),
        description: z.string().max(2000).optional(),
        status: z.nativeEnum(ItemStatus).optional(),
        coverPhotoUrl: z.string().url().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input
      const repo = new ItemRepository(ctx.db)
      const service = new ItemService(repo)
      return service.update(id, ctx.userId, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new ItemRepository(ctx.db)
      const service = new ItemService(repo)
      await service.delete(input.id, ctx.userId)
      return { success: true }
    }),
})
