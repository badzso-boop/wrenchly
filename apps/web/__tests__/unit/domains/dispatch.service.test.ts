import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isInQuietHours, dispatchAndRecord } from '@/server/domains/notification/dispatch.service'

vi.mock('@/server/domains/notification/push.service', () => ({
  sendPushNotifications: vi.fn(),
}))

import { sendPushNotifications } from '@/server/domains/notification/push.service'

describe('isInQuietHours', () => {
  it('returns false when either bound is null', () => {
    expect(isInQuietHours(null, 8)).toBe(false)
    expect(isInQuietHours(22, null)).toBe(false)
  })

  afterEach(() => vi.useRealTimers())

  it('same-day window: inside range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T10:00:00.000Z'))
    expect(isInQuietHours(9, 17)).toBe(true)
  })

  it('same-day window: outside range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T20:00:00.000Z'))
    expect(isInQuietHours(9, 17)).toBe(false)
  })

  it('overnight window (from > to): inside range past midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T23:30:00.000Z'))
    expect(isInQuietHours(22, 6)).toBe(true)
  })

  it('overnight window (from > to): outside range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'))
    expect(isInQuietHours(22, 6)).toBe(false)
  })
})

function pref(overrides: {
  pushEnabled: boolean
  emailEnabled: boolean
  quietHoursFrom?: number | null
  quietHoursTo?: number | null
}) {
  return {
    id: 'pref-1',
    userId: 'user-1',
    quietHoursFrom: null,
    quietHoursTo: null,
    advanceDays: 3,
    weeklyDigest: false,
    ...overrides,
  }
}

describe('dispatchAndRecord', () => {
  const mockDb = { smartNotification: { create: vi.fn() } }
  const baseParams = {
    userId: 'user-1',
    reminderId: 'r-1',
    pushTitle: 'Title',
    pushBody: 'Body',
    titleKey: 'notifications.reminder_due.title',
    bodyKey: 'notifications.reminder_due.body',
    bodyParams: { itemName: 'Car' },
    actionUrl: '/items/item-1',
  }

  beforeEach(() => vi.clearAllMocks())

  it('sends push and email when both enabled, records one notification', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const result = await dispatchAndRecord(mockDb as any, {
      ...baseParams,
      expoPushToken: 'ExponentPushToken[abc]',
      pref: pref({ pushEnabled: true, emailEnabled: true }),
      sendEmail,
    })

    expect(result).toEqual({ pushed: true, emailed: true })
    expect(sendPushNotifications).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(mockDb.smartNotification.create).toHaveBeenCalledTimes(1)
    expect(mockDb.smartNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channel: 'push,email' }) })
    )
  })

  it('skips push when no token, skips email when disabled', async () => {
    const sendEmail = vi.fn()
    const result = await dispatchAndRecord(mockDb as any, {
      ...baseParams,
      expoPushToken: null,
      pref: pref({ pushEnabled: true, emailEnabled: false }),
      sendEmail,
    })

    expect(result).toEqual({ pushed: false, emailed: false })
    expect(sendPushNotifications).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
    expect(mockDb.smartNotification.create).not.toHaveBeenCalled()
  })

  it('defaults pushEnabled to true when pref is null', async () => {
    const result = await dispatchAndRecord(mockDb as any, {
      ...baseParams,
      expoPushToken: 'ExponentPushToken[abc]',
      pref: null,
      sendEmail: undefined,
    })

    expect(result.pushed).toBe(true)
    expect(sendPushNotifications).toHaveBeenCalledTimes(1)
  })

  it('does nothing during quiet hours', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T14:00:00.000Z'))
    const sendEmail = vi.fn()

    const result = await dispatchAndRecord(mockDb as any, {
      ...baseParams,
      expoPushToken: 'ExponentPushToken[abc]',
      pref: pref({ pushEnabled: true, emailEnabled: true, quietHoursFrom: 13, quietHoursTo: 15 }),
      sendEmail,
    })

    vi.useRealTimers()

    expect(result).toEqual({ pushed: false, emailed: false })
    expect(sendPushNotifications).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
    expect(mockDb.smartNotification.create).not.toHaveBeenCalled()
  })
})
