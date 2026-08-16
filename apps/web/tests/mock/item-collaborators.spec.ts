import { test, expect } from '@playwright/test'
import { setupTrpcMocks } from './helpers/trpc-mock'
import { TEST_ITEMS } from './fixtures'

// TEST_ITEMS[0] ('mock-item-1') is owned by 'mock-user' (the mocked session
// user) — used for the owner-view assertions below.
const OWNED_ITEM = TEST_ITEMS[0]!

// A second item owned by someone else, with the mock session user as an
// ACCEPTED collaborator — used for the non-owner ("collaborator") view.
const OTHER_OWNER = { id: 'mock-item-owner', name: 'Alice Owner', username: 'aliceowner', avatarUrl: null }
const SHARED_ITEM = { ...TEST_ITEMS[0], id: 'mock-shared-item', userId: OTHER_OWNER.id, name: 'Shared Vehicle' }

const ELIGIBLE_FRIEND = { id: 'mock-eligible-friend', name: 'Carl Friend', username: 'carlfriend', avatarUrl: null }
const FRIENDSHIP_WITH_ELIGIBLE = {
  id: 'mock-req-1',
  requesterId: ELIGIBLE_FRIEND.id,
  addresseeId: 'mock-user',
  status: 'ACCEPTED',
  requester: ELIGIBLE_FRIEND,
  addressee: { id: 'mock-user', name: 'E2E User', username: 'e2euser', avatarUrl: null },
}

const ACCEPTED_COLLABORATOR_ROW = {
  id: 'mock-collab-1',
  itemId: OWNED_ITEM.id,
  userId: ELIGIBLE_FRIEND.id,
  invitedById: 'mock-user',
  status: 'ACCEPTED',
  user: ELIGIBLE_FRIEND,
}

test.describe('Item Collaborators (mock)', () => {
  test('collaborators tab renders on an item detail page', async ({ page }) => {
    await setupTrpcMocks(page, {
      'itemCollaborator.listForItem': () => [],
      'friend.listFriends': () => [],
    })
    await page.goto(`/items/${OWNED_ITEM.id}`)
    await expect(page.getByRole('link', { name: /collaborators/i })).toBeVisible({ timeout: 10000 })
  })

  test('owner sees an Invite action with eligible friends selectable', async ({ page }) => {
    await setupTrpcMocks(page, {
      'itemCollaborator.listForItem': () => [],
      'friend.listFriends': () => [FRIENDSHIP_WITH_ELIGIBLE],
    })
    await page.goto(`/items/${OWNED_ITEM.id}/collaborators`)

    await expect(page.getByText('Invite a friend', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('No collaborators yet')).toBeVisible()

    const inviteButton = page.getByRole('button', { name: /invite/i })
    await expect(inviteButton).toBeDisabled()

    await page.getByRole('combobox').click()
    await expect(page.getByRole('option', { name: /carl friend/i })).toBeVisible()
  })

  test('owner can remove an accepted collaborator', async ({ page }) => {
    let removeInput: unknown = null
    await setupTrpcMocks(page, {
      'itemCollaborator.listForItem': () => [ACCEPTED_COLLABORATOR_ROW],
      'friend.listFriends': () => [FRIENDSHIP_WITH_ELIGIBLE],
      'itemCollaborator.remove': (input) => { removeInput = input; return { ok: true } },
    })
    page.on('dialog', (dialog) => dialog.accept())
    await page.goto(`/items/${OWNED_ITEM.id}/collaborators`)

    await expect(page.getByText(ELIGIBLE_FRIEND.name)).toBeVisible({ timeout: 10000 })
    // The collaborator row: name's grandparent div also contains the
    // trash/remove icon button as a sibling (owner, not-me -> Trash2 only).
    const row = page.getByText(ELIGIBLE_FRIEND.name).locator('../..')
    await row.getByRole('button').last().click()
    await expect.poll(() => removeInput).toEqual({ itemId: OWNED_ITEM.id, targetUserId: ELIGIBLE_FRIEND.id })
  })

  test('a non-owner collaborator sees a read-only list plus Leave', async ({ page }) => {
    const myAcceptedRow = {
      id: 'mock-collab-me',
      itemId: SHARED_ITEM.id,
      userId: 'mock-user',
      invitedById: OTHER_OWNER.id,
      status: 'ACCEPTED',
      user: { id: 'mock-user', name: 'E2E User', username: 'e2euser', avatarUrl: null },
    }
    await setupTrpcMocks(page, {
      'item.getById': (input) =>
        (input as { id: string })?.id === SHARED_ITEM.id ? SHARED_ITEM : OWNED_ITEM,
      'itemCollaborator.getItemSummary': () => ({ id: SHARED_ITEM.id, name: SHARED_ITEM.name, userId: SHARED_ITEM.userId }),
      'itemCollaborator.listForItem': () => [myAcceptedRow],
      'friend.listFriends': () => [],
    })
    await page.goto(`/items/${SHARED_ITEM.id}/collaborators`)

    // Non-owner: no "Invite a friend" card.
    await expect(page.getByText('Invite a friend')).toHaveCount(0)
    await expect(page.getByText('(you)')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /leave/i })).toBeVisible()
  })
})
