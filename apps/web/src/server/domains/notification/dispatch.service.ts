import { type NotificationPreference, type PrismaClient } from '@prisma/client'
import { sendPushNotifications } from './push.service'

export function isInQuietHours(from: number | null, to: number | null): boolean {
  if (from === null || to === null) return false
  const hour = new Date().getUTCHours()
  if (from <= to) return hour >= from && hour < to
  return hour >= from || hour < to
}

export async function dispatchAndRecord(
  db: PrismaClient,
  params: {
    userId: string
    reminderId?: string | null
    expoPushToken: string | null
    pref: NotificationPreference | null
    pushTitle: string
    pushBody: string
    titleKey: string
    bodyKey: string
    bodyParams: Record<string, string | number>
    actionUrl: string
    sendEmail?: () => Promise<void>
  }
): Promise<{ pushed: boolean; emailed: boolean }> {
  const { pref } = params

  if (pref && isInQuietHours(pref.quietHoursFrom, pref.quietHoursTo)) {
    return { pushed: false, emailed: false }
  }

  let pushed = false
  if (params.expoPushToken && (!pref || pref.pushEnabled)) {
    await sendPushNotifications([
      {
        to: params.expoPushToken,
        title: params.pushTitle,
        body: params.pushBody,
        data: { actionUrl: params.actionUrl },
      },
    ])
    pushed = true
  }

  let emailed = false
  if (pref?.emailEnabled && params.sendEmail) {
    await params.sendEmail()
    emailed = true
  }

  if (pushed || emailed) {
    await db.smartNotification.create({
      data: {
        userId: params.userId,
        reminderId: params.reminderId ?? null,
        channel: [pushed && 'push', emailed && 'email'].filter(Boolean).join(','),
        titleKey: params.titleKey,
        bodyKey: params.bodyKey,
        bodyParams: params.bodyParams,
        actionUrl: params.actionUrl,
      },
    })
  }

  return { pushed, emailed }
}
