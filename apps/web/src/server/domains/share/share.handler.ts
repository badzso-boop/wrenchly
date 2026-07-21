import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { ShareRepository } from './share.repository'
import { ShareService } from './share.service'
import { ItemRepository } from '@/server/domains/item/item.repository'
import { MaintenanceRepository } from '@/server/domains/maintenance/maintenance.repository'

export const shareRouter = createTRPCRouter({
  listMine: protectedProcedure.query(({ ctx }) => {
    const service = new ShareService(
      new ShareRepository(ctx.db),
      new ItemRepository(ctx.db),
      new MaintenanceRepository(ctx.db)
    )
    return service.listMine(ctx.userId)
  }),

  create: protectedProcedure
    .input(z.object({ itemId: z.string(), expiresInDays: z.number().int().positive().optional() }))
    .mutation(({ ctx, input }) => {
      const service = new ShareService(
        new ShareRepository(ctx.db),
        new ItemRepository(ctx.db),
        new MaintenanceRepository(ctx.db)
      )
      return service.create(input.itemId, ctx.userId, input.expiresInDays)
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new ShareService(
        new ShareRepository(ctx.db),
        new ItemRepository(ctx.db),
        new MaintenanceRepository(ctx.db)
      )
      await service.revoke(input.id, ctx.userId)
      return { success: true }
    }),
})
