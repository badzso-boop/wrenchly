import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { CustomDomainService } from '@/server/domains/custom-domain/custom-domain.service'

const mockDomainRepo = {
  findById: vi.fn(),
  updateMaintenanceLogEnabled: vi.fn(),
  updateReminderEnabled: vi.fn(),
  updateTabOrder: vi.fn(),
}

const mockItemRepo = {}

const service = new CustomDomainService(mockDomainRepo as any, mockItemRepo as any)

beforeEach(() => vi.clearAllMocks())

describe('CustomDomainService.setMaintenanceLogEnabled', () => {
  it('updates the flag when the caller owns the domain', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await service.setMaintenanceLogEnabled('domain-1', 'owner-1', true)

    expect(mockDomainRepo.updateMaintenanceLogEnabled).toHaveBeenCalledWith('domain-1', true)
  })

  it('rejects a non-owner with NOT_FOUND without touching the flag', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await expect(service.setMaintenanceLogEnabled('domain-1', 'stranger-1', true)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<TRPCError>)
    expect(mockDomainRepo.updateMaintenanceLogEnabled).not.toHaveBeenCalled()
  })

  it('rejects when the domain does not exist', async () => {
    mockDomainRepo.findById.mockResolvedValue(null)

    await expect(service.setMaintenanceLogEnabled('missing', 'owner-1', true)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<TRPCError>)
  })
})

describe('CustomDomainService.setReminderEnabled', () => {
  it('updates the flag when the caller owns the domain', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await service.setReminderEnabled('domain-1', 'owner-1', false)

    expect(mockDomainRepo.updateReminderEnabled).toHaveBeenCalledWith('domain-1', false)
  })

  it('rejects a non-owner with NOT_FOUND without touching the flag', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await expect(service.setReminderEnabled('domain-1', 'stranger-1', false)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<TRPCError>)
    expect(mockDomainRepo.updateReminderEnabled).not.toHaveBeenCalled()
  })
})

describe('CustomDomainService.setTabOrder', () => {
  it('saves a valid, fully-known tab order when the caller owns the domain', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await service.setTabOrder('domain-1', 'owner-1', ['collaborators', 'reminders', 'log'])

    expect(mockDomainRepo.updateTabOrder).toHaveBeenCalledWith('domain-1', ['collaborators', 'reminders', 'log'])
  })

  it('rejects an unknown tab key without touching the order', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await expect(
      service.setTabOrder('domain-1', 'owner-1', ['reminders', 'not-a-real-tab' as never])
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' } satisfies Partial<TRPCError>)
    expect(mockDomainRepo.updateTabOrder).not.toHaveBeenCalled()
  })

  it('rejects a duplicate tab key without touching the order', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await expect(
      service.setTabOrder('domain-1', 'owner-1', ['reminders', 'reminders'])
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' } satisfies Partial<TRPCError>)
    expect(mockDomainRepo.updateTabOrder).not.toHaveBeenCalled()
  })

  it('rejects a non-owner with NOT_FOUND without touching the order', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'owner-1' })

    await expect(service.setTabOrder('domain-1', 'stranger-1', ['reminders'])).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<TRPCError>)
    expect(mockDomainRepo.updateTabOrder).not.toHaveBeenCalled()
  })
})
