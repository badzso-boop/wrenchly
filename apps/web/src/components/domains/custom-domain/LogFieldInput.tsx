'use client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DateField } from '@/components/ui/date-field'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'
import type { CustomDomainFieldValue } from '@prisma/client'

export type LogFieldValues = Record<string, unknown>

/** A value's embedded `field` snapshot lacks `fieldConfig` (not selected on that relation) --
 * prefer the live field from `fieldsById` when present (has real config for formatting), else
 * fall back to the embedded snapshot with `fieldConfig: null` (still enough to render a label). */
export function resolveFieldWithConfig(
  fieldsById: Record<string, FieldWithConfig>,
  fieldId: string,
  fallback: Omit<FieldWithConfig, 'fieldConfig'>
): FieldWithConfig {
  return fieldsById[fieldId] ?? { ...fallback, fieldConfig: null }
}

/** Converts a persisted `CustomDomainFieldValue` row (one nullable typed column set) back into
 * the plain JS value `LogFieldInput`/`formatLogFieldValue` expect. */
export function extractRawValue(value: CustomDomainFieldValue): unknown {
  if (value.valueString !== null) return value.valueString
  if (value.valueNumber !== null) return Number(value.valueNumber)
  if (value.valueBoolean !== null) return value.valueBoolean
  if (value.valueDate !== null) return new Date(value.valueDate).toISOString().slice(0, 10)
  if (value.valueJson !== null) return value.valueJson
  return undefined
}

/** Renders the real widget for one loggable field, reading/writing `values[field.key]`.
 * Mirrors (but doesn't duplicate) the server's `validateFieldValue` shape expectations --
 * strings for TEXT/LONG_TEXT/DATE/ENUM/RADIO, number for NUMBER/DECIMAL, boolean for BOOLEAN,
 * string[] for CHECKBOXES. */
export function LogFieldInput({
  field,
  values,
  onChange,
}: {
  field: FieldWithConfig
  values: LogFieldValues
  onChange: (key: string, value: unknown) => void
}) {
  const value = values[field.key]

  switch (field.fieldType) {
    case 'TEXT':
      return (
        <Input
          value={(value as string) ?? ''}
          maxLength={field.fieldConfig?.maxLength ?? undefined}
          onChange={(e) => onChange(field.key, (e.target as HTMLInputElement).value)}
          required={field.required}
        />
      )
    case 'LONG_TEXT':
      return (
        <Textarea
          value={(value as string) ?? ''}
          maxLength={field.fieldConfig?.maxLength ?? undefined}
          onChange={(e) => onChange(field.key, (e.target as HTMLTextAreaElement).value)}
          required={field.required}
          rows={3}
        />
      )
    case 'NUMBER':
      return (
        <Input
          type="number"
          step="1"
          value={value === undefined || value === null ? '' : String(value)}
          min={field.fieldConfig?.minValue != null ? Number(field.fieldConfig.minValue) : undefined}
          max={field.fieldConfig?.maxValue != null ? Number(field.fieldConfig.maxValue) : undefined}
          onChange={(e) => {
            const raw = (e.target as HTMLInputElement).value
            onChange(field.key, raw === '' ? undefined : Number(raw))
          }}
          required={field.required}
        />
      )
    case 'DECIMAL': {
      const dp = field.fieldConfig?.decimalPlaces ?? undefined
      return (
        <Input
          type="number"
          step={dp !== undefined ? (1 / 10 ** dp).toString() : 'any'}
          value={value === undefined || value === null ? '' : String(value)}
          min={field.fieldConfig?.minValue != null ? Number(field.fieldConfig.minValue) : undefined}
          max={field.fieldConfig?.maxValue != null ? Number(field.fieldConfig.maxValue) : undefined}
          onChange={(e) => {
            const raw = (e.target as HTMLInputElement).value
            onChange(field.key, raw === '' ? undefined : Number(raw))
          }}
          required={field.required}
        />
      )
    }
    case 'DATE':
      return (
        <DateField
          value={(value as string) ?? ''}
          onChange={(v) => onChange(field.key, v)}
          required={field.required}
        />
      )
    case 'TIME':
      return (
        <Input
          type="time"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, (e.target as HTMLInputElement).value)}
          required={field.required}
        />
      )
    case 'BOOLEAN':
      return <Switch checked={(value as boolean) ?? false} onCheckedChange={(v) => onChange(field.key, v)} />
    case 'ENUM':
      return (
        <Select value={(value as string) ?? ''} onValueChange={(v) => { if (v !== null) onChange(field.key, v) }}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {field.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      )
    case 'RADIO':
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((o) => (
            <Button
              key={o}
              type="button"
              size="sm"
              variant={value === o ? 'default' : 'outline'}
              onClick={() => onChange(field.key, o)}
            >
              {o}
            </Button>
          ))}
        </div>
      )
    case 'CHECKBOXES': {
      const selected = Array.isArray(value) ? (value as string[]) : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((o) => {
            const isSelected = selected.includes(o)
            return (
              <Button
                key={o}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onChange(field.key, isSelected ? selected.filter((s) => s !== o) : [...selected, o])}
              >
                {o}
              </Button>
            )
          })}
        </div>
      )
    }
    case 'URL':
      return (
        <Input
          type="url"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, (e.target as HTMLInputElement).value)}
          required={field.required}
        />
      )
    default:
      return null
  }
}

export function formatLogFieldValue(field: FieldWithConfig, raw: unknown): string {
  if (raw === undefined || raw === null) return '—'
  switch (field.fieldType) {
    case 'BOOLEAN':
      return raw ? 'Yes' : 'No'
    case 'DATE':
      return new Date(raw as string).toLocaleDateString()
    case 'DECIMAL': {
      const dp = field.fieldConfig?.decimalPlaces ?? undefined
      return dp !== undefined ? Number(raw).toFixed(dp) : String(raw)
    }
    default:
      if (Array.isArray(raw)) return raw.join(', ')
      return String(raw)
  }
}
