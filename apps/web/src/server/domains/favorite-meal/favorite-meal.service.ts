import { TRPCError } from '@trpc/server'
import type { FavoriteMeal, PrismaClient } from '@prisma/client'
import { type FavoriteMealRepository } from './favorite-meal.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { findSimilarMealNames, type SimilarMealName } from '@/server/domains/cooking/fuzzy-match'

export type CreateFavoriteMealResult =
  | { status: 'created'; favorite: FavoriteMeal }
  | { status: 'possible_duplicate'; candidates: SimilarMealName[] }

export class FavoriteMealService {
  constructor(
    private repo: FavoriteMealRepository,
    private itemRepo: ItemRepository,
    private db: PrismaClient
  ) {}

  async create(
    userId: string,
    input: { itemId: string; name: string; notes?: string | null },
    forceNew = false
  ): Promise<CreateFavoriteMealResult> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    if (item.type !== 'HOME') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.favorite_meal.not_home_item' })
    }

    if (!forceNew) {
      const candidates = await findSimilarMealNames(this.db, input.itemId, input.name)
      if (candidates.length > 0) return { status: 'possible_duplicate', candidates }
    }

    const favorite = await this.repo.create({
      userId,
      itemId: input.itemId,
      name: input.name,
      notes: input.notes ?? null,
    })
    return { status: 'created', favorite }
  }

  async update(id: string, userId: string, input: { name?: string; notes?: string | null }): Promise<FavoriteMeal> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.favorite_meal.not_found' })
    return this.repo.update(id, input)
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.favorite_meal.not_found' })
    await this.repo.delete(id)
  }

  async listByItemId(itemId: string, userId: string): Promise<FavoriteMeal[]> {
    return this.repo.listByItemId(itemId, userId)
  }
}
