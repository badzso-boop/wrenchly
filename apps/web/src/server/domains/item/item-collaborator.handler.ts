import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { ItemCollaboratorRepository } from './item-collaborator.repository'
import { ItemCollaboratorService } from './item-collaborator.service'

export const itemCollaboratorRouter = createTRPCRouter({
  listForItem: protectedProcedure.input(z.object({ itemId: z.string() })).query(({ ctx, input }) => {
    const service = new ItemCollaboratorService(ctx.db, new ItemCollaboratorRepository(ctx.db))
    return service.listForItem(input.itemId, ctx.userId)
  }),

  invite: protectedProcedure
    .input(z.object({ itemId: z.string(), targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new ItemCollaboratorService(ctx.db, new ItemCollaboratorRepository(ctx.db))
      const result = await service.inviteCollaborator(input.itemId, ctx.userId, input.targetUserId)

      const [inviter, item] = await Promise.all([
        ctx.db.user.findUnique({ where: { id: ctx.userId }, select: { name: true } }),
        ctx.db.item.findUnique({ where: { id: input.itemId }, select: { name: true } }),
      ])
      await ctx.db.smartNotification.create({
        data: {
          userId: input.targetUserId,
          channel: 'in_app',
          titleKey: 'notifications.item_collaboration_invite.title',
          bodyKey: 'notifications.item_collaboration_invite.body',
          bodyParams: { name: inviter?.name ?? 'Someone', itemName: item?.name ?? 'an item' },
          actionUrl: `/items/${input.itemId}`,
        },
      })

      return result
    }),

  acceptInvite: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    const service = new ItemCollaboratorService(ctx.db, new ItemCollaboratorRepository(ctx.db))
    return service.acceptInvite(input.id, ctx.userId)
  }),

  declineInvite: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    const service = new ItemCollaboratorService(ctx.db, new ItemCollaboratorRepository(ctx.db))
    return service.declineInvite(input.id, ctx.userId)
  }),

  remove: protectedProcedure
    .input(z.object({ itemId: z.string(), targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new ItemCollaboratorService(ctx.db, new ItemCollaboratorRepository(ctx.db))
      await service.removeCollaborator(input.itemId, ctx.userId, input.targetUserId)
      return { success: true }
    }),
})
