import { TRPCError } from '@trpc/server'
import type { CookingLogEntry, ShoppingListItem, PrismaClient } from '@prisma/client'
import { type CookingRepository } from './cooking.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { findSimilarMealNames, type SimilarMealName } from './fuzzy-match'

interface CookingLogCreateInput {
  itemId: string
  name: string
  ingredients?: string | null
  servings?: number | null
  daysCovered?: number | null
  cost?: number | null
  currency?: string
  linkedTransactionId?: string | null
  cookedAt: Date
}

interface CookingLogUpdateInput {
  name?: string
  ingredients?: string | null
  servings?: number | null
  daysCovered?: number | null
  cost?: number | null
  currency?: string
  linkedTransactionId?: string | null
  cookedAt?: Date
}

export type CreateCookingLogEntryResult =
  | { status: 'created'; entry: CookingLogEntry }
  | { status: 'possible_duplicate'; candidates: SimilarMealName[] }

export class CookingService {
  constructor(
    private repo: CookingRepository,
    private itemRepo: ItemRepository,
    private db: PrismaClient
  ) {}

  async create(
    userId: string,
    input: CookingLogCreateInput,
    forceNew = false
  ): Promise<CreateCookingLogEntryResult> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    if (item.type !== 'HOME') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.cooking.not_home_item' })
    }

    if (input.linkedTransactionId) {
      const tx = await this.repo.findTransactionByIdAndItemId(input.linkedTransactionId, input.itemId)
      if (!tx) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.linked_transaction_not_found' })
    }

    if (!forceNew) {
      const candidates = await findSimilarMealNames(this.db, input.itemId, input.name)
      if (candidates.length > 0) return { status: 'possible_duplicate', candidates }
    }

    const entry = await this.repo.create({
      userId,
      itemId: input.itemId,
      name: input.name,
      ingredients: input.ingredients ?? null,
      servings: input.servings ?? null,
      daysCovered: input.daysCovered ?? null,
      cost: input.cost ?? null,
      currency: input.currency ?? 'HUF',
      linkedTransactionId: input.linkedTransactionId ?? null,
      cookedAt: input.cookedAt,
    })
    return { status: 'created', entry }
  }

  async update(id: string, userId: string, input: CookingLogUpdateInput): Promise<CookingLogEntry> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.not_found' })

    if (input.linkedTransactionId) {
      const tx = await this.repo.findTransactionByIdAndItemId(input.linkedTransactionId, existing.itemId)
      if (!tx) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.linked_transaction_not_found' })
    }

    return this.repo.update(id, input)
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.not_found' })
    await this.repo.delete(id)
  }

  async listByItemId(itemId: string, userId: string): Promise<CookingLogEntry[]> {
    return this.repo.listByItemId(itemId, userId)
  }

  // "Ezekből főztem" — assign existing shopping-list rows (owned by this user) to a cooking-log
  // entry the user also owns.
  async assignShoppingListItems(
    cookingLogEntryId: string,
    userId: string,
    shoppingListItemIds: string[]
  ): Promise<void> {
    const entry = await this.repo.findByIdAndUserId(cookingLogEntryId, userId)
    if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.not_found' })

    const owned = await this.repo.findShoppingListItemsByIdsAndUser(shoppingListItemIds, userId)
    if (owned.length !== shoppingListItemIds.length) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.shopping_list_item_not_found' })
    }

    await this.repo.assignShoppingListItemsToCookingLogEntry(shoppingListItemIds, cookingLogEntryId)
  }

  // "Bevásárlólistára" — create new shopping-list rows (missing ingredients, typed by the user)
  // pre-tagged with this cooking-log entry.
  async createShoppingListItemsForRecipe(
    cookingLogEntryId: string,
    userId: string,
    names: string[]
  ): Promise<ShoppingListItem[]> {
    const entry = await this.repo.findByIdAndUserId(cookingLogEntryId, userId)
    if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.cooking.not_found' })
    if (names.length === 0) return []
    return this.repo.createShoppingListItemsForRecipe(userId, cookingLogEntryId, names)
  }
}
