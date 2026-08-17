import { describe, it, expect } from 'vitest'
import { formatLogFieldValue } from '@/components/domains/custom-domain/LogFieldInput'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

function field(overrides: Partial<FieldWithConfig> = {}): FieldWithConfig {
  return {
    id: 'field-a',
    customDomainId: 'domain-1',
    name: 'Distance',
    key: 'distance',
    fieldType: 'NUMBER',
    unit: null,
    required: false,
    options: [],
    order: 0,
    widthCols: 2,
    loggable: true,
    archivedAt: null,
    fieldConfig: null,
    ...overrides,
  } as FieldWithConfig
}

describe('formatLogFieldValue: unit of measure', () => {
  it('appends the unit for a NUMBER field', () => {
    expect(formatLogFieldValue(field({ fieldType: 'NUMBER', unit: 'km' }), 12)).toBe('12 km')
  })

  it('omits the unit suffix when the field has none', () => {
    expect(formatLogFieldValue(field({ fieldType: 'NUMBER', unit: null }), 12)).toBe('12')
  })

  it('appends the unit for a DECIMAL field, after decimal-place rounding', () => {
    const f = field({ fieldType: 'DECIMAL', unit: 'kg', fieldConfig: { id: 'c1', fieldId: 'field-a', minValue: null, maxValue: null, decimalPlaces: 2, maxLength: null, helpText: null } })
    expect(formatLogFieldValue(f, 3.14159)).toBe('3.14 kg')
  })

  it('does not append a unit for BOOLEAN or DATE values, even if unit is set', () => {
    expect(formatLogFieldValue(field({ fieldType: 'BOOLEAN', unit: 'kg' }), true)).toBe('Yes')
    expect(formatLogFieldValue(field({ fieldType: 'DATE', unit: 'kg' }), '2026-07-31')).not.toContain('kg')
  })

  it('returns the em-dash placeholder for a missing value regardless of unit', () => {
    expect(formatLogFieldValue(field({ fieldType: 'NUMBER', unit: 'km' }), null)).toBe('—')
    expect(formatLogFieldValue(field({ fieldType: 'NUMBER', unit: 'km' }), undefined)).toBe('—')
  })
})
