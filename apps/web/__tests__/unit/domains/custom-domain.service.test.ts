import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { CustomDomainService } from '@/server/domains/custom-domain/custom-domain.service'

const mockDomainRepo = {
  findById: vi.fn(),
  updateMaintenanceLogEnabled: vi.fn(),
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
