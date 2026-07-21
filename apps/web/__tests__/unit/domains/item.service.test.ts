import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ItemService } from '@/server/domains/item/item.service'
import { TRPCError } from '@trpc/server'
import { ItemStatus, ItemType } from '@prisma/client'

const mockItemRepo = {
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const service = new ItemService(mockItemRepo as any)

beforeEach(() => vi.clearAllMocks())

describe('ItemService.getById', () => {
  it('returns item when found for user', async () => {
    const item = { id: '1', userId: 'user-1', name: 'Car' }
    mockItemRepo.findByIdAndUserId.mockResolvedValue(item)

    const result = await service.getById('1', 'user-1')
    expect(result).toEqual(item)
  })

  it('throws NOT_FOUND when item does not exist', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.getById('1', 'user-1')).rejects.toThrow(TRPCError)
    await expect(service.getById('1', 'user-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'errors.item.not_found',
    })
  })
})

describe('ItemService.create', () => {
  it('creates item with userId', async () => {
    const input = { name: 'Ford Focus', type: ItemType.VEHICLE }
    const created = { id: '1', userId: 'user-1', ...input }
    mockItemRepo.create.mockResolvedValue(created)

    const result = await service.create('user-1', input)
    expect(result).toEqual(created)
    expect(mockItemRepo.create).toHaveBeenCalledWith({ userId: 'user-1', ...input })
  })
})

describe('ItemService.update', () => {
  it('updates item when user owns it', async () => {
    const item = { id: '1', userId: 'user-1', name: 'Old Name' }
    const updated = { ...item, name: 'New Name' }
    mockItemRepo.findByIdAndUserId.mockResolvedValue(item)
    mockItemRepo.update.mockResolvedValue(updated)

    const result = await service.update('1', 'user-1', { name: 'New Name' })
    expect(result).toEqual(updated)
  })

  it('throws NOT_FOUND when item belongs to another user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.update('1', 'user-2', { name: 'X' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('ItemService.delete', () => {
  it('deletes item when user owns it', async () => {
    const item = { id: '1', userId: 'user-1' }
    mockItemRepo.findByIdAndUserId.mockResolvedValue(item)
    mockItemRepo.delete.mockResolvedValue(undefined)

    await service.delete('1', 'user-1')
    expect(mockItemRepo.delete).toHaveBeenCalledWith('1')
  })

  it('throws NOT_FOUND when item not found', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)

    await expect(service.delete('1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('ItemService.list', () => {
  it('returns items for user with status filter', async () => {
    const items = [{ id: '1', status: ItemStatus.ACTIVE }]
    mockItemRepo.findAllByUserId.mockResolvedValue(items)

    const result = await service.list('user-1', ItemStatus.ACTIVE)
    expect(result).toEqual(items)
    expect(mockItemRepo.findAllByUserId).toHaveBeenCalledWith('user-1', ItemStatus.ACTIVE)
  })
})
