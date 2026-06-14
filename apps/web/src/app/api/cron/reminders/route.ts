import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { sendPushNotifications } from '@/server/domains/notification/push.service'
import { sendReminderEmail } from '@/server/domains/notification/email.service'
import { getTranslations } from '@wrenchly/i18n'
import { calculateNextTrigger } from '@/server/domains/reminder/reminder.service'

function isInQuietHours(from: number | null, to: number | null): boolean {
  if (from === null || to === null) return false
  const hour = new Date().getUTCHours()
  if (from <= to) return hour >= from && hour < to
  return hour >= from || hour < to
}

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
    const pref = user.notificationPref
    const t = getTranslations(user.locale)

    if (pref && isInQuietHours(pref.quietHoursFrom, pref.quietHoursTo)) continue

    // Push notification
    if (user.expoPushToken && (!pref || pref.pushEnabled)) {
      await sendPushNotifications([
        {
          to: user.expoPushToken,
          title: t('notifications.reminder_due.title'),
          body: t('notifications.reminder_due.body', {
            itemName: reminder.item.name,
            reminderTitle: reminder.title,
          }),
          data: { actionUrl: `/items/${reminder.itemId}` },
        },
      ])
      sent++
    }

    // Email notification
    if (pref?.emailEnabled) {
      await sendReminderEmail({
        to: user.email,
        locale: user.locale,
        itemName: reminder.item.name,
        reminderTitle: reminder.title,
        actionUrl: `/items/${reminder.itemId}`,
      })
    }

    // Store notification record (keys, not translated text)
    await db.smartNotification.create({
      data: {
        userId: user.id,
        reminderId: reminder.id,
        channel: 'push',
        titleKey: 'notifications.reminder_due.title',
        bodyKey: 'notifications.reminder_due.body',
        bodyParams: { itemName: reminder.item.name, reminderTitle: reminder.title },
        actionUrl: `/items/${reminder.itemId}`,
      },
    })

    // Advance to next trigger
    const nextTriggerAt = await Promise.resolve(
      calculateNextTrigger(String(reminder.triggerType), reminder.triggerConfig as Record<string, unknown>)
    )
    await db.reminder.update({
      where: { id: reminder.id },
      data: { lastTriggeredAt: now, nextTriggerAt },
    })
  }

  return NextResponse.json({ processed: dueReminders.length, sent })
}
