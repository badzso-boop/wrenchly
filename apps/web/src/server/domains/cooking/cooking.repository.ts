import type { PrismaClient, CookingLogEntry, ShoppingListItem } from '@prisma/client'

export class CookingRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<CookingLogEntry | null> {
    return this.db.cookingLogEntry.findFirst({ where: { id, userId } })
  }

  async listByItemId(itemId: string, userId: string): Promise<CookingLogEntry[]> {
    return this.db.cookingLogEntry.findMany({
      where: { itemId, userId },
      orderBy: { cookedAt: 'desc' },
    })
  }

  async create(data: {
    userId: string
    itemId: string
    name: string
    ingredients: string | null
    servings: number | null
    daysCovered: number | null
    cost: number | null
    currency: string
    linkedTransactionId: string | null
    cookedAt: Date
  }): Promise<CookingLogEntry> {
    return this.db.cookingLogEntry.create({ data })
  }

  async update(
    id: string,
    data: Partial<{
      name: string
      ingredients: string | null
      servings: number | null
      daysCovered: number | null
      cost: number | null
      currency: string
      linkedTransactionId: string | null
      cookedAt: Date
    }>
  ): Promise<CookingLogEntry> {
    return this.db.cookingLogEntry.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.db.cookingLogEntry.delete({ where: { id } })
  }

  async findTransactionByIdAndItemId(id: string, itemId: string) {
    return this.db.householdTransaction.findFirst({ where: { id, itemId } })
  }

  async findShoppingListItemsByIdsAndUser(ids: string[], userId: string): Promise<ShoppingListItem[]> {
    return this.db.shoppingListItem.findMany({ where: { id: { in: ids }, userId } })
  }

  async assignShoppingListItemsToCookingLogEntry(ids: string[], cookingLogEntryId: string): Promise<void> {
    await this.db.shoppingListItem.updateMany({
      where: { id: { in: ids } },
      data: { cookingLogEntryId },
    })
  }

  async createShoppingListItemsForRecipe(
    userId: string,
    cookingLogEntryId: string,
    names: string[]
  ): Promise<ShoppingListItem[]> {
    await this.db.shoppingListItem.createMany({
      data: names.map((name) => ({ userId, name, cookingLogEntryId })),
    })
    return this.db.shoppingListItem.findMany({ where: { cookingLogEntryId }, orderBy: { createdAt: 'desc' } })
  }
}
