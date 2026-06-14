import { z } from 'zod'

export const TriggerTypeSchema = z.enum([
  'DATE', 'INTERVAL_DAYS', 'ODOMETER', 'CRON', 'WEATHER', 'COMPOUND',
])

export const TriggerConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('DATE'),
    date: z.string().datetime(),
  }),
  z.object({
    type: z.literal('INTERVAL_DAYS'),
    days: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('ODOMETER'),
    every_km: z.number().int().positive(),
    last_done_at_km: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('CRON'),
    expression: z.string().min(1),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal('WEATHER'),
    condition: z.enum(['temp_above', 'frost_warning', 'no_rain_48h', 'last_frost_passed']),
    value: z.number().optional(),
    days: z.number().int().positive().optional(),
  }),
])

export const CreateReminderSchema = z.object({
  itemId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  triggerType: TriggerTypeSchema,
  triggerConfig: TriggerConfigSchema,
  notifyChannels: z.array(z.enum(['push', 'email'])).default(['push']),
})

export const UpdateReminderSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  triggerType: TriggerTypeSchema.optional(),
  triggerConfig: TriggerConfigSchema.optional(),
  isActive: z.boolean().optional(),
  notifyChannels: z.array(z.enum(['push', 'email'])).optional(),
  snoozeUntil: z.coerce.date().nullable().optional(),
})

export const ListRemindersSchema = z.object({
  itemId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
})

export const GetReminderSchema = z.object({
  id: z.string().cuid(),
})

export const DeleteReminderSchema = z.object({
  id: z.string().cuid(),
})

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>
