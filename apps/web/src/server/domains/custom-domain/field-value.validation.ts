import { type FieldType } from '@prisma/client'

export type TypedFieldValue =
  | { column: 'valueString'; value: string }
  | { column: 'valueNumber'; value: number }
  | { column: 'valueBoolean'; value: boolean }
  | { column: 'valueDate'; value: Date }
  | { column: 'valueJson'; value: string[] }
  | { column: null; value: undefined }

export type FieldValueValidationResult =
  | { valid: true; value: TypedFieldValue }
  | { valid: false; error: string }

export interface FieldValueValidationField {
  fieldType: FieldType
  options: string[]
}

export interface FieldValueValidationConfig {
  minValue?: number | null
  maxValue?: number | null
  decimalPlaces?: number | null
  maxLength?: number | null
}

const SKIPPED: FieldValueValidationResult = { valid: true, value: { column: null, value: undefined } }
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function isEmpty(rawValue: unknown): boolean {
  return rawValue === undefined || rawValue === null || rawValue === ''
}

function coerceNumber(rawValue: unknown): number | null {
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null
  if (typeof rawValue === 'string' && rawValue.trim() !== '') {
    const n = Number(rawValue)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function checkRange(n: number, config: FieldValueValidationConfig | null | undefined): string | null {
  // Boundary values are inclusive on both ends -- an entry exactly at minValue/maxValue is valid,
  // matching how a human reads "range 1-3" as including 1 and 3.
  if (config?.minValue !== undefined && config.minValue !== null && n < config.minValue) {
    return `errors.custom_domain.value_below_min`
  }
  if (config?.maxValue !== undefined && config.maxValue !== null && n > config.maxValue) {
    return `errors.custom_domain.value_above_max`
  }
  return null
}

/**
 * Server-authoritative validation for a single CustomDomainFieldValue submission. Field types and
 * their constraints are user-authored data (not a compile-time zod schema), so every submitted
 * value is checked here against the field's real fieldType/options and its CustomDomainFieldConfig
 * -- the client's claims about type/constraints are never trusted.
 */
export function validateFieldValue(
  field: FieldValueValidationField,
  config: FieldValueValidationConfig | null,
  required: boolean,
  rawValue: unknown
): FieldValueValidationResult {
  if (isEmpty(rawValue) && field.fieldType !== 'CHECKBOXES') {
    if (required) return { valid: false, error: 'errors.custom_domain.value_required' }
    return SKIPPED
  }

  switch (field.fieldType) {
    case 'TEXT':
    case 'LONG_TEXT': {
      if (typeof rawValue !== 'string') return { valid: false, error: 'errors.custom_domain.invalid_type' }
      if (config?.maxLength !== undefined && config.maxLength !== null && rawValue.length > config.maxLength) {
        return { valid: false, error: 'errors.custom_domain.value_too_long' }
      }
      return { valid: true, value: { column: 'valueString', value: rawValue } }
    }

    case 'URL': {
      if (typeof rawValue !== 'string') return { valid: false, error: 'errors.custom_domain.invalid_type' }
      try {
        new URL(rawValue)
      } catch {
        return { valid: false, error: 'errors.custom_domain.invalid_url' }
      }
      return { valid: true, value: { column: 'valueString', value: rawValue } }
    }

    case 'NUMBER': {
      const n = coerceNumber(rawValue)
      if (n === null) return { valid: false, error: 'errors.custom_domain.invalid_type' }
      if (!Number.isInteger(n)) return { valid: false, error: 'errors.custom_domain.must_be_whole_number' }
      const rangeError = checkRange(n, config)
      if (rangeError) return { valid: false, error: rangeError }
      return { valid: true, value: { column: 'valueNumber', value: n } }
    }

    case 'DECIMAL': {
      const n = coerceNumber(rawValue)
      if (n === null) return { valid: false, error: 'errors.custom_domain.invalid_type' }
      const rangeError = checkRange(n, config)
      if (rangeError) return { valid: false, error: rangeError }
      // Rounding rather than rejecting extra fractional digits is the less surprising behavior --
      // a user typing one digit more than the configured precision almost certainly means the
      // rounded value, not an error to fix and resubmit.
      const dp = config?.decimalPlaces ?? null
      const rounded = dp !== null ? Number(n.toFixed(dp)) : n
      return { valid: true, value: { column: 'valueNumber', value: rounded } }
    }

    case 'BOOLEAN': {
      if (typeof rawValue !== 'boolean') return { valid: false, error: 'errors.custom_domain.invalid_type' }
      return { valid: true, value: { column: 'valueBoolean', value: rawValue } }
    }

    case 'DATE': {
      const d = rawValue instanceof Date ? rawValue : new Date(rawValue as string)
      if (Number.isNaN(d.getTime())) return { valid: false, error: 'errors.custom_domain.invalid_type' }
      return { valid: true, value: { column: 'valueDate', value: d } }
    }

    case 'TIME': {
      if (typeof rawValue !== 'string' || !TIME_RE.test(rawValue)) {
        return { valid: false, error: 'errors.custom_domain.invalid_type' }
      }
      return { valid: true, value: { column: 'valueString', value: rawValue } }
    }

    case 'ENUM':
    case 'RADIO': {
      if (typeof rawValue !== 'string') return { valid: false, error: 'errors.custom_domain.invalid_type' }
      if (!field.options.includes(rawValue)) return { valid: false, error: 'errors.custom_domain.invalid_option' }
      return { valid: true, value: { column: 'valueString', value: rawValue } }
    }

    case 'CHECKBOXES': {
      const arr = isEmpty(rawValue) ? [] : rawValue
      if (!Array.isArray(arr) || arr.some((v) => typeof v !== 'string')) {
        return { valid: false, error: 'errors.custom_domain.invalid_type' }
      }
      if (arr.length === 0) {
        if (required) return { valid: false, error: 'errors.custom_domain.value_required' }
        return SKIPPED
      }
      if (arr.some((v) => !field.options.includes(v))) {
        return { valid: false, error: 'errors.custom_domain.invalid_option' }
      }
      return { valid: true, value: { column: 'valueJson', value: arr } }
    }

    default: {
      const _exhaustive: never = field.fieldType
      return { valid: false, error: 'errors.custom_domain.invalid_type' }
    }
  }
}
