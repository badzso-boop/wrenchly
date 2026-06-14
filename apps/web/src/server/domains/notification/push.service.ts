import Expo, { type ExpoPushMessage } from 'expo-server-sdk'
import { db } from '@/server/db'

const expo = new Expo()

export interface PushPayload {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushNotifications(messages: PushPayload[]): Promise<void> {
  const valid = messages.filter((m) => Expo.isExpoPushToken(m.to))
  if (valid.length === 0) return

  const chunks = expo.chunkPushNotifications(
    valid.map(
      (m) =>
        ({
          to: m.to,
          sound: 'default',
          title: m.title,
          body: m.body,
          data: m.data ?? {},
        }) satisfies ExpoPushMessage
    )
  )

  for (const chunk of chunks) {
    const receipts = await expo.sendPushNotificationsAsync(chunk)
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i]
      if (receipt?.status === 'error' && receipt.status === 'error' && 'details' in receipt && receipt.details?.error === 'DeviceNotRegistered') {
        const token = valid[i]?.to
        if (token) {
          await db.user.updateMany({
            where: { expoPushToken: token },
            data: { expoPushToken: null },
          })
        }
      }
    }
  }
}
