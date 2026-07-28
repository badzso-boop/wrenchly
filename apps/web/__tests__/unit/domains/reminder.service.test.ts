import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ReminderService,
  calculateNextTrigger,
  calculateNextTriggerAfterFiring,
} from '@/server/domains/reminder/reminder.service'
import { TRPCError } from '@trpc/server'
import { addDays } from 'date-fns'

// ─── calculateNextTrigger unit tests ───────────────────────────────────────

describe('calculateNextTrigger', () => {
  it('DATE – returns the specified date', () => {
    const date = '2027-01-15T10:00:00.000Z'
    const result = calculateNextTrigger('DATE', { date })
    expect(result).toBeInstanceOf(Date)
    expect((result as Date).toISOString()).toBe(date)
  })

  it('INTERVAL_DAYS – returns now + days when no last_done_at', () => {
    const before = new Date()
    const result = calculateNextTrigger('INTERVAL_DAYS', { days: 30 }) as Date
    const expected = addDays(before, 30)
    expect(result.getDate()).toBe(expected.getDate())
  })

  it('INTERVAL_DAYS – returns last_done_at + days', () => {
    const lastDoneAt = '2026-01-01T00:00:00.000Z'
    const result = calculateNextTrigger('INTERVAL_DAYS', { days: 90, last_done_at: lastDoneAt }) as Date
    const expected = addDays(new Date(lastDoneAt), 90)
    expect(result.toISOString()).toBe(expected.toISOString())
  })

  it('ODOMETER – returns null', () => {
    expect(calculateNextTrigger('ODOMETER', { every_km: 10000 })).toBeNull()
  })

  it('WEATHER – returns null', () => {
    expect(calculateNextTrigger('WEATHER', { condition: 'frost' })).toBeNull()
  })

  it('INTERVAL_DAYS – returns null when days is missing', () => {
    expect(calculateNextTrigger('INTERVAL_DAYS', {})).toBeNull()
  })
})

describe('calculateNextTriggerAfterFiring', () => {
  it('DATE – returns null after firing, not the same fixed date again (would re-fire every cron run otherwise)', async () => {
    const result = await calculateNextTriggerAfterFiring('DATE', { date: '2026-01-01T00:00:00.000Z' })
    expect(result).toBeNull()
  })

  it('INTERVAL_DAYS – still recomputes the next occurrence', async () => {
    const result = await calculateNextTriggerAfterFiring('INTERVAL_DAYS', { days: 30 })
    expect(result).toBeInstanceOf(Date)
  })
})

// ─── ReminderService mock tests ─────────────────────────────────────────────

const mockReminderRepo = {
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findByItemId: vi.fn(),
  findDue: vi.fn(),
  findOdometerByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const service = new ReminderService(mockReminderRepo as any)

beforeEach(() => vi.clearAllMocks())

describe('ReminderService.getById', () => {
  it('returns reminder when found', async () => {
    const reminder = { id: 'r-1', userId: 'user-1' }
    mockReminderRepo.findByIdAndUserId.mockResolvedValue(reminder)

    const result = await service.getById('r-1', 'user-1')
    expect(result).toEqual(reminder)
  })

  it('throws NOT_FOUND when not found', async () => {
    mockReminderRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getById('r-1', 'user-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.reminder.not_found',
    })
  })
})

describe('ReminderService.create', () => {
  it('stores nextTriggerAt for INTERVAL_DAYS', async () => {
    const created = { id: 'r-1' }
    mockReminderRepo.create.mockResolvedValue(created)

    await service.create('user-1', {
      itemId: 'item-1',
      title: 'Oil change',
      triggerType: 'INTERVAL_DAYS',
      triggerConfig: { days: 365 },
    })

    expect(mockReminderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ nextTriggerAt: expect.any(Date) })
    )
  })

  it('stores null nextTriggerAt for ODOMETER', async () => {
    mockReminderRepo.create.mockResolvedValue({ id: 'r-1' })

    await service.create('user-1', {
      itemId: 'item-1',
      title: 'Chain lube',
      triggerType: 'ODOMETER',
      triggerConfig: { every_km: 500 },
    })

    expect(mockReminderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ nextTriggerAt: null })
    )
  })
})

describe('ReminderService.evaluateOdometerTriggers', () => {
  it('returns reminders where current km exceeds threshold', async () => {
    const reminders = [
      {
        id: 'r-1',
        triggerConfig: { every_km: 10000, last_done_at_km: 45000 },
      },
      {
        id: 'r-2',
        triggerConfig: { every_km: 10000, last_done_at_km: 50000 },
      },
    ]
    mockReminderRepo.findOdometerByItemId.mockResolvedValue(reminders)

    const triggered = await service.evaluateOdometerTriggers('item-1', 55000)
    expect(triggered).toHaveLength(1)
    expect(triggered[0]!.id).toBe('r-1')
  })

  it('returns empty array when no reminders are due', async () => {
    const reminders = [
      { id: 'r-1', triggerConfig: { every_km: 10000, last_done_at_km: 50000 } },
    ]
    mockReminderRepo.findOdometerByItemId.mockResolvedValue(reminders)

    const triggered = await service.evaluateOdometerTriggers('item-1', 55000)
    expect(triggered).toHaveLength(0)
  })
})

describe('ReminderService.delete', () => {
  it('deletes when user owns reminder', async () => {
    mockReminderRepo.findByIdAndUserId.mockResolvedValue({ id: 'r-1' })
    mockReminderRepo.delete.mockResolvedValue(undefined)

    await service.delete('r-1', 'user-1')
    expect(mockReminderRepo.delete).toHaveBeenCalledWith('r-1')
  })
})
