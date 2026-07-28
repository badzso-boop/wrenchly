import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { sendReminderEmail } from '@/server/domains/notification/email.service'
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
      data: { lastTriggeredAt: now, nextTriggerAt },
    })
  }

  return NextResponse.json({ processed: dueReminders.length, sent })
}
