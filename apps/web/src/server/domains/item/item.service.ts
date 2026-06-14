import { TRPCError } from '@trpc/server'
import { type ItemRepository } from './item.repository'
import { type Item, type ItemStatus } from '@prisma/client'

export class ItemService {
  constructor(private itemRepo: ItemRepository) {}

  async getById(id: string, userId: string): Promise<Item> {
    const item = await this.itemRepo.findByIdAndUserId(id, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    return item
  }

  async list(userId: string, status?: ItemStatus): Promise<Item[]> {
    return this.itemRepo.findAllByUserId(userId, status)
  }

  async create(
    userId: string,
    input: {
      name: string
      type: string
      subtype?: string | null
      brand?: string | null
      model?: string | null
      purchaseDate?: Date | null
      purchasePrice?: number | null
      description?: string | null
      coverPhotoUrl?: string | null
    }
  ): Promise<Item> {
    return this.itemRepo.create({ userId, ...input })
  }

  async update(
    id: string,
    userId: string,
    input: {
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
    const item = await this.itemRepo.findByIdAndUserId(id, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    return this.itemRepo.update(id, input)
  }

  async delete(id: string, userId: string): Promise<void> {
    const item = await this.itemRepo.findByIdAndUserId(id, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    await this.itemRepo.delete(id)
  }
}
