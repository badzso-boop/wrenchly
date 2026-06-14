import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { WeatherService } from '@/server/domains/weather/weather.service'
import { sendPushNotifications } from '@/server/domains/notification/push.service'
import { getTranslations } from '@wrenchly/i18n'

const weatherService = new WeatherService()

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const weatherReminders = await db.reminder.findMany({
    where: { isActive: true, triggerType: 'WEATHER' },
    include: {
      item: { select: { userId: true, name: true } },
      user: {
        select: {
          id: true,
          locale: true,
          expoPushToken: true,
          defaultLat: true,
          defaultLon: true,
          notificationPref: true,
        },
      },
    },
  })

  let triggered = 0

  for (const reminder of weatherReminders) {
    const user = reminder.user
    if (!user.defaultLat || !user.defaultLon) continue

    const forecast = await weatherService.getDailyForecast(
      Number(user.defaultLat),
      Number(user.defaultLon)
    )

    const config = reminder.triggerConfig as { condition: string; value?: number; days?: number }
    const { triggered: conditionMet } = weatherService.evaluateCondition(
      config as Parameters<typeof weatherService.evaluateCondition>[0],
      forecast
    )
    if (!conditionMet) continue

    // Dedup: already sent today?
    const alreadySent = await db.smartNotification.findFirst({
      where: {
        userId: user.id,
        reminderId: reminder.id,
        triggeredAt: { gte: new Date(todayStr) },
      },
    })
    if (alreadySent) continue

    const t = getTranslations(user.locale)
    const pref = user.notificationPref

    if (user.expoPushToken && (!pref || pref.pushEnabled)) {
      await sendPushNotifications([
        {
          to: user.expoPushToken,
          title: t('notifications.weather_alert.title'),
          body: t('notifications.weather_alert.body', { message: config.condition }),
          data: { actionUrl: `/items/${reminder.itemId}` },
        },
      ])
      triggered++
    }

    await db.smartNotification.create({
      data: {
        userId: user.id,
        reminderId: reminder.id,
        channel: 'push',
        titleKey: 'notifications.weather_alert.title',
        bodyKey: 'notifications.weather_alert.body',
        bodyParams: { message: config.condition },
        actionUrl: `/items/${reminder.itemId}`,
      },
    })
  }

  return NextResponse.json({ processed: weatherReminders.length, triggered })
}
