import { NextRequest, NextResponse } from 'next/server'
import { addDays } from 'date-fns'
import { db } from '@/server/db'
import { sendReminderEmail, sendUpcomingReminderEmail } from '@/server/domains/notification/email.service'
import { dispatchAndRecord } from '@/server/domains/notification/dispatch.service'
import { getTranslations } from '@wrenchly/i18n'
import { calculateNextTriggerAfterFiring } from '@/server/domains/reminder/reminder.service'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const dueReminders = await db.reminder.findMany({
    where: {
      isActive: true,
      triggerType: { in: ['DATE', 'INTERVAL_DAYS', 'CRON'] },
      nextTriggerAt: { lte: now },
    },
    include: {
      item: { select: { name: true, userId: true } },
      user: {
        select: {
          id: true,
          email: true,
          locale: true,
          expoPushToken: true,
          notificationPref: true,
        },
      },
    },
  })

  let sent = 0

  for (const reminder of dueReminders) {
    const user = reminder.user
    const t = getTranslations(user.locale)
    const actionUrl = `/items/${reminder.itemId}`

    const { pushed, emailed } = await dispatchAndRecord(db, {
      userId: user.id,
      reminderId: reminder.id,
      expoPushToken: user.expoPushToken,
      pref: user.notificationPref,
      pushTitle: t('notifications.reminder_due.title'),
      pushBody: t('notifications.reminder_due.body', {
        itemName: reminder.item.name,
        reminderTitle: reminder.title,
      }),
      titleKey: 'notifications.reminder_due.title',
      bodyKey: 'notifications.reminder_due.body',
      bodyParams: { itemName: reminder.item.name, reminderTitle: reminder.title },
      actionUrl,
      sendEmail: () =>
        sendReminderEmail({
          to: user.email,
          locale: user.locale,
          itemName: reminder.item.name,
          reminderTitle: reminder.title,
          actionUrl,
        }),
    })
    if (pushed || emailed) sent++

    const nextTriggerAt = await calculateNextTriggerAfterFiring(
      String(reminder.triggerType),
      reminder.triggerConfig as Record<string, unknown>
    )
    await db.reminder.update({
      where: { id: reminder.id },
      data: { lastTriggeredAt: now, nextTriggerAt, advanceNotifiedAt: null },
    })
  }

  // Advance notice: reminders due within the user's advanceDays window, not yet due,
  // not already notified for this cycle.
  const upcomingReminders = await db.reminder.findMany({
    where: {
      isActive: true,
      triggerType: { in: ['DATE', 'INTERVAL_DAYS', 'CRON'] },
      nextTriggerAt: { gt: now },
    },
    include: {
      item: { select: { name: true, userId: true } },
      user: {
        select: {
          id: true,
          email: true,
          locale: true,
          expoPushToken: true,
          notificationPref: true,
        },
      },
    },
  })

  let advanceNoticed = 0

  for (const reminder of upcomingReminders) {
    const user = reminder.user
    const pref = user.notificationPref
    const advanceDays = pref?.advanceDays ?? 3
    if (advanceDays <= 0 || !reminder.nextTriggerAt) continue

    const threshold = addDays(now, advanceDays)
    if (reminder.nextTriggerAt > threshold) continue

    const cycleStart = reminder.lastTriggeredAt ?? reminder.createdAt
    if (reminder.advanceNotifiedAt && reminder.advanceNotifiedAt > cycleStart) continue

    const t = getTranslations(user.locale)
    const actionUrl = `/items/${reminder.itemId}`
    const dueAt = reminder.nextTriggerAt

    const { pushed, emailed } = await dispatchAndRecord(db, {
      userId: user.id,
      reminderId: reminder.id,
      expoPushToken: user.expoPushToken,
      pref,
      pushTitle: t('notifications.reminder_upcoming.title'),
      pushBody: t('notifications.reminder_upcoming.body', {
        itemName: reminder.item.name,
        reminderTitle: reminder.title,
        dueDate: dueAt.toLocaleDateString(user.locale),
      }),
      titleKey: 'notifications.reminder_upcoming.title',
      bodyKey: 'notifications.reminder_upcoming.body',
      bodyParams: {
        itemName: reminder.item.name,
        reminderTitle: reminder.title,
        dueDate: dueAt.toLocaleDateString(user.locale),
      },
      actionUrl,
      sendEmail: () =>
        sendUpcomingReminderEmail({
          to: user.email,
          locale: user.locale,
          itemName: reminder.item.name,
          reminderTitle: reminder.title,
          dueAt,
          actionUrl,
        }),
    })

    if (pushed || emailed) {
      advanceNoticed++
      await db.reminder.update({ where: { id: reminder.id }, data: { advanceNotifiedAt: now } })
    }
  }

  return NextResponse.json({ processed: dueReminders.length, sent, advanceNoticed })
}
