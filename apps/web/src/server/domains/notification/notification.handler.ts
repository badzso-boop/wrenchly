import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { NotificationRepository } from './notification.repository'

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }))
    .query(({ ctx, input }) => {
      const repo = new NotificationRepository(ctx.db)
      return repo.findByUserId(ctx.userId, input.unreadOnly ?? false)
    }),

  countUnread: protectedProcedure.query(({ ctx }) => {
    const repo = new NotificationRepository(ctx.db)
    return repo.countUnread(ctx.userId)
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const repo = new NotificationRepository(ctx.db)
      return repo.markRead(input.id, ctx.userId)
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const repo = new NotificationRepository(ctx.db)
    await repo.markAllRead(ctx.userId)
    return { success: true }
  }),
})
