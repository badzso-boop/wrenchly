import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FavoriteMealService } from '@/server/domains/favorite-meal/favorite-meal.service'
import * as fuzzyMatch from '@/server/domains/cooking/fuzzy-match'

vi.mock('@/server/domains/cooking/fuzzy-match', () => ({
  findSimilarMealNames: vi.fn(),
}))

const mockRepo = {
  findByIdAndUserId: vi.fn(),
  listByItemId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
}

const mockDb = {} as any

const service = new FavoriteMealService(mockRepo as any, mockItemRepo as any, mockDb)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FavoriteMealService.create', () => {
  const baseInput = { itemId: 'item-1', name: 'Rántott hús' }

  it('throws NOT_FOUND when the item does not belong to the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.create('user-1', baseInput)).rejects.toThrow('errors.item.not_found')
  })

  it('throws BAD_REQUEST when the item is not type HOME', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'PET' })
    await expect(service.create('user-1', baseInput)).rejects.toThrow('errors.favorite_meal.not_home_item')
  })

  it('returns possible_duplicate when a similar name exists (e.g. a cooking-log entry with a near name)', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    vi.mocked(fuzzyMatch.findSimilarMealNames).mockResolvedValue([{ name: 'Rantott hus', similarity: 0.75 }])

    const result = await service.create('user-1', baseInput)

    expect(result).toEqual({ status: 'possible_duplicate', candidates: [{ name: 'Rantott hus', similarity: 0.75 }] })
    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('creates normally when no similar name is found', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    vi.mocked(fuzzyMatch.findSimilarMealNames).mockResolvedValue([])
    mockRepo.create.mockResolvedValue({ id: 'fav-1', name: 'Rántott hús' })

    const result = await service.create('user-1', baseInput)

    expect(result).toEqual({ status: 'created', favorite: { id: 'fav-1', name: 'Rántott hús' } })
  })

  it('skips the fuzzy-match check when forceNew is true', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.create.mockResolvedValue({ id: 'fav-1' })

    await service.create('user-1', baseInput, true)

    expect(fuzzyMatch.findSimilarMealNames).not.toHaveBeenCalled()
  })
})

describe('FavoriteMealService.update/delete', () => {
  it('throws NOT_FOUND on update when the favorite does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.update('fav-1', 'user-1', { name: 'X' })).rejects.toThrow('errors.favorite_meal.not_found')
  })

  it('throws NOT_FOUND on delete when the favorite does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.delete('fav-1', 'user-1')).rejects.toThrow('errors.favorite_meal.not_found')
  })

  it('updates successfully when owned', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'fav-1' })
    mockRepo.update.mockResolvedValue({ id: 'fav-1', name: 'New name' })

    const result = await service.update('fav-1', 'user-1', { name: 'New name' })
    expect(result).toEqual({ id: 'fav-1', name: 'New name' })
  })
})
