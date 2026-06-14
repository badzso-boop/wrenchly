import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { sendPushNotifications } from '@/server/domains/notification/push.service'
import { getTranslations } from '@wrenchly/i18n'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allTracked = await db.inventoryItem.findMany({
    where: { minQuantity: { not: null } },
    include: {
      user: {
        select: {
          id: true,
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

  const byUser = new Map<string, typeof lowStockItems>()
  for (const item of lowStockItems) {
    const list = byUser.get(item.userId) ?? []
    list.push(item)
    byUser.set(item.userId, list)
  }

  let sent = 0

  for (const [, items] of byUser) {
    const user = items[0]!.user
    const pref = user.notificationPref
    if (!user.expoPushToken || (pref && !pref.pushEnabled)) continue

    const t = getTranslations(user.locale)

    for (const item of items) {
      await sendPushNotifications([
        {
          to: user.expoPushToken,
          title: t('notifications.low_stock.title'),
          body: t('notifications.low_stock.body', { itemName: item.name }),
          data: { actionUrl: '/inventory' },
        },
      ])
      sent++
    }
  }

  return NextResponse.json({ checked: allTracked.length, lowStock: lowStockItems.length, sent })
}
