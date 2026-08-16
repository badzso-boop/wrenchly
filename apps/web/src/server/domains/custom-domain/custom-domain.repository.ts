import {
  type PrismaClient,
  type CustomDomain,
  type CustomDomainField,
  type CustomDomainFieldConfig,
  type CustomItemData,
  type CustomItemDataEntry,
  type CustomDomainFieldValue,
  type CustomDomainChart,
  type ChartType,
  type ChartAggregation,
  type FieldType,
  Prisma,
} from '@prisma/client'
import { resolveItemAccess } from '../item/item-access.service'

export type FieldWithConfig = CustomDomainField & { fieldConfig: CustomDomainFieldConfig | null }
export type CustomDomainWithFields = CustomDomain & { fields: FieldWithConfig[] }
export type EntryWithValues = CustomItemDataEntry & {
  values: (CustomDomainFieldValue & { field: CustomDomainField })[]
}
export type ChartWithField = CustomDomainChart & { field: CustomDomainField }
export type CustomDomainStoreListing = CustomDomainWithFields & {
  customItemDataEntries: EntryWithValues[]
  importCount: number
}

export class CustomDomainRepository {
  constructor(private db: PrismaClient) {}

  async listByUserId(userId: string): Promise<CustomDomainWithFields[]> {
    return this.db.customDomain.findMany({
      where: { userId },
      include: { fields: { orderBy: { order: 'asc' }, include: { fieldConfig: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string): Promise<CustomDomainWithFields | null> {
    return this.db.customDomain.findUnique({
      where: { id },
      include: { fields: { orderBy: { order: 'asc' }, include: { fieldConfig: true } } },
    })
  }

  async create(userId: string, data: { name: string; icon?: string | null }): Promise<CustomDomain> {
    return this.db.customDomain.create({ data: { userId, ...data } })
  }

  async delete(id: string): Promise<void> {
    await this.db.customDomain.delete({ where: { id } })
  }

  async addField(
    customDomainId: string,
    data: {
      name: string
      key: string
      fieldType: FieldType
      unit?: string | null
      required?: boolean
      options?: string[]
      order?: number
    }
  ): Promise<CustomDomainField> {
    return this.db.customDomainField.create({ data: { customDomainId, ...data } })
  }

  async findFieldById(fieldId: string): Promise<CustomDomainField | null> {
    return this.db.customDomainField.findUnique({ where: { id: fieldId } })
  }

  async removeField(fieldId: string): Promise<void> {
    await this.db.customDomainField.delete({ where: { id: fieldId } })
  }

  async findItemData(itemId: string): Promise<CustomItemData | null> {
    return this.db.customItemData.findUnique({ where: { itemId } })
  }

  async attachItem(itemId: string, customDomainId: string): Promise<CustomItemData> {
    return this.db.customItemData.create({ data: { itemId, customDomainId, data: {} } })
  }

  async updateItemData(itemId: string, data: Record<string, unknown>): Promise<CustomItemData> {
    return this.db.customItemData.update({
      where: { itemId },
      data: { data: data as Prisma.InputJsonValue },
    })
  }

  /** The "sample item" for a published domain's own sample-data editor is simply the oldest Item
   * the publisher has attached to this domain -- there's no separate sample-item flag/concept,
   * this is a deliberate reuse of whatever the publisher already has rather than a new model. */
  async findSampleItemForDomain(customDomainId: string, userId: string) {
    const itemData = await this.db.customItemData.findFirst({
      where: { customDomainId, item: { userId } },
      orderBy: { item: { createdAt: 'asc' } },
      include: { item: true },
    })
    return itemData?.item ?? null
  }

  // ─── Log-tab widget builder ────────────────────────────────────────────────

  async listLoggableFields(customDomainId: string, includeArchived = false): Promise<FieldWithConfig[]> {
    return this.db.customDomainField.findMany({
      where: {
        customDomainId,
        loggable: true,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      include: { fieldConfig: true },
      orderBy: { order: 'asc' },
    })
  }

  async findFieldWithConfig(fieldId: string): Promise<FieldWithConfig | null> {
    return this.db.customDomainField.findUnique({
      where: { id: fieldId },
      include: { fieldConfig: true },
    })
  }

  async addLoggableField(
    customDomainId: string,
    data: {
      name: string
      key: string
      fieldType: FieldType
      unit?: string | null
      required?: boolean
      options?: string[]
      order: number
      widthCols: number
      config?: {
        minValue?: number | null
        maxValue?: number | null
        decimalPlaces?: number | null
        maxLength?: number | null
        helpText?: string | null
      } | null
    }
  ): Promise<FieldWithConfig> {
    const { config, ...fieldData } = data
    return this.db.customDomainField.create({
      data: {
        customDomainId,
        ...fieldData,
        loggable: true,
        fieldConfig: config ? { create: config } : undefined,
      },
      include: { fieldConfig: true },
    })
  }

  async updateLoggableField(
    fieldId: string,
    data: {
      name?: string
      unit?: string | null
      required?: boolean
      options?: string[]
      widthCols?: number
      config?: {
        minValue?: number | null
        maxValue?: number | null
        decimalPlaces?: number | null
        maxLength?: number | null
        helpText?: string | null
      } | null
    }
  ): Promise<FieldWithConfig> {
    const { config, ...fieldData } = data
    return this.db.customDomainField.update({
      where: { id: fieldId },
      data: {
        ...fieldData,
        fieldConfig: config
          ? { upsert: { create: config, update: config } }
          : undefined,
      },
      include: { fieldConfig: true },
    })
  }

  async archiveField(fieldId: string): Promise<void> {
    await this.db.customDomainField.update({ where: { id: fieldId }, data: { archivedAt: new Date() } })
  }

  async reorderFields(orderedFieldIds: string[]): Promise<void> {
    await this.db.$transaction(
      orderedFieldIds.map((id, index) =>
        this.db.customDomainField.update({ where: { id }, data: { order: index } })
      )
    )
  }

  async findEntryById(entryId: string): Promise<EntryWithValues | null> {
    return this.db.customItemDataEntry.findUnique({
      where: { id: entryId },
      include: { values: { include: { field: true } } },
    })
  }

  /** Owner OR an ACCEPTED collaborator on the entry's item — NOT "only the user who
   * originally logged this entry" (entry.userId is attribution, not access control). */
  async findEntryByIdAndUserId(entryId: string, userId: string): Promise<EntryWithValues | null> {
    const entry = await this.db.customItemDataEntry.findUnique({
      where: { id: entryId },
      include: { values: { include: { field: true } } },
    })
    if (!entry) return null
    const access = await resolveItemAccess(this.db, entry.itemId, userId)
    return access ? entry : null
  }

  async listEntriesByItemId(itemId: string): Promise<EntryWithValues[]> {
    return this.db.customItemDataEntry.findMany({
      where: { itemId },
      include: { values: { include: { field: true } } },
      orderBy: { recordedAt: 'desc' },
    })
  }

  async listAllEntriesByItemId(itemId: string): Promise<EntryWithValues[]> {
    return this.db.customItemDataEntry.findMany({
      where: { itemId },
      include: { values: { include: { field: true } } },
      orderBy: { recordedAt: 'asc' },
    })
  }

  async createEntry(data: {
    itemId: string
    customDomainId: string
    userId: string
    recordedAt: Date
    values: Array<{
      fieldId: string
      valueString?: string | null
      valueNumber?: number | null
      valueBoolean?: boolean | null
      valueDate?: Date | null
      valueJson?: string[]
    }>
  }): Promise<EntryWithValues> {
    const { values, ...entry } = data
    return this.db.customItemDataEntry.create({
      data: {
        ...entry,
        values: values.length > 0 ? { create: values } : undefined,
      },
      include: { values: { include: { field: true } } },
    })
  }

  async updateEntryRecordedAt(entryId: string, recordedAt: Date): Promise<void> {
    await this.db.customItemDataEntry.update({ where: { id: entryId }, data: { recordedAt } })
  }

  /** Only touches the (entry, field) pairs actually present in `ops` -- a field not mentioned
   * (e.g. because it's archived, or a caller only means to patch one field) is left exactly as it
   * was. This is what makes editing an old entry safe: it can never silently wipe a value for a
   * field the update call didn't mention, including an archived field's historical value. */
  async applyEntryValueOps(
    entryId: string,
    ops: Array<
      | {
          fieldId: string
          action: 'set'
          value: {
            valueString?: string | null
            valueNumber?: number | null
            valueBoolean?: boolean | null
            valueDate?: Date | null
            valueJson?: string[]
          }
        }
      | { fieldId: string; action: 'clear' }
    >
  ): Promise<void> {
    if (ops.length === 0) return
    await this.db.$transaction(
      ops.map((op) =>
        op.action === 'set'
          ? this.db.customDomainFieldValue.upsert({
              where: { entryId_fieldId: { entryId, fieldId: op.fieldId } },
              create: { entryId, fieldId: op.fieldId, ...op.value },
              update: op.value,
            })
          : this.db.customDomainFieldValue.deleteMany({ where: { entryId, fieldId: op.fieldId } })
      )
    )
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.db.customItemDataEntry.delete({ where: { id: entryId } })
  }

  /** "Publish to the store" is the only UI path that exposes a domain outside its owner -- there's
   * no separate visibility toggle, so publishing also flips `isPublic` (the store listing query
   * requires both `isPublished` and `isPublic`, matching the pre-existing profile-sharing flag). */
  async publishDomain(customDomainId: string): Promise<CustomDomain> {
    return this.db.customDomain.update({
      where: { id: customDomainId },
      data: { isPublished: true, isPublic: true, publishedAt: new Date() },
    })
  }

  /** Store listing includes each domain's single most-recent entry (by recordedAt, across any
   * item attached to it -- CustomItemDataEntry carries customDomainId directly, no need to know
   * a specific item) as a read-only "sample data" preview for browsers who don't own the domain.
   * Also carries `importCount` -- how many other CustomDomain rows point back at this one via
   * `sourceDomainId` -- as a popularity proxy, sorted most-imported first. `sourceDomainId` is a
   * plain pointer (not a Prisma relation, see its schema comment), so the count is a separate
   * `groupBy` rather than an include. */
  async listPublished(): Promise<CustomDomainStoreListing[]> {
    const domains = await this.db.customDomain.findMany({
      where: { isPublished: true, isPublic: true },
      include: {
        fields: { where: { archivedAt: null }, orderBy: { order: 'asc' }, include: { fieldConfig: true } },
        customItemDataEntries: {
          take: 1,
          orderBy: { recordedAt: 'desc' },
          include: { values: { include: { field: true } } },
        },
      },
    })
    if (domains.length === 0) return []

    const importCounts = await this.db.customDomain.groupBy({
      by: ['sourceDomainId'],
      where: { sourceDomainId: { in: domains.map((d) => d.id) } },
      _count: { _all: true },
    })
    const countByDomainId = new Map(importCounts.map((c) => [c.sourceDomainId!, c._count._all]))

    return domains
      .map((d) => ({ ...d, importCount: countByDomainId.get(d.id) ?? 0 }))
      .sort((a, b) => b.importCount - a.importCount)
  }

  /** Deep-copies a published domain's structure (fields + their configs) under a new owner, with
   * brand new ids throughout -- no shared references between the original and the clone, and no
   * CustomItemData/CustomItemDataEntry/value rows are copied (the importer starts with an empty log). */
  async cloneDomain(
    sourceDomainId: string,
    newOwnerUserId: string
  ): Promise<CustomDomainWithFields> {
    const source = await this.db.customDomain.findUnique({
      where: { id: sourceDomainId },
      include: { fields: { where: { archivedAt: null }, include: { fieldConfig: true }, orderBy: { order: 'asc' } } },
    })
    if (!source) throw new Error('source domain not found')

    return this.db.customDomain.create({
      data: {
        userId: newOwnerUserId,
        name: source.name,
        icon: source.icon,
        isPublic: false,
        isPublished: false,
        sourceDomainId: source.id,
        fields: {
          create: source.fields.map((f) => ({
            name: f.name,
            key: f.key,
            fieldType: f.fieldType,
            unit: f.unit,
            required: f.required,
            options: f.options,
            order: f.order,
            widthCols: f.widthCols,
            loggable: f.loggable,
            fieldConfig: f.fieldConfig
              ? {
                  create: {
                    minValue: f.fieldConfig.minValue,
                    maxValue: f.fieldConfig.maxValue,
                    decimalPlaces: f.fieldConfig.decimalPlaces,
                    maxLength: f.fieldConfig.maxLength,
                    helpText: f.fieldConfig.helpText,
                  },
                }
              : undefined,
          })),
        },
      },
      include: { fields: { orderBy: { order: 'asc' }, include: { fieldConfig: true } } },
    })
  }

  // ─── Statistics: user-defined charts over a domain's loggable fields ─────────

  async listCharts(customDomainId: string): Promise<ChartWithField[]> {
    return this.db.customDomainChart.findMany({
      where: { customDomainId },
      include: { field: true },
      orderBy: { order: 'asc' },
    })
  }

  async findChartById(chartId: string): Promise<ChartWithField | null> {
    return this.db.customDomainChart.findUnique({ where: { id: chartId }, include: { field: true } })
  }

  async createChart(
    customDomainId: string,
    data: { fieldId: string; name: string; chartType: ChartType; aggregation: ChartAggregation; order: number }
  ): Promise<ChartWithField> {
    return this.db.customDomainChart.create({
      data: { customDomainId, ...data },
      include: { field: true },
    })
  }

  async deleteChart(chartId: string): Promise<void> {
    await this.db.customDomainChart.delete({ where: { id: chartId } })
  }

  async reorderCharts(orderedChartIds: string[]): Promise<void> {
    await this.db.$transaction(
      orderedChartIds.map((id, index) =>
        this.db.customDomainChart.update({ where: { id }, data: { order: index } })
      )
    )
  }
}
