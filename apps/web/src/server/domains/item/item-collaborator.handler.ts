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
    .mutation(({ ctx, input }) => {
      const service = new ItemCollaboratorService(ctx.db, new ItemCollaboratorRepository(ctx.db))
      return service.inviteCollaborator(input.itemId, ctx.userId, input.targetUserId)
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
