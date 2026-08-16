import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'

const OTHER_USER = { id: 'mock-other-user', name: 'Jane Other', username: 'janeother', avatarUrl: null }
const FRIEND_USER = { id: 'mock-friend-user', name: 'Bob Friend', username: 'bobfriend', avatarUrl: null }

const PENDING_RECEIVED = {
  id: 'mock-req-received',
  requesterId: OTHER_USER.id,
  addresseeId: 'mock-user',
  status: 'PENDING',
  requester: OTHER_USER,
}
const PENDING_SENT = {
  id: 'mock-req-sent',
  requesterId: 'mock-user',
  addresseeId: FRIEND_USER.id,
  status: 'PENDING',
  addressee: FRIEND_USER,
}
// requesterId deliberately set to FRIEND_USER (not 'mock-user') so the
// "other side of the friendship" resolves to FRIEND_USER regardless of
// whether the mock session's user id actually resolves client-side.
const ACCEPTED_FRIENDSHIP = {
  id: 'mock-req-accepted',
  requesterId: FRIEND_USER.id,
  addresseeId: 'mock-user',
  status: 'ACCEPTED',
  requester: FRIEND_USER,
  addressee: { id: 'mock-user', name: 'E2E User', username: 'e2euser', avatarUrl: null },
}

test.describe('Friends (mock)', () => {
  test('friends page shows its main sections', async ({ page }) => {
    await setupTrpcMocks(page, {
      'friend.listFriends': () => [ACCEPTED_FRIENDSHIP],
      'friend.listPendingReceived': () => [PENDING_RECEIVED],
      'friend.listPendingSent': () => [PENDING_SENT],
    })
    await page.goto('/friends')

    await expect(page.getByRole('heading', { name: 'Friends' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder('Search by username')).toBeVisible()
    await expect(page.getByText('Pending — received')).toBeVisible()
    await expect(page.getByText('Pending — sent')).toBeVisible()
    await expect(page.getByText(OTHER_USER.name)).toBeVisible()
    // FRIEND_USER shows up twice (Pending - sent AND Friends list, since the
    // fixtures deliberately reuse the same user in both) - just assert at
    // least one is visible rather than requiring a unique match.
    await expect(page.getByText(FRIEND_USER.name).first()).toBeVisible()
  })

  test('search result shows a Send request action and sends the right mutation', async ({ page }) => {
    let sentInput: unknown = null
    await setupTrpcMocks(page, {
      'friend.listFriends': () => [],
      'friend.listPendingReceived': () => [],
      'friend.listPendingSent': () => [],
      'friend.search': () => [OTHER_USER],
      'friend.sendRequest': (input) => { sentInput = input; return PENDING_SENT },
    })
    await page.goto('/friends')

    await page.getByPlaceholder('Search by username').fill('janeother')
    await expect(page.getByText(OTHER_USER.name)).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /add/i }).click()

    await expect.poll(() => sentInput).toEqual({ addresseeId: OTHER_USER.id })
  })

  test('a pending-received request shows accept and decline actions', async ({ page }) => {
    let acceptedRequestId: unknown = null
    let declinedRequestId: unknown = null
    await setupTrpcMocks(page, {
      'friend.listFriends': () => [],
      'friend.listPendingReceived': () => [PENDING_RECEIVED],
      'friend.listPendingSent': () => [],
      'friend.accept': (input) => { acceptedRequestId = input; return { ...PENDING_RECEIVED, status: 'ACCEPTED' } },
      'friend.decline': (input) => { declinedRequestId = input; return { ...PENDING_RECEIVED, status: 'DECLINED' } },
    })
    await page.goto('/friends')

    await expect(page.getByText('Pending — received')).toBeVisible({ timeout: 10000 })
    const row = page.getByText(OTHER_USER.name).locator('..').locator('..')
    const buttons = row.getByRole('button')
    await expect(buttons).toHaveCount(2)

    await buttons.first().click()
    await expect.poll(() => acceptedRequestId).toEqual({ requestId: PENDING_RECEIVED.id })
  })
})
