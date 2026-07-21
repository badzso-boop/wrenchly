import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { ReminderRepository } from './reminder.repository'
import { ReminderService } from './reminder.service'

const TriggerConfigSchema = z.record(z.unknown())

export const reminderRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    const repo = new ReminderRepository(ctx.db)
    const service = new ReminderService(repo)
    return service.list(ctx.userId)
  }),

  getByItemId: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => {
      const repo = new ReminderRepository(ctx.db)
      const service = new ReminderService(repo)
      return service.getByItemId(input.itemId, ctx.userId)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = new ReminderRepository(ctx.db)
      const service = new ReminderService(repo)
      return service.getById(input.id, ctx.userId)
    }),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        title: z.string().min(1).max(200),
        triggerType: z.enum(['DATE', 'INTERVAL_DAYS', 'ODOMETER', 'CRON', 'WEATHER']),
        triggerConfig: TriggerConfigSchema,
      })
    )
    .mutation(({ ctx, input }) => {
      const repo = new ReminderRepository(ctx.db)
      const service = new ReminderService(repo)
      return service.create(ctx.userId, input)
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        isActive: z.boolean().optional(),
        triggerType: z.enum(['DATE', 'INTERVAL_DAYS', 'ODOMETER', 'CRON', 'WEATHER']).optional(),
        triggerConfig: TriggerConfigSchema.optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input
      const repo = new ReminderRepository(ctx.db)
      const service = new ReminderService(repo)
      return service.update(id, ctx.userId, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new ReminderRepository(ctx.db)
      const service = new ReminderService(repo)
      await service.delete(input.id, ctx.userId)
      return { success: true }
    }),
})
