import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import { type FieldType, type ChartType, type ChartAggregation } from '@prisma/client'
import {
  type CustomDomainRepository,
  type CustomDomainWithFields,
  type CustomDomainStoreListing,
  type FieldWithConfig,
  type EntryWithValues,
  type ChartWithField,
} from './custom-domain.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { validateFieldValue, type TypedFieldValue } from './field-value.validation'

// Fields whose value plots meaningfully on the LINE/BAR_MONTHLY charts (a plain numeric axis) --
// TEXT/DATE/TIME/ENUM/etc. have no natural y-axis. Kept in sync by hand rather than derived from
// FieldType's full union, same as this file's other field-type allowlists.
const CHARTABLE_FIELD_TYPES: FieldType[] = ['NUMBER', 'DECIMAL']

export interface ChartStats {
  id: string
  name: string
  unit: string
  chartType: ChartType
  aggregation: ChartAggregation
  latest: number | null
  total: number
  monthToDate: number | null
  trend: { date: Date; value: number }[]
  monthly: { month: string; total: number }[]
}

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

function typedValueToColumns(typed: TypedFieldValue): {
  valueString?: string | null
  valueNumber?: number | null
  valueBoolean?: boolean | null
  valueDate?: Date | null
  valueJson?: string[]
} {
  switch (typed.column) {
    case 'valueString':
      return { valueString: typed.value }
    case 'valueNumber':
      return { valueNumber: typed.value }
    case 'valueBoolean':
      return { valueBoolean: typed.value }
    case 'valueDate':
      return { valueDate: typed.value }
    case 'valueJson':
      return { valueJson: typed.value }
    case null:
      return {}
  }
}

export interface FieldConfigInput {
  minValue?: number | null
  maxValue?: number | null
  decimalPlaces?: number | null
  maxLength?: number | null
  helpText?: string | null
}

export class CustomDomainLogService {
  constructor(
    private domainRepo: CustomDomainRepository,
    private itemRepo: ItemRepository
  ) {}

  // ─── Builder: field structure ───────────────────────────────────────────

  async addLoggableField(
    customDomainId: string,
    userId: string,
    input: {
      name: string
      fieldType: FieldType
      unit?: string | null
      required?: boolean
      options?: string[]
      widthCols: number
      config?: FieldConfigInput | null
    }
  ): Promise<FieldWithConfig> {
    await this.assertDomainOwnership(customDomainId, userId)
    await this.assertDomainNotPublished(customDomainId)
    const existing = await this.domainRepo.listLoggableFields(customDomainId, true)
    return this.domainRepo.addLoggableField(customDomainId, {
      ...input,
      key: slugifyKey(input.name),
      order: existing.length,
    })
  }

  async updateLoggableField(
    fieldId: string,
    userId: string,
    input: {
      name?: string
      unit?: string | null
      required?: boolean
      options?: string[]
      widthCols?: number
      config?: FieldConfigInput | null
    }
  ): Promise<FieldWithConfig> {
    const field = await this.assertFieldOwnership(fieldId, userId)
    await this.assertDomainNotPublished(field.customDomainId)
    return this.domainRepo.updateLoggableField(fieldId, input)
  }

  async archiveField(fieldId: string, userId: string): Promise<void> {
    const field = await this.assertFieldOwnership(fieldId, userId)
    await this.assertDomainNotPublished(field.customDomainId)
    await this.domainRepo.archiveField(fieldId)
  }

  async reorderFields(customDomainId: string, userId: string, orderedFieldIds: string[]): Promise<void> {
    const domain = await this.assertDomainOwnership(customDomainId, userId)
    await this.assertDomainNotPublished(customDomainId)
    const validIds = new Set(domain.fields.map((f) => f.id))
    if (orderedFieldIds.some((id) => !validIds.has(id))) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.field_not_found' })
    }
    await this.domainRepo.reorderFields(orderedFieldIds)
  }

  // ─── Publish / store / import ────────────────────────────────────────────

  async publish(customDomainId: string, userId: string) {
    await this.assertDomainOwnership(customDomainId, userId)
    const loggableFields = await this.domainRepo.listLoggableFields(customDomainId)
    if (loggableFields.length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.no_loggable_fields' })
    }
    return this.domainRepo.publishDomain(customDomainId)
  }

  listStore(): Promise<CustomDomainStoreListing[]> {
    return this.domainRepo.listPublished()
  }

  async importDomain(sourceDomainId: string, userId: string): Promise<CustomDomainWithFields> {
    const source = await this.domainRepo.findById(sourceDomainId)
    if (!source || !source.isPublished || !source.isPublic) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.not_found' })
    }
    return this.domainRepo.cloneDomain(sourceDomainId, userId)
  }

  async getSampleItem(customDomainId: string, userId: string) {
    await this.assertDomainOwnership(customDomainId, userId)
    return this.domainRepo.findSampleItemForDomain(customDomainId, userId)
  }

  // ─── Log entries ──────────────────────────────────────────────────────────

  async createEntry(
    itemId: string,
    userId: string,
    input: { recordedAt: Date; values: Record<string, unknown> }
  ): Promise<EntryWithValues> {
    const itemData = await this.assertAttached(itemId, userId)
    const activeFields = await this.domainRepo.listLoggableFields(itemData.customDomainId)

    const { rows, errors } = this.validateSubmission(activeFields, input.values)
    if (errors.length > 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: errors[0]!.error })
    }

    return this.domainRepo.createEntry({
      itemId,
      customDomainId: itemData.customDomainId,
      userId,
      recordedAt: input.recordedAt,
      values: rows.map((r) => ({ fieldId: r.fieldId, ...typedValueToColumns(r.typed) })),
    })
  }

  async updateEntry(
    entryId: string,
    userId: string,
    input: { recordedAt?: Date; values?: Record<string, unknown> }
  ): Promise<EntryWithValues> {
    const entry = await this.domainRepo.findEntryByIdAndUserId(entryId, userId)
    if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.entry_not_found' })

    if (input.values) {
      const activeFields = await this.domainRepo.listLoggableFields(entry.customDomainId)
      // Only fields actually present in the submitted `values` object are touched -- an archived
      // field (never in activeFields) or a field simply not included in this particular call keeps
      // whatever value it already had. See applyEntryValueOps' doc comment for why this matters.
      const submittedFields = activeFields.filter((f) => f.key in input.values!)
      const { rows, errors } = this.validateSubmission(submittedFields, input.values)
      if (errors.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: errors[0]!.error })
      }

      const rowsByFieldId = new Map(rows.map((r) => [r.fieldId, r]))
      const ops = submittedFields.map((f) => {
        const row = rowsByFieldId.get(f.id)
        return row
          ? ({ fieldId: f.id, action: 'set' as const, value: typedValueToColumns(row.typed) })
          : ({ fieldId: f.id, action: 'clear' as const })
      })
      await this.domainRepo.applyEntryValueOps(entryId, ops)
    }

    if (input.recordedAt) {
      await this.domainRepo.updateEntryRecordedAt(entryId, input.recordedAt)
    }

    const updated = await this.domainRepo.findEntryById(entryId)
    return updated!
  }

  async deleteEntry(entryId: string, userId: string): Promise<void> {
    const entry = await this.domainRepo.findEntryByIdAndUserId(entryId, userId)
    if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.entry_not_found' })
    await this.domainRepo.deleteEntry(entryId)
  }

  async listEntries(itemId: string, userId: string): Promise<{ fields: FieldWithConfig[]; entries: EntryWithValues[] }> {
    const itemData = await this.assertAttached(itemId, userId)
    const [fields, entries] = await Promise.all([
      this.domainRepo.listLoggableFields(itemData.customDomainId, true),
      this.domainRepo.listEntriesByItemId(itemId),
    ])
    return { fields, entries }
  }

  // ─── Statistics: user-defined charts ───────────────────────────────────────

  async listCharts(customDomainId: string, userId: string): Promise<ChartWithField[]> {
    await this.assertDomainOwnership(customDomainId, userId)
    return this.domainRepo.listCharts(customDomainId)
  }

  async createChart(
    customDomainId: string,
    userId: string,
    input: { fieldId: string; name: string; chartType: ChartType; aggregation: ChartAggregation }
  ): Promise<ChartWithField> {
    await this.assertDomainOwnership(customDomainId, userId)
    const field = await this.domainRepo.findFieldWithConfig(input.fieldId)
    if (!field || field.customDomainId !== customDomainId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.field_not_found' })
    }
    if (!field.loggable || field.archivedAt) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.chart_field_not_loggable' })
    }
    if (!CHARTABLE_FIELD_TYPES.includes(field.fieldType)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.chart_field_not_numeric' })
    }
    const existing = await this.domainRepo.listCharts(customDomainId)
    return this.domainRepo.createChart(customDomainId, {
      fieldId: input.fieldId,
      name: input.name,
      chartType: input.chartType,
      aggregation: input.aggregation,
      order: existing.length,
    })
  }

  async deleteChart(chartId: string, userId: string): Promise<void> {
    const chart = await this.domainRepo.findChartById(chartId)
    if (!chart) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.chart_not_found' })
    await this.assertDomainOwnership(chart.customDomainId, userId)
    await this.domainRepo.deleteChart(chartId)
  }

  async reorderCharts(customDomainId: string, userId: string, orderedChartIds: string[]): Promise<void> {
    await this.assertDomainOwnership(customDomainId, userId)
    const charts = await this.domainRepo.listCharts(customDomainId)
    const validIds = new Set(charts.map((c) => c.id))
    if (orderedChartIds.some((id) => !validIds.has(id))) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.custom_domain.chart_not_found' })
    }
    await this.domainRepo.reorderCharts(orderedChartIds)
  }

  /** Computes each configured chart's trend/monthly/total/latest from the item's own logged
   * entries -- mirrors reading.service.ts's getStatistics almost exactly (same MetricStats
   * shape, same trend/monthly/total/latest computation), since a Custom Domain chart is just the
   * user-authored equivalent of that file's static MetricDef. */
  async getStatistics(itemId: string, userId: string): Promise<{ charts: ChartStats[]; entryCount: number }> {
    const itemData = await this.assertAttached(itemId, userId)
    const [charts, entries] = await Promise.all([
      this.domainRepo.listCharts(itemData.customDomainId),
      this.domainRepo.listAllEntriesByItemId(itemId),
    ])
    const currentMonthKey = format(new Date(), 'yyyy-MM')

    const stats: ChartStats[] = charts.map((chart) => {
      const trend = entries
        .map((entry) => {
          const raw = entry.values.find((v) => v.fieldId === chart.fieldId)?.valueNumber
          return raw === null || raw === undefined ? null : { date: entry.recordedAt, value: Number(raw) }
        })
        .filter((p): p is { date: Date; value: number } => p !== null)

      const monthlyMap = new Map<string, number>()
      for (const p of trend) {
        const key = format(p.date, 'yyyy-MM')
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.value)
      }
      const monthly = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total }))

      return {
        id: chart.id,
        name: chart.name,
        unit: chart.field.unit ?? '',
        chartType: chart.chartType,
        aggregation: chart.aggregation,
        latest: trend.length > 0 ? trend[trend.length - 1]!.value : null,
        total: trend.reduce((sum, p) => sum + p.value, 0),
        monthToDate: monthlyMap.get(currentMonthKey) ?? null,
        trend,
        monthly,
      }
    })

    return { charts: stats, entryCount: entries.length }
  }

  /** Validates a raw `values` object (keyed by field.key, matching the existing profile-tab
   * convention in custom-domain.service.ts's upsertItemData) against the given fields' real
   * type/config, server-side -- never trusting client-claimed types. Returns only the fields whose
   * value should become a row (SKIPPED results are simply omitted from `rows`). */
  private validateSubmission(
    fields: FieldWithConfig[],
    rawValues: Record<string, unknown>
  ): { rows: Array<{ fieldId: string; typed: TypedFieldValue }>; errors: Array<{ fieldId: string; error: string }> } {
    const rows: Array<{ fieldId: string; typed: TypedFieldValue }> = []
    const errors: Array<{ fieldId: string; error: string }> = []
    for (const field of fields) {
      const config = field.fieldConfig
        ? {
            minValue: field.fieldConfig.minValue !== null ? Number(field.fieldConfig.minValue) : null,
            maxValue: field.fieldConfig.maxValue !== null ? Number(field.fieldConfig.maxValue) : null,
            decimalPlaces: field.fieldConfig.decimalPlaces,
            maxLength: field.fieldConfig.maxLength,
          }
        : null
      const result = validateFieldValue(
        { fieldType: field.fieldType, options: field.options },
        config,
        field.required,
        rawValues[field.key]
      )
      if (!result.valid) {
        errors.push({ fieldId: field.id, error: result.error })
      } else if (result.value.column !== null) {
        rows.push({ fieldId: field.id, typed: result.value })
      }
    }
    return { rows, errors }
  }

  private async assertDomainOwnership(domainId: string, userId: string): Promise<CustomDomainWithFields> {
    const domain = await this.domainRepo.findById(domainId)
    if (!domain || domain.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.not_found' })
    }
    return domain
  }

  private async assertFieldOwnership(fieldId: string, userId: string): Promise<FieldWithConfig> {
    const field = await this.domainRepo.findFieldWithConfig(fieldId)
    if (!field) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.field_not_found' })
    await this.assertDomainOwnership(field.customDomainId, userId)
    return field
  }

  private async assertDomainNotPublished(domainId: string): Promise<void> {
    const domain = await this.domainRepo.findById(domainId)
    if (domain?.isPublished) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.custom_domain.published_locked' })
    }
  }

  private async assertAttached(itemId: string, userId: string) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    const itemData = await this.domainRepo.findItemData(itemId)
    if (!itemData) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.custom_domain.not_attached' })
    return itemData
  }
}
