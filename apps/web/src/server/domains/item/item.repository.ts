import { type PrismaClient, type Item, type ItemStatus, type ItemType } from '@prisma/client'

export class ItemRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<Item | null> {
    return this.db.item.findUnique({ where: { id } })
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Item | null> {
    return this.db.item.findFirst({ where: { id, userId } })
  }

  async findAllByUserId(userId: string, status?: ItemStatus): Promise<Item[]> {
    return this.db.item.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: {
    userId: string
    name: string
    type: ItemType
    subtype?: string | null
    brand?: string | null
    model?: string | null
    purchaseDate?: Date | null
    purchasePrice?: number | null
    description?: string | null
    coverPhotoUrl?: string | null
  }): Promise<Item> {
    return this.db.item.create({ data })
  }

  async update(
    id: string,
    data: {
      name?: string
      subtype?: string | null
      brand?: string | null
      model?: string | null
      purchaseDate?: Date | null
      purchasePrice?: number | null
      description?: string | null
      status?: ItemStatus
      coverPhotoUrl?: string | null
    }
  ): Promise<Item> {
    return this.db.item.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.db.item.delete({ where: { id } })
  }
}
