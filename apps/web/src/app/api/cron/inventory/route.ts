import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { sendKeyedEmail } from '@/server/domains/notification/email.service'
import { dispatchAndRecord } from '@/server/domains/notification/dispatch.service'
import { getTranslations } from '@wrenchly/i18n'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const allTracked = await db.inventoryItem.findMany({
    where: { minQuantity: { not: null } },
    include: {
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

  const lowStockItems = allTracked.filter(
    (item) => item.minQuantity !== null && Number(item.quantity) <= Number(item.minQuantity)
  )

  let sent = 0

  for (const item of lowStockItems) {
    const user = item.user

    // Dedup: already notified today for this item?
    const alreadySent = await db.smartNotification.findFirst({
      where: {
        userId: user.id,
        bodyKey: 'notifications.low_stock.body',
        actionUrl: '/inventory',
        bodyParams: { path: ['itemName'], equals: item.name },
        triggeredAt: { gte: new Date(todayStr) },
      },
    })
    if (alreadySent) continue

    const t = getTranslations(user.locale)

    const { pushed, emailed } = await dispatchAndRecord(db, {
      userId: user.id,
      expoPushToken: user.expoPushToken,
      pref: user.notificationPref,
      pushTitle: t('notifications.low_stock.title'),
      pushBody: t('notifications.low_stock.body', { itemName: item.name }),
      titleKey: 'notifications.low_stock.title',
      bodyKey: 'notifications.low_stock.body',
      bodyParams: { itemName: item.name },
      actionUrl: '/inventory',
      sendEmail: () =>
        sendKeyedEmail({
          to: user.email,
          locale: user.locale,
          titleKey: 'notifications.low_stock.title',
          bodyKey: 'notifications.low_stock.body',
          bodyParams: { itemName: item.name },
          actionUrl: '/inventory',
        }),
    })

    if (pushed || emailed) sent++
  }

  return NextResponse.json({ checked: allTracked.length, lowStock: lowStockItems.length, sent })
}
