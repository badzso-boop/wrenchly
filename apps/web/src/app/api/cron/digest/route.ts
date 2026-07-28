import { NextRequest, NextResponse } from 'next/server'
import { addDays } from 'date-fns'
import { db } from '@/server/db'
import { sendWeeklyDigestEmail } from '@/server/domains/notification/email.service'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekAhead = addDays(now, 7)

  const users = await db.user.findMany({
    where: {
      notificationPref: { weeklyDigest: true, emailEnabled: true },
    },
    select: { id: true, email: true, locale: true },
  })

  let sent = 0

  for (const user of users) {
    const reminders = await db.reminder.findMany({
      where: {
        userId: user.id,
        isActive: true,
        nextTriggerAt: { gte: now, lte: weekAhead },
      },
      include: { item: { select: { name: true } } },
      orderBy: { nextTriggerAt: 'asc' },
    })
    if (reminders.length === 0) continue

    await sendWeeklyDigestEmail({
      to: user.email,
      locale: user.locale,
      items: reminders
        .filter((r) => r.nextTriggerAt !== null)
        .map((r) => ({
          itemName: r.item.name,
          reminderTitle: r.title,
          dueAt: r.nextTriggerAt as Date,
        })),
      actionUrl: '/reminders',
    })

    await db.smartNotification.create({
      data: {
        userId: user.id,
        channel: 'email',
        titleKey: 'notifications.weekly_digest.title',
        bodyKey: 'notifications.weekly_digest.body',
        bodyParams: { count: reminders.length },
        actionUrl: '/reminders',
      },
    })
    sent++
  }

  return NextResponse.json({ processed: users.length, sent })
}
