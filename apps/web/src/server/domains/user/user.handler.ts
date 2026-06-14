import { z } from 'zod'
import { randomBytes } from 'crypto'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { UserRepository } from './user.repository'

function generateCalendarToken(): string {
  return randomBytes(32).toString('hex')
}

export const userRouter = createTRPCRouter({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const repo = new UserRepository(ctx.db)
    const user = await repo.findById(ctx.userId)
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.user.not_found' })
    return user
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        locale: z.enum(['en', 'hu']).optional(),
        timezone: z.string().optional(),
        expoPushToken: z.string().nullable().optional(),
        defaultLat: z.number().nullable().optional(),
        defaultLon: z.number().nullable().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const repo = new UserRepository(ctx.db)
      return repo.update(ctx.userId, input)
    }),

  getNotifPref: protectedProcedure.query(({ ctx }) => {
    const repo = new UserRepository(ctx.db)
    return repo.getNotifPref(ctx.userId)
  }),

  getOrCreateCalendarToken: protectedProcedure.query(async ({ ctx }) => {
    const repo = new UserRepository(ctx.db)
    let user = await repo.findById(ctx.userId)
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.user.not_found' })
    if (!user.calendarToken) {
      user = await repo.saveCalendarToken(ctx.userId, generateCalendarToken())
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wrenchly.app'
    return { token: user.calendarToken!, feedUrl: `${baseUrl}/api/calendar/${user.calendarToken}/feed.ics` }
  }),

  regenerateCalendarToken: protectedProcedure.mutation(async ({ ctx }) => {
    const repo = new UserRepository(ctx.db)
    const token = generateCalendarToken()
    await repo.saveCalendarToken(ctx.userId, token)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wrenchly.app'
    return { token, feedUrl: `${baseUrl}/api/calendar/${token}/feed.ics` }
  }),

  upsertNotifPref: protectedProcedure
    .input(
      z.object({
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        quietHoursFrom: z.number().int().min(0).max(23).nullable().optional(),
        quietHoursTo: z.number().int().min(0).max(23).nullable().optional(),
        advanceDays: z.number().int().min(0).max(30).optional(),
        weeklyDigest: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const repo = new UserRepository(ctx.db)
      return repo.upsertNotifPref(ctx.userId, input)
    }),
})
