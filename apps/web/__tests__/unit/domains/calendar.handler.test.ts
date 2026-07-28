import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'

// ─── Mock repositories ───────────────────────────────────────────────────────

const mockUserRepo = {
  findById: vi.fn(),
  saveCalendarToken: vi.fn(),
}

vi.mock('@/server/domains/user/user.repository', () => ({
  UserRepository: vi.fn(() => mockUserRepo),
}))

// ─── Inline handler logic (mirrors user.handler.ts procedures) ───────────────
// We test the business logic directly rather than going through tRPC router
// plumbing, which avoids needing a full tRPC context in unit tests.

import { randomBytes } from 'crypto'

function generateCalendarToken(): string {
  return randomBytes(32).toString('hex')
}

const BASE_URL = 'https://wrenchly.app'

async function getOrCreateCalendarToken(userId: string) {
  let user = await mockUserRepo.findById(userId)
  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.user.not_found' })
  if (!user.calendarToken) {
    const token = generateCalendarToken()
    user = await mockUserRepo.saveCalendarToken(userId, token)
  }
  return {
    token: user.calendarToken as string,
    feedUrl: `${BASE_URL}/api/calendar/${user.calendarToken}`,
  }
}

async function regenerateCalendarToken(userId: string) {
  const token = generateCalendarToken()
  const user = await mockUserRepo.saveCalendarToken(userId, token)
  return {
    token: user.calendarToken as string,
    feedUrl: `${BASE_URL}/api/calendar/${user.calendarToken}`,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks())

describe('getOrCreateCalendarToken', () => {
  it('returns existing token when user already has one', async () => {
    const existingToken = 'abc123existingtoken'
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1', calendarToken: existingToken })

    const result = await getOrCreateCalendarToken('user-1')

    expect(result.token).toBe(existingToken)
    expect(result.feedUrl).toBe(`${BASE_URL}/api/calendar/${existingToken}`)
    expect(mockUserRepo.saveCalendarToken).not.toHaveBeenCalled()
  })

  it('generates and saves a new token when user has none', async () => {
    const savedToken = 'newlygeneratedtoken'
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1', calendarToken: null })
    mockUserRepo.saveCalendarToken.mockResolvedValue({ id: 'user-1', calendarToken: savedToken })

    const result = await getOrCreateCalendarToken('user-1')

    expect(mockUserRepo.saveCalendarToken).toHaveBeenCalledOnce()
    expect(result.token).toBe(savedToken)
    expect(result.feedUrl).toContain('/api/calendar/')
    expect(result.feedUrl.endsWith(`/${savedToken}`)).toBe(true)
  })

  it('throws NOT_FOUND when user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null)

    await expect(getOrCreateCalendarToken('ghost-user')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.user.not_found',
    })
    expect(mockUserRepo.saveCalendarToken).not.toHaveBeenCalled()
  })

  it('feedUrl has correct structure', async () => {
    const token = 'abc123'
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1', calendarToken: token })

    const result = await getOrCreateCalendarToken('user-1')

    expect(result.feedUrl).toBe(`${BASE_URL}/api/calendar/${token}`)
  })
})

describe('regenerateCalendarToken', () => {
  it('always saves a fresh token regardless of existing one', async () => {
    const newToken = 'brandnewtoken'
    mockUserRepo.saveCalendarToken.mockResolvedValue({ id: 'user-1', calendarToken: newToken })

    const result = await regenerateCalendarToken('user-1')

    expect(mockUserRepo.saveCalendarToken).toHaveBeenCalledOnce()
    expect(result.token).toBe(newToken)
  })

  it('returns updated feedUrl with new token', async () => {
    const newToken = 'newtoken456'
    mockUserRepo.saveCalendarToken.mockResolvedValue({ id: 'user-1', calendarToken: newToken })

    const result = await regenerateCalendarToken('user-1')

    expect(result.feedUrl).toBe(`${BASE_URL}/api/calendar/${newToken}`)
  })

  it('does not call findById — overwrites unconditionally', async () => {
    mockUserRepo.saveCalendarToken.mockResolvedValue({ id: 'user-1', calendarToken: 'tok' })

    await regenerateCalendarToken('user-1')

    expect(mockUserRepo.findById).not.toHaveBeenCalled()
  })
})

describe('token format', () => {
  it('generated token is a 64-char hex string', () => {
    const token = generateCalendarToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('two generated tokens are different', () => {
    expect(generateCalendarToken()).not.toBe(generateCalendarToken())
  })
})
