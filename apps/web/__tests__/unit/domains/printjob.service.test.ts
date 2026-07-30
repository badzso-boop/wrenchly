import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrintJobService } from '@/server/domains/printjob/printjob.service'

const mockPrintJobRepo = {
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

const mockDb = {
  printer3dProfile: { updateMany: vi.fn() },
}

const service = new PrintJobService(mockPrintJobRepo as any, mockItemRepo as any, mockDb as any)

beforeEach(() => vi.clearAllMocks())

describe('PrintJobService.create', () => {
  const baseInput = {
    itemId: 'item-1',
    startedAt: new Date('2026-07-01'),
    filamentGrams: 50,
    materialType: 'PLA',
  }

  it('throws NOT_FOUND when the item is not owned by the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.create('user-1', baseInput)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.item.not_found',
    })
    expect(mockPrintJobRepo.create).not.toHaveBeenCalled()
  })

  it('defaults success to true when omitted', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockPrintJobRepo.create.mockResolvedValue({ id: 'job-1' })

    await service.create('user-1', baseInput)

    expect(mockPrintJobRepo.create).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })

  it('increments totalPrints and filamentConsumedG, but not totalPrintHours when no duration was logged', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockPrintJobRepo.create.mockResolvedValue({ id: 'job-1' })

    await service.create('user-1', baseInput)

    expect(mockDb.printer3dProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalPrints: { increment: 1 }, filamentConsumedG: { increment: 50 } },
    })
  })

  it('also increments totalPrintHours when a duration was logged', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockPrintJobRepo.create.mockResolvedValue({ id: 'job-1' })

    await service.create('user-1', { ...baseInput, durationMin: 90 })

    expect(mockDb.printer3dProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: {
        totalPrints: { increment: 1 },
        totalPrintHours: { increment: 1.5 },
        filamentConsumedG: { increment: 50 },
      },
    })
  })
})

describe('PrintJobService.update', () => {
  it('applies only the delta, not the full new value, to avoid double-counting an edit', async () => {
    mockPrintJobRepo.findByIdAndUserId.mockResolvedValue({
      id: 'job-1',
      itemId: 'item-1',
      filamentGrams: 50,
      durationMin: 60,
    })
    mockPrintJobRepo.update.mockResolvedValue({ id: 'job-1' })

    await service.update('job-1', 'user-1', { filamentGrams: 70, durationMin: 90 })

    expect(mockDb.printer3dProfile.updateMany).toHaveBeenCalledWith({
      where: { itemId: 'item-1' },
      data: { totalPrintHours: { increment: 0.5 }, filamentConsumedG: { increment: 20 } },
    })
  })

  it("does not re-increment totalPrints on update (a job already counted once at creation)", async () => {
    mockPrintJobRepo.findByIdAndUserId.mockResolvedValue({
      id: 'job-1',
      itemId: 'item-1',
      filamentGrams: 50,
      durationMin: 60,
    })
    mockPrintJobRepo.update.mockResolvedValue({ id: 'job-1' })

    await service.update('job-1', 'user-1', { notes: 'reprint' })

    expect(mockDb.printer3dProfile.updateMany).not.toHaveBeenCalled()
  })

  it('throws NOT_FOUND when the job does not belong to the user', async () => {
    mockPrintJobRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.update('job-1', 'user-1', { notes: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('PrintJobService.getById / delete', () => {
  it('throws NOT_FOUND when the job does not belong to the user', async () => {
    mockPrintJobRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getById('job-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(service.delete('job-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('deletes a job owned by the user', async () => {
    mockPrintJobRepo.findByIdAndUserId.mockResolvedValue({ id: 'job-1' })

    await service.delete('job-1', 'user-1')
    expect(mockPrintJobRepo.delete).toHaveBeenCalledWith('job-1')
  })
})

describe('PrintJobService.getStatistics', () => {
  it('throws NOT_FOUND when the item is not owned by the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getStatistics('item-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('computes totals and an all-time success rate across mixed success/fail jobs', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockPrintJobRepo.findAllByItemId.mockResolvedValue([
      { startedAt: new Date('2026-06-01'), filamentGrams: 40, durationMin: 120, success: true },
      { startedAt: new Date('2026-06-15'), filamentGrams: 30, durationMin: 60, success: false },
      { startedAt: new Date('2026-07-01'), filamentGrams: 20, durationMin: 30, success: true },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.totalPrints).toBe(3)
    expect(stats.totalFilamentGrams).toBe(90)
    expect(stats.totalHours).toBeCloseTo(210 / 60)
    expect(stats.successRate).toBeCloseTo((2 / 3) * 100)
  })

  it('buckets filament/hours/success-rate by month', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockPrintJobRepo.findAllByItemId.mockResolvedValue([
      { startedAt: new Date('2026-06-01'), filamentGrams: 40, durationMin: 60, success: true },
      { startedAt: new Date('2026-06-15'), filamentGrams: 10, durationMin: 60, success: false },
      { startedAt: new Date('2026-07-01'), filamentGrams: 20, durationMin: 30, success: true },
    ])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.monthly).toEqual([
      { month: '2026-06', filamentGrams: 50, printHours: 2, successRate: 50 },
      { month: '2026-07', filamentGrams: 20, printHours: 0.5, successRate: 100 },
    ])
  })

  it('returns zeroed stats when there are no print jobs yet', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockPrintJobRepo.findAllByItemId.mockResolvedValue([])

    const stats = await service.getStatistics('item-1', 'user-1')

    expect(stats.totalPrints).toBe(0)
    expect(stats.successRate).toBe(0)
    expect(stats.monthly).toEqual([])
  })
})
