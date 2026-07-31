import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CookingService } from '@/server/domains/cooking/cooking.service'
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
  findTransactionByIdAndItemId: vi.fn(),
  findShoppingListItemsByIdsAndUser: vi.fn(),
  assignShoppingListItemsToCookingLogEntry: vi.fn(),
  createShoppingListItemsForRecipe: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
}

const mockDb = {} as any

const service = new CookingService(mockRepo as any, mockItemRepo as any, mockDb)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CookingService.create', () => {
  const baseInput = { itemId: 'item-1', name: 'Carbonara', cookedAt: new Date('2026-07-01') }

  it('throws NOT_FOUND when the item does not belong to the user', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.create('user-1', baseInput)).rejects.toThrow('errors.item.not_found')
  })

  it('throws BAD_REQUEST when the item is not type HOME', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'VEHICLE' })
    await expect(service.create('user-1', baseInput)).rejects.toThrow('errors.cooking.not_home_item')
  })

  it('returns possible_duplicate when a similar name exists, without creating', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    vi.mocked(fuzzyMatch.findSimilarMealNames).mockResolvedValue([{ name: 'Carbonarat', similarity: 0.8 }])

    const result = await service.create('user-1', baseInput)

    expect(result).toEqual({ status: 'possible_duplicate', candidates: [{ name: 'Carbonarat', similarity: 0.8 }] })
    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('creates normally when no similar name is found', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    vi.mocked(fuzzyMatch.findSimilarMealNames).mockResolvedValue([])
    mockRepo.create.mockResolvedValue({ id: 'entry-1', name: 'Carbonara' })

    const result = await service.create('user-1', baseInput)

    expect(result).toEqual({ status: 'created', entry: { id: 'entry-1', name: 'Carbonara' } })
  })

  it('skips the fuzzy-match check entirely when forceNew is true, even with a close match available', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.create.mockResolvedValue({ id: 'entry-1' })

    await service.create('user-1', baseInput, true)

    expect(fuzzyMatch.findSimilarMealNames).not.toHaveBeenCalled()
    expect(mockRepo.create).toHaveBeenCalled()
  })

  it('returns multiple candidates in the possible_duplicate response', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    vi.mocked(fuzzyMatch.findSimilarMealNames).mockResolvedValue([
      { name: 'Carbonarat', similarity: 0.8 },
      { name: 'Carbonare', similarity: 0.6 },
      { name: 'Carbo', similarity: 0.35 },
    ])

    const result = await service.create('user-1', baseInput)

    expect(result.status).toBe('possible_duplicate')
    if (result.status === 'possible_duplicate') expect(result.candidates).toHaveLength(3)
  })

  it('throws NOT_FOUND when linkedTransactionId does not belong to the same item', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findTransactionByIdAndItemId.mockResolvedValue(null)

    await expect(service.create('user-1', { ...baseInput, linkedTransactionId: 'tx-1' })).rejects.toThrow(
      'errors.cooking.linked_transaction_not_found'
    )
  })

  it('accepts a valid linkedTransactionId', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1', type: 'HOME' })
    mockRepo.findTransactionByIdAndItemId.mockResolvedValue({ id: 'tx-1' })
    vi.mocked(fuzzyMatch.findSimilarMealNames).mockResolvedValue([])
    mockRepo.create.mockResolvedValue({ id: 'entry-1' })

    const result = await service.create('user-1', { ...baseInput, linkedTransactionId: 'tx-1' })
    expect(result.status).toBe('created')
  })
})

describe('CookingService.update/delete', () => {
  it('throws NOT_FOUND on update when the entry does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.update('entry-1', 'user-1', { name: 'X' })).rejects.toThrow('errors.cooking.not_found')
  })

  it('throws NOT_FOUND on delete when the entry does not belong to the user', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.delete('entry-1', 'user-1')).rejects.toThrow('errors.cooking.not_found')
  })
})

describe('CookingService shopping-list integration', () => {
  it('assignShoppingListItems throws NOT_FOUND when the cooking-log entry is not owned', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue(null)
    await expect(service.assignShoppingListItems('entry-1', 'user-1', ['sli-1'])).rejects.toThrow(
      'errors.cooking.not_found'
    )
  })

  it('assignShoppingListItems throws NOT_FOUND when a shopping-list item is not owned', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'entry-1' })
    mockRepo.findShoppingListItemsByIdsAndUser.mockResolvedValue([{ id: 'sli-1' }])

    await expect(service.assignShoppingListItems('entry-1', 'user-1', ['sli-1', 'sli-2'])).rejects.toThrow(
      'errors.cooking.shopping_list_item_not_found'
    )
  })

  it('assignShoppingListItems succeeds when all items are owned', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'entry-1' })
    mockRepo.findShoppingListItemsByIdsAndUser.mockResolvedValue([{ id: 'sli-1' }, { id: 'sli-2' }])

    await service.assignShoppingListItems('entry-1', 'user-1', ['sli-1', 'sli-2'])

    expect(mockRepo.assignShoppingListItemsToCookingLogEntry).toHaveBeenCalledWith(['sli-1', 'sli-2'], 'entry-1')
  })

  it('createShoppingListItemsForRecipe returns [] for an empty name list without hitting the repo', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'entry-1' })

    const result = await service.createShoppingListItemsForRecipe('entry-1', 'user-1', [])

    expect(result).toEqual([])
    expect(mockRepo.createShoppingListItemsForRecipe).not.toHaveBeenCalled()
  })

  it('createShoppingListItemsForRecipe creates rows for provided names', async () => {
    mockRepo.findByIdAndUserId.mockResolvedValue({ id: 'entry-1' })
    mockRepo.createShoppingListItemsForRecipe.mockResolvedValue([{ id: 'sli-1', name: 'Pasta' }])

    const result = await service.createShoppingListItemsForRecipe('entry-1', 'user-1', ['Pasta'])

    expect(mockRepo.createShoppingListItemsForRecipe).toHaveBeenCalledWith('user-1', 'entry-1', ['Pasta'])
    expect(result).toEqual([{ id: 'sli-1', name: 'Pasta' }])
  })
})
