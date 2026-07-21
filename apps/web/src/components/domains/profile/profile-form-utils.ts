import type { ProfileFieldDef } from '@/server/domains/profile/profile.fields'

export type FormValues = Record<string, string | boolean>

function toFormValue(value: unknown): string | boolean {
  if (typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10)
  if (value === null || value === undefined) return ''
  return String(value)
}

export function toValues(fields: ProfileFieldDef[], data: Record<string, unknown> | null | undefined): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    values[field.key] = field.type === 'boolean' ? Boolean(data?.[field.key]) : toFormValue(data?.[field.key])
  }
  return values
}

export function toPayload(fields: ProfileFieldDef[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    const raw = values[field.key]
    if (field.type === 'boolean') { payload[field.key] = Boolean(raw); continue }
    if (raw === '' || raw === undefined) { payload[field.key] = null; continue }
    if (field.type === 'number' || field.type === 'decimal') payload[field.key] = Number(raw)
    else if (field.type === 'date') payload[field.key] = new Date(String(raw))
    else payload[field.key] = raw
  }
  return payload
}

export function formatDisplayValue(field: ProfileFieldDef, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (field.type === 'boolean') return value ? 'Yes' : 'No'
  if (field.type === 'date') return new Date(String(value)).toLocaleDateString()
  return field.unit ? `${value} ${field.unit}` : String(value)
}
