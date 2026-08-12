import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { FriendRepository } from './friend.repository'
import { FriendService } from './friend.service'

const SendRequestInput = z.union([
  z.object({ addresseeId: z.string() }),
  z.object({ addresseeUsername: z.string().min(1) }),
])

export const friendRouter = createTRPCRouter({
  search: protectedProcedure.input(z.object({ query: z.string() })).query(({ ctx, input }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.search(input.query, ctx.userId)
  }),

  sendRequest: protectedProcedure.input(SendRequestInput).mutation(async ({ ctx, input }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)

    let addresseeId: string
    if ('addresseeId' in input) {
      addresseeId = input.addresseeId
    } else {
      const user = await ctx.db.user.findUnique({
        where: { username: input.addresseeUsername.toLowerCase() },
        select: { id: true },
      })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.friend.user_not_found' })
      addresseeId = user.id
    }

    return service.sendRequest(ctx.userId, addresseeId)
  }),

  accept: protectedProcedure.input(z.object({ requestId: z.string() })).mutation(({ ctx, input }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.accept(input.requestId, ctx.userId)
  }),

  decline: protectedProcedure.input(z.object({ requestId: z.string() })).mutation(({ ctx, input }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.decline(input.requestId, ctx.userId)
  }),

  cancel: protectedProcedure.input(z.object({ requestId: z.string() })).mutation(({ ctx, input }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.cancel(input.requestId, ctx.userId)
  }),

  remove: protectedProcedure.input(z.object({ friendUserId: z.string() })).mutation(async ({ ctx, input }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    await service.remove(ctx.userId, input.friendUserId)
    return { success: true }
  }),

  listFriends: protectedProcedure.query(({ ctx }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.listFriends(ctx.userId)
  }),

  listPendingReceived: protectedProcedure.query(({ ctx }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.listPendingReceived(ctx.userId)
  }),

  listPendingSent: protectedProcedure.query(({ ctx }) => {
    const repo = new FriendRepository(ctx.db)
    const service = new FriendService(repo)
    return service.listPendingSent(ctx.userId)
  }),
})
