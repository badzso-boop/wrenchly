import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReadingService } from '@/server/domains/reading/reading.service'

const mockReadingRepo = {
  findByIdAndUserId: vi.fn(),
  findByItemId: vi.fn(),
  findAllByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
  findById: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const service = new ReadingService(mockReadingRepo as any, mockItemRepo as any)

beforeEach(() => vi.clearAllMocks())

describe('ReadingService.create', () => {
  it('creates a reading when the item is owned by the user and metric keys are valid', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'PET' })
    mockReadingRepo.create.mockResolvedValue({ id: 'reading-1' })

    await service.create('user-1', {
      itemId: 'item-1',
      recordedAt: new Date('2026-01-01'),
      metrics: { weightKg: 4.2 },
    })

    expect(mockReadingRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'item-1', metrics: { weightKg: 4.2 } })
    )
  })

  it('throws NOT_FOUND when the item is not owned by the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(
      service.create('user-1', { itemId: 'item-1', recordedAt: new Date(), metrics: { weightKg: 4 } })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    expect(mockReadingRepo.create).not.toHaveBeenCalled()
  })

  it('rejects a metric key that does not belong to the item type', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'PET' })

    await expect(
      service.create('user-1', {
        itemId: 'item-1',
        recordedAt: new Date(),
        metrics: { weightKg: 4, heightCm: 30 }, // heightCm is a PLANT metric, not PET
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockReadingRepo.create).not.toHaveBeenCalled()
  })

  it('rejects every submitted metric key for an item type with no registered metrics', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'MACHINE' })

    await expect(
      service.create('user-1', { itemId: 'item-1', recordedAt: new Date(), metrics: { weightKg: 4 } })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })
})

describe('ReadingService.update', () => {
  it('re-validates metric keys against the reading\'s own item type when metrics are provided', async () => {
    mockReadingRepo.findByIdAndUserId.mockResolvedValue({ id: 'reading-1', itemId: 'item-1' })
    mockItemRepo.findById.mockResolvedValue({ id: 'item-1', type: 'PET' })
    mockReadingRepo.update.mockResolvedValue({ id: 'reading-1' })

    await expect(
      service.update('reading-1', 'user-1', { metrics: { heightCm: 10 } })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('skips metric validation entirely when metrics are not part of the update', async () => {
    mockReadingRepo.findByIdAndUserId.mockResolvedValue({ id: 'reading-1', itemId: 'item-1' })
    mockReadingRepo.update.mockResolvedValue({ id: 'reading-1' })

    await expect(service.update('reading-1', 'user-1', { notes: 'just a note' })).resolves.not.toThrow()
    expect(mockItemRepo.findById).not.toHaveBeenCalled()
  })

  it('throws NOT_FOUND when the reading does not belong to the user', async () => {
    mockReadingRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.update('reading-1', 'user-1', { notes: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('ReadingService.getById / delete', () => {
  it('throws NOT_FOUND when the reading does not belong to the user', async () => {
    mockReadingRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getById('reading-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(service.delete('reading-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('deletes a reading owned by the user', async () => {
    mockReadingRepo.findByIdAndUserId.mockResolvedValue({ id: 'reading-1' })

    await service.delete('reading-1', 'user-1')
    expect(mockReadingRepo.delete).toHaveBeenCalledWith('reading-1')
  })
})

describe('ReadingService.getStatistics', () => {
  it('throws NOT_FOUND when the item is not owned by the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getStatistics('item-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('returns the latest value and full trend per metric, ignoring readings missing that metric', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'PET' })
    mockReadingRepo.findAllByItemId.mockResolvedValue([
      { recordedAt: new Date('2026-01-01'), metrics: { weightKg: 4.0 } },
      { recordedAt: new Date('2026-02-01'), metrics: {} }, // no weight logged that time
      { recordedAt: new Date('2026-03-01'), metrics: { weightKg: 4.5 } },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.readingCount).toBe(3)
    const weight = stats.metrics.find((m) => m.key === 'weightKg')
    expect(weight?.latest).toBe(4.5)
    expect(weight?.trend).toHaveLength(2)
  })

  it('returns latest: null and an empty trend when there are no readings yet', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'PET' })
    mockReadingRepo.findAllByItemId.mockResolvedValue([])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.readingCount).toBe(0)
    expect(stats.metrics[0]?.latest).toBeNull()
    expect(stats.metrics[0]?.trend).toEqual([])
  })

  it('returns an empty metrics list for an item type with no registered metrics', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'MACHINE' })
    mockReadingRepo.findAllByItemId.mockResolvedValue([])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.metrics).toEqual([])
  })
})
