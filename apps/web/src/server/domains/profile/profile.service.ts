import { TRPCError } from '@trpc/server'
import { type ProfileRepository } from './profile.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { getProfileFields, type ProfileFieldDef } from './profile.fields'

export class ProfileService {
  constructor(
    private profileRepo: ProfileRepository,
    private itemRepo: ItemRepository
  ) {}

  async getByItemId(itemId: string, userId: string): Promise<Record<string, unknown> | null> {
    const item = await this.assertItemOwnership(itemId, userId)
    this.assertProfileSupported(item.type)
    return this.profileRepo.find(item.type, itemId)
  }

  async upsert(
    itemId: string,
    userId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const item = await this.assertItemOwnership(itemId, userId)
    const fields = this.assertProfileSupported(item.type)

    const cleaned = this.pickKnownFields(fields, data)
    return this.profileRepo.upsert(item.type, itemId, cleaned)
  }

  private async assertItemOwnership(itemId: string, userId: string) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    return item
  }

  private assertProfileSupported(itemType: string): ProfileFieldDef[] {
    const fields = getProfileFields(itemType as Parameters<typeof getProfileFields>[0])
    if (!fields) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.profile.not_supported' })
    }
    return fields
  }

  // Drops any key not declared in the field registry, so callers can't write arbitrary columns.
  private pickKnownFields(
    fields: ProfileFieldDef[],
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const allowedKeys = new Set(fields.map((f) => f.key))
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (allowedKeys.has(key)) result[key] = value
    }
    return result
  }
}
