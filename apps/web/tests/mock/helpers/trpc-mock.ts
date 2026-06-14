import { type Page } from '@playwright/test'
import {
  TEST_ITEMS, TEST_MAINTENANCE, TEST_REMINDERS, TEST_INVENTORY,
  TEST_VEHICLE, TEST_NOTIFICATIONS, TEST_CALENDAR_TOKEN,
} from '../fixtures'

type Handler = (input: unknown) => unknown

const DEFAULT_HANDLERS: Record<string, Handler> = {
  'item.list': () => TEST_ITEMS,
  'item.getById': (input) => TEST_ITEMS.find((i) => i.id === (input as { id: string })?.id) ?? null,
  'item.create': (input) => ({ ...TEST_ITEMS[0], ...(input as object), id: 'mock-new-item', createdAt: new Date().toISOString() }),
  'item.update': (input) => ({ ...TEST_ITEMS[0], ...(input as object) }),
  'item.delete': () => ({ id: 'mock-item-1' }),

  'maintenance.list': () => TEST_MAINTENANCE,
  'maintenance.listByItemId': (input) =>
    TEST_MAINTENANCE.filter((r) => r.itemId === (input as { itemId: string })?.itemId),
  'maintenance.create': (input) => ({ ...TEST_MAINTENANCE[0], ...(input as object), id: 'mock-new-maint' }),

  'reminder.list': () => TEST_REMINDERS,
  'reminder.create': (input) => ({ ...TEST_REMINDERS[0], ...(input as object), id: 'mock-new-rem' }),
  'reminder.delete': () => ({ id: 'mock-rem-1' }),

  'vehicle.getByItemId': () => TEST_VEHICLE,
  'vehicle.create': (input) => ({ ...TEST_VEHICLE, ...(input as object) }),
  'vehicle.update': (input) => ({ ...TEST_VEHICLE, ...(input as object) }),
  'vehicle.updateOdometer': (input) => ({ ...TEST_VEHICLE, currentOdometer: String((input as { odometer: number })?.odometer) }),

  'inventory.list': () => TEST_INVENTORY,
  'inventory.create': (input) => ({ ...TEST_INVENTORY[0], ...(input as object), id: 'mock-new-inv' }),
  'inventory.adjustQuantity': () => TEST_INVENTORY[0],
  'inventory.delete': () => ({ id: 'mock-inv-1' }),

  'notification.list': () => TEST_NOTIFICATIONS,
  'notification.countUnread': () => 1,
  'notification.markRead': () => TEST_NOTIFICATIONS[0],
  'notification.markAllRead': () => null,

  'user.getMe': () => ({ id: 'mock-user', email: 'e2e@wrenchly.test', name: 'E2E User', locale: 'en', timezone: 'Europe/Budapest', createdAt: '2024-01-01T00:00:00.000Z' }),
  'user.update': (input) => ({ id: 'mock-user', email: 'e2e@wrenchly.test', ...(input as object) }),
  'user.getNotifPref': () => ({ pushEnabled: true, emailEnabled: false, advanceDays: 3, quietHoursFrom: null, quietHoursTo: null, weeklyDigest: false }),
  'user.upsertNotifPref': (input) => input,
  'user.getOrCreateCalendarToken': () => TEST_CALENDAR_TOKEN,
  'user.regenerateCalendarToken': () => ({ ...TEST_CALENDAR_TOKEN, token: 'mock-regenerated-token-xyz', feedUrl: 'http://localhost:3000/api/calendar/mock-regenerated-token-xyz/feed.ics' }),
}

export async function setupTrpcMocks(page: Page, overrides: Record<string, Handler> = {}) {
  const handlers = { ...DEFAULT_HANDLERS, ...overrides }

  // Add bypass header to all requests (including navigation) so middleware skips Supabase auth
  await page.setExtraHTTPHeaders({ 'x-e2e-bypass': 'wrenchly-e2e' })

  await page.route('**', async (route) => {
    const reqUrl = route.request().url()
    if (!reqUrl.includes('/api/trpc')) {
      return route.continue()
    }

    const url = new URL(reqUrl)
    const pathSegment = url.pathname.replace(/.*\/api\/trpc\//, '')
    const procedures = pathSegment ? pathSegment.split(',') : []

    if (procedures.length === 0) {
      return route.continue()
    }

    let inputs: Record<string, { json: unknown }> = {}
    const inputStr = url.searchParams.get('input')
    if (inputStr) {
      try { inputs = JSON.parse(decodeURIComponent(inputStr)) } catch { /* ignore */ }
    } else if (route.request().method() === 'POST') {
      try {
        const body = route.request().postDataJSON()
        if (typeof body === 'object' && body !== null) {
          inputs = body as Record<string, { json: unknown }>
        }
      } catch { /* ignore */ }
    }

    const responses = procedures.map((proc, i) => {
      const handler = handlers[proc]
      const input = inputs[String(i)]?.json ?? null
      const data = handler ? handler(input) : null
      return { result: { data: { json: data } } }
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responses),
    })
  })
}
