import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { ProfileRepository } from './profile.repository'
import { ProfileService } from './profile.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

export const profileRouter = createTRPCRouter({
  getByItemId: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => {
      const profileRepo = new ProfileRepository(ctx.db)
      const itemRepo = new ItemRepository(ctx.db)
      const service = new ProfileService(profileRepo, itemRepo)
      return service.getByItemId(input.itemId, ctx.userId)
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        data: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(({ ctx, input }) => {
      const profileRepo = new ProfileRepository(ctx.db)
      const itemRepo = new ItemRepository(ctx.db)
      const service = new ProfileService(profileRepo, itemRepo)
      return service.upsert(input.itemId, ctx.userId, input.data)
    }),
})
