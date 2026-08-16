import type { FieldType, ChartType, ChartAggregation } from '@prisma/client'

/**
 * Pure field-type <-> chart-type/aggregation compatibility rules, shared verbatim between the
 * server (createChart validation, getStatistics value extraction) and the client (which chart
 * types/aggregations the "Choose chart" dialog offers for a given field) -- no DB or React
 * imports here, so it's safe to pull into either side without dragging the other along.
 */

export type ChartFamily = 'numeric' | 'categorical'

export const NUMERIC_FIELD_TYPES: FieldType[] = ['NUMBER', 'DECIMAL', 'TIME', 'DATE']
export const CATEGORICAL_FIELD_TYPES: FieldType[] = ['ENUM', 'RADIO', 'BOOLEAN', 'CHECKBOXES']

export function familyForFieldType(fieldType: FieldType): ChartFamily | null {
  if (NUMERIC_FIELD_TYPES.includes(fieldType)) return 'numeric'
  if (CATEGORICAL_FIELD_TYPES.includes(fieldType)) return 'categorical'
  return null
}

export function isChartableFieldType(fieldType: FieldType): boolean {
  return familyForFieldType(fieldType) !== null
}

/** Which chart types make sense for a field's data:
 * - NUMBER/DECIMAL: a plain numeric axis, both starter chart types apply.
 * - TIME: only a raw trend reads sensibly (a monthly *sum* of times-of-day is meaningless).
 * - DATE: only "how often was this logged, per month" -- a frequency bar, no raw trend.
 * - ENUM/RADIO/BOOLEAN/CHECKBOXES: a count-per-option distribution, as pie or bar. */
export function chartTypesForFieldType(fieldType: FieldType): ChartType[] {
  switch (fieldType) {
    case 'NUMBER':
    case 'DECIMAL':
      return ['LINE', 'BAR_MONTHLY']
    case 'TIME':
      return ['LINE']
    case 'DATE':
      return ['BAR_MONTHLY']
    case 'ENUM':
    case 'RADIO':
    case 'BOOLEAN':
    case 'CHECKBOXES':
      return ['PIE', 'BAR_CATEGORY']
    default:
      return []
  }
}

/** Which stat-tile aggregations make sense for a numeric-family field. Categorical charts (PIE/
 * BAR_CATEGORY) ignore aggregation entirely -- their tile is "most common option" instead, always
 * derived the same way regardless of field type. DATE has none: its only chart (BAR_MONTHLY) is
 * always a frequency count, not a user choice. */
export function aggregationsForFieldType(fieldType: FieldType): ChartAggregation[] {
  switch (fieldType) {
    case 'NUMBER':
    case 'DECIMAL':
      return ['LATEST', 'SUM', 'AVG']
    case 'TIME':
      return ['LATEST', 'AVG']
    default:
      return []
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function minutesFromTimeString(value: string): number | null {
  const m = TIME_RE.exec(value)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function formatMinutesAsTime(minutes: number): string {
  const total = Math.round(minutes) % (24 * 60)
  const h = Math.floor(total / 60).toString().padStart(2, '0')
  const m = Math.floor(total % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
