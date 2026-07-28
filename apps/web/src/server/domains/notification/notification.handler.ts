import { z } from 'zod'
import { getTranslations } from '@wrenchly/i18n'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { NotificationRepository } from './notification.repository'

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const repo = new NotificationRepository(ctx.db)
      const [notifications, user] = await Promise.all([
        repo.findByUserId(ctx.userId, input.unreadOnly ?? false),
        ctx.db.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { locale: true } }),
      ])
      const t = getTranslations(user.locale)
      return notifications.map((n) => ({
        ...n,
        title: t(n.titleKey),
        body: t(n.bodyKey, (n.bodyParams as Record<string, string | number>) ?? {}),
      }))
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
