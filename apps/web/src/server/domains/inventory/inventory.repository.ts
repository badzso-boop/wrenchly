import { type PrismaClient, type InventoryItem } from '@prisma/client'

export class InventoryRepository {
  constructor(private db: PrismaClient) {}

  async findAllByUserId(userId: string): Promise<InventoryItem[]> {
    return this.db.inventoryItem.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
  }

  async findByIdAndUserId(id: string, userId: string): Promise<InventoryItem | null> {
    return this.db.inventoryItem.findFirst({ where: { id, userId } })
  }

  async create(data: {
    userId: string
    name: string
    category: string
    brand?: string | null
    spec?: string | null
    quantity: number
    unit: string
    location?: string | null
    minQuantity?: number | null
    costPerUnit?: number | null
    expiryDate?: Date | null
    purchaseDate?: Date | null
    notes?: string | null
  }): Promise<InventoryItem> {
    return this.db.inventoryItem.create({ data })
  }

  async update(
    id: string,
    data: {
      name?: string
      category?: string
      brand?: string | null
      spec?: string | null
      quantity?: number
      unit?: string
      location?: string | null
      minQuantity?: number | null
      costPerUnit?: number | null
      notes?: string | null
    }
  ): Promise<InventoryItem> {
    return this.db.inventoryItem.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.db.inventoryItem.delete({ where: { id } })
  }
}
