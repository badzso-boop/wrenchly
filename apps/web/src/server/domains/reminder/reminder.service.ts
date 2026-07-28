import { TRPCError } from '@trpc/server'
import { addDays } from 'date-fns'
import { type ReminderRepository } from './reminder.repository'
import { type Reminder, type PrismaClient } from '@prisma/client'
import { getTranslations } from '@wrenchly/i18n'
import { dispatchAndRecord } from '@/server/domains/notification/dispatch.service'
import { sendReminderEmail } from '@/server/domains/notification/email.service'

// Lazy import to avoid issues in test environment
async function parseCron(expression: string): Promise<Date | null> {
  try {
    const { default: cronParser } = await import('cron-parser')
    const interval = cronParser.parseExpression(expression, { utc: true })
    return interval.next().toDate()
  } catch {
    return null
  }
}

export function calculateNextTrigger(
  triggerType: string,
  triggerConfig: Record<string, unknown>
): Promise<Date | null> | Date | null {
  switch (triggerType) {
    case 'DATE': {
      const date = triggerConfig['date']
      if (typeof date === 'string') return new Date(date)
      return null
    }
    case 'INTERVAL_DAYS': {
      const days = triggerConfig['days']
      const lastDoneAt = triggerConfig['last_done_at']
      if (typeof days !== 'number') return null
      const base = typeof lastDoneAt === 'string' ? new Date(lastDoneAt) : new Date()
      return addDays(base, days)
    }
    case 'CRON': {
      const expression = triggerConfig['expression']
      if (typeof expression !== 'string') return null
      return parseCron(expression)
    }
    case 'ODOMETER':
    case 'WEATHER':
      return null
    default:
      return null
  }
}

// A DATE reminder is one-shot — recalculating from the same fixed date after it has already
// fired would always land back in the past and re-fire on every cron run. INTERVAL_DAYS/CRON
// are recurring, so they still recompute their next occurrence normally.
export async function calculateNextTriggerAfterFiring(
  triggerType: string,
  triggerConfig: Record<string, unknown>
): Promise<Date | null> {
  if (triggerType === 'DATE') return null
  return Promise.resolve(calculateNextTrigger(triggerType, triggerConfig))
}

export class ReminderService {
  constructor(private reminderRepo: ReminderRepository) {}

  async list(userId: string) {
    return this.reminderRepo.findActiveByUserId(userId)
  }

  async getByItemId(itemId: string, userId: string): Promise<Reminder[]> {
    return this.reminderRepo.findByItemId(itemId, userId)
  }

  async getById(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.reminderRepo.findByIdAndUserId(id, userId)
    if (!reminder) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.reminder.not_found' })
    return reminder
  }

  async create(
    userId: string,
    input: {
      itemId: string
      title: string
      triggerType: string
      triggerConfig: Record<string, unknown>
    }
  ): Promise<Reminder> {
    const nextTriggerAt = await Promise.resolve(
      calculateNextTrigger(input.triggerType, input.triggerConfig)
    )
    return this.reminderRepo.create({ userId, ...input, nextTriggerAt })
  }

  async update(
    id: string,
    userId: string,
    input: {
      title?: string
      isActive?: boolean
      triggerType?: string
      triggerConfig?: Record<string, unknown>
    }
  ): Promise<Reminder> {
    const reminder = await this.reminderRepo.findByIdAndUserId(id, userId)
    if (!reminder) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.reminder.not_found' })

    const type = input.triggerType ?? String(reminder.triggerType)
    const config = input.triggerConfig ?? (reminder.triggerConfig as Record<string, unknown>)
    const nextTriggerAt = await Promise.resolve(calculateNextTrigger(type, config))

    return this.reminderRepo.update(id, { ...input, nextTriggerAt })
  }

  async delete(id: string, userId: string): Promise<void> {
    const reminder = await this.reminderRepo.findByIdAndUserId(id, userId)
    if (!reminder) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.reminder.not_found' })
    await this.reminderRepo.delete(id)
  }

  async markTriggered(id: string): Promise<void> {
    const reminder = await this.reminderRepo.findById(id)
    if (!reminder) return

    const nextTriggerAt = await calculateNextTriggerAfterFiring(
      String(reminder.triggerType),
      reminder.triggerConfig as Record<string, unknown>
    )

    await this.reminderRepo.update(id, {
      lastTriggeredAt: new Date(),
      nextTriggerAt,
    })
  }

  async evaluateOdometerTriggers(itemId: string, currentKm: number): Promise<Reminder[]> {
    const reminders = await this.reminderRepo.findOdometerByItemId(itemId)
    const triggered: Reminder[] = []

    for (const reminder of reminders) {
      const config = reminder.triggerConfig as Record<string, unknown>
      const everyKm = config['every_km']
      const lastDoneAtKm = config['last_done_at_km']

      if (typeof everyKm !== 'number') continue
      const base = typeof lastDoneAtKm === 'number' ? lastDoneAtKm : 0
      const nextKm = base + everyKm

      if (currentKm >= nextKm) {
        triggered.push(reminder)
      }
    }

    return triggered
  }

  async dispatchOdometerTriggers(
    db: PrismaClient,
    itemId: string,
    itemName: string,
    currentKm: number
  ): Promise<number> {
    const reminders = await this.reminderRepo.findOdometerByItemIdWithUser(itemId)
    let notified = 0

    for (const reminder of reminders) {
      const config = reminder.triggerConfig as Record<string, unknown>
      const everyKm = config['every_km']
      const lastDoneAtKm = config['last_done_at_km']
      if (typeof everyKm !== 'number') continue

      const base = typeof lastDoneAtKm === 'number' ? lastDoneAtKm : 0
      const nextKm = base + everyKm
      if (currentKm < nextKm) continue

      const user = reminder.user
      const t = getTranslations(user.locale)
      const actionUrl = `/items/${itemId}`

      const { pushed, emailed } = await dispatchAndRecord(db, {
        userId: user.id,
        reminderId: reminder.id,
        expoPushToken: user.expoPushToken,
        pref: user.notificationPref,
        pushTitle: t('notifications.reminder_due.title'),
        pushBody: t('notifications.reminder_due.body', {
          itemName,
          reminderTitle: reminder.title,
        }),
        titleKey: 'notifications.reminder_due.title',
        bodyKey: 'notifications.reminder_due.body',
        bodyParams: { itemName, reminderTitle: reminder.title },
        actionUrl,
        sendEmail: () =>
          sendReminderEmail({
            to: user.email,
            locale: user.locale,
            itemName,
            reminderTitle: reminder.title,
            actionUrl,
          }),
      })

      if (pushed || emailed) notified++

      await this.reminderRepo.update(reminder.id, {
        lastTriggeredAt: new Date(),
        triggerConfig: { ...config, last_done_at_km: currentKm },
      })
    }

    return notified
  }
}
