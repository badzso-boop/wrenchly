import { TRPCError } from '@trpc/server'
import { Prisma, type FieldType } from '@prisma/client'
import { type CustomDomainRepository, type CustomDomainWithFields } from './custom-domain.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'

export const TAB_KEYS = [
  'maintenance',
  'reminders',
  'log',
  'statistics',
  'profile',
  'collaborators',
] as const
export type TabKey = (typeof TAB_KEYS)[number]

function slugifyKey(name: string): string {
  const words = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'field'
  return (
    words[0]!.toLowerCase() +
    words
      .slice(1)
      .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
      .join('')
  )
}

export class CustomDomainService {
  constructor(
    private domainRepo: CustomDomainRepository,
    private itemRepo: ItemRepository
  ) {}

  listMine(userId: string): Promise<CustomDomainWithFields[]> {
    return this.domainRepo.listByUserId(userId)
  }

  create(userId: string, input: { name: string; icon?: string | null }) {
    return this.domainRepo.create(userId, input)
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.assertDomainOwnership(id, userId)
    try {
      await this.domainRepo.delete(id)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'errors.custom_domain.has_items',
        })
      }
      throw err
    }
  }

  async setMaintenanceLogEnabled(id: string, userId: string, enabled: boolean): Promise<void> {
    await this.assertDomainOwnership(id, userId)
    await this.domainRepo.updateMaintenanceLogEnabled(id, enabled)
  }

  async setReminderEnabled(id: string, userId: string, enabled: boolean): Promise<void> {
    await this.assertDomainOwnership(id, userId)
    await this.domainRepo.updateReminderEnabled(id, enabled)
  }

  async setTabOrder(id: string, userId: string, tabOrder: TabKey[]): Promise<void> {
    await this.assertDomainOwnership(id, userId)
    const seen = new Set<string>()
    for (const key of tabOrder) {
      if (!TAB_KEYS.includes(key) || seen.has(key)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.invalid_tab_order' })
      }
      seen.add(key)
    }
    await this.domainRepo.updateTabOrder(id, tabOrder)
  }

  async addField(
    customDomainId: string,
    userId: string,
    input: {
      name: string
      fieldType: FieldType
      unit?: string | null
      required?: boolean
      options?: string[]
      order?: number
    }
  ) {
    const domain = await this.assertDomainOwnership(customDomainId, userId)
    this.assertNotPublished(domain)
    return this.domainRepo.addField(customDomainId, { ...input, key: slugifyKey(input.name) })
  }

  async removeField(fieldId: string, userId: string): Promise<void> {
    const field = await this.domainRepo.findFieldById(fieldId)
    if (!field) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.field_not_found' })
    const domain = await this.assertDomainOwnership(field.customDomainId, userId)
    this.assertNotPublished(domain)
    await this.domainRepo.removeField(fieldId)
  }

  /** Publishing locks the WHOLE domain's field structure, profile fields included, not just the
   * loggable Log-tab fields -- a deliberate simplicity choice (one lock, one mental model) rather
   * than letting profile fields stay editable after publish. Flagging as a judgment call: revisit
   * if this turns out to be too restrictive for real usage. */
  private assertNotPublished(domain: CustomDomainWithFields): void {
    if (domain.isPublished) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.custom_domain.published_locked' })
    }
  }

  async getItemData(itemId: string, userId: string) {
    await this.assertItemOwnership(itemId, userId)
    const itemData = await this.domainRepo.findItemData(itemId)
    if (!itemData) return null
    const domain = await this.domainRepo.findById(itemData.customDomainId)
    return { itemData, domain }
  }

  async attachItem(itemId: string, userId: string, customDomainId: string) {
    const item = await this.assertItemOwnership(itemId, userId)
    if (item.type !== 'CUSTOM') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.item_not_custom_type' })
    }
    await this.assertDomainOwnership(customDomainId, userId)

    const existing = await this.domainRepo.findItemData(itemId)
    if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'errors.custom_domain.already_attached' })

    return this.domainRepo.attachItem(itemId, customDomainId)
  }

  async upsertItemData(itemId: string, userId: string, data: Record<string, unknown>) {
    await this.assertItemOwnership(itemId, userId)
    const existing = await this.domainRepo.findItemData(itemId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.not_attached' })

    const domain = await this.domainRepo.findById(existing.customDomainId)
    const allowedKeys = new Set((domain?.fields ?? []).map((f) => f.key))
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (allowedKeys.has(key)) cleaned[key] = value
    }

    return this.domainRepo.updateItemData(itemId, cleaned)
  }

  private async assertDomainOwnership(domainId: string, userId: string): Promise<CustomDomainWithFields> {
    const domain = await this.domainRepo.findById(domainId)
    if (!domain || domain.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.not_found' })
    }
    return domain
  }

  private async assertItemOwnership(itemId: string, userId: string) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    return item
  }
}
