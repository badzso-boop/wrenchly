import type { PrismaClient, FavoriteMeal } from '@prisma/client'

export class FavoriteMealRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<FavoriteMeal | null> {
    return this.db.favoriteMeal.findFirst({ where: { id, userId } })
  }

  async listByItemId(itemId: string, userId: string): Promise<FavoriteMeal[]> {
    return this.db.favoriteMeal.findMany({ where: { itemId, userId }, orderBy: { name: 'asc' } })
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
