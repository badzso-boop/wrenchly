import type { PrismaClient, FavoriteMeal } from '@prisma/client'
import { resolveItemAccess } from '../item/item-access.service'

export class FavoriteMealRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<FavoriteMeal | null> {
    const meal = await this.db.favoriteMeal.findUnique({ where: { id } })
    if (!meal) return null
    const access = await resolveItemAccess(this.db, meal.itemId, userId)
    return access ? meal : null
  }

  async listByItemId(itemId: string, userId: string): Promise<FavoriteMeal[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.favoriteMeal.findMany({ where: { itemId }, orderBy: { name: 'asc' } })
  }

  async create(data: { userId: string; itemId: string; name: string; notes: string | null }): Promise<FavoriteMeal> {
    return this.db.favoriteMeal.create({ data })
  }

  async update(id: string, data: Partial<{ name: string; notes: string | null }>): Promise<FavoriteMeal> {
    return this.db.favoriteMeal.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.db.favoriteMeal.delete({ where: { id } })
  }
}
