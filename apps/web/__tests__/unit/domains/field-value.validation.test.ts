import { describe, it, expect } from 'vitest'
import { validateFieldValue } from '@/server/domains/custom-domain/field-value.validation'

describe('validateFieldValue: required/empty', () => {
  it('rejects a required field with an omitted value', () => {
    const result = validateFieldValue({ fieldType: 'TEXT', options: [] }, null, true, undefined)
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_required' })
  })

  it('rejects a required field with an empty-string value', () => {
    const result = validateFieldValue({ fieldType: 'TEXT', options: [] }, null, true, '')
    expect(result.valid).toBe(false)
  })

  it('accepts a non-required field with an omitted value, skipping row creation', () => {
    const result = validateFieldValue({ fieldType: 'TEXT', options: [] }, null, false, undefined)
    expect(result).toEqual({ valid: true, value: { column: null, value: undefined } })
  })
})

describe('validateFieldValue: TEXT / LONG_TEXT', () => {
  for (const fieldType of ['TEXT', 'LONG_TEXT'] as const) {
    it(`${fieldType}: accepts a correctly-typed string`, () => {
      const result = validateFieldValue({ fieldType, options: [] }, null, false, 'hello')
      expect(result).toEqual({ valid: true, value: { column: 'valueString', value: 'hello' } })
    })

    it(`${fieldType}: rejects a non-string value`, () => {
      const result = validateFieldValue({ fieldType, options: [] }, null, false, 42)
      expect(result.valid).toBe(false)
    })

    it(`${fieldType}: rejects a string longer than maxLength`, () => {
      const result = validateFieldValue({ fieldType, options: [] }, { maxLength: 3 }, false, 'abcd')
      expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_too_long' })
    })

    it(`${fieldType}: accepts a string exactly at maxLength`, () => {
      const result = validateFieldValue({ fieldType, options: [] }, { maxLength: 3 }, false, 'abc')
      expect(result.valid).toBe(true)
    })
  }
})

describe('validateFieldValue: URL', () => {
  it('accepts a valid URL', () => {
    const result = validateFieldValue({ fieldType: 'URL', options: [] }, null, false, 'https://example.com')
    expect(result).toEqual({ valid: true, value: { column: 'valueString', value: 'https://example.com' } })
  })

  it('rejects a non-URL string', () => {
    const result = validateFieldValue({ fieldType: 'URL', options: [] }, null, false, 'not a url')
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.invalid_url' })
  })

  it('rejects a non-string value', () => {
    const result = validateFieldValue({ fieldType: 'URL', options: [] }, null, false, 123)
    expect(result.valid).toBe(false)
  })
})

describe('validateFieldValue: NUMBER (integer-only)', () => {
  it('accepts a correctly-typed integer', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, null, false, 5)
    expect(result).toEqual({ valid: true, value: { column: 'valueNumber', value: 5 } })
  })

  it('accepts a numeric string and coerces it', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, null, false, '5')
    expect(result).toEqual({ valid: true, value: { column: 'valueNumber', value: 5 } })
  })

  it('rejects a non-numeric value', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, null, false, 'abc')
    expect(result.valid).toBe(false)
  })

  it('rejects a fractional value (NUMBER is integer-only, DECIMAL is the float widget)', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, null, false, 5.5)
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.must_be_whole_number' })
  })

  it('rejects a value below minValue', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, { minValue: 10 }, false, 5)
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_below_min' })
  })

  it('rejects a value above maxValue', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, { maxValue: 10 }, false, 15)
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_above_max' })
  })

  it('accepts a value exactly at minValue (inclusive boundary)', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, { minValue: 10 }, false, 10)
    expect(result.valid).toBe(true)
  })

  it('accepts a value exactly at maxValue (inclusive boundary)', () => {
    const result = validateFieldValue({ fieldType: 'NUMBER', options: [] }, { maxValue: 10 }, false, 10)
    expect(result.valid).toBe(true)
  })
})

describe('validateFieldValue: DECIMAL', () => {
  it('accepts a correctly-typed float', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, null, false, 5.25)
    expect(result).toEqual({ valid: true, value: { column: 'valueNumber', value: 5.25 } })
  })

  it('rejects a non-numeric value', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, null, false, 'abc')
    expect(result.valid).toBe(false)
  })

  it('rejects a value below minValue', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, { minValue: 1 }, false, 0.5)
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_below_min' })
  })

  it('rejects a value above maxValue', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, { maxValue: 1 }, false, 1.5)
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_above_max' })
  })

  it('accepts a value exactly at the min/max boundary (inclusive)', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, { minValue: 1, maxValue: 1 }, false, 1)
    expect(result.valid).toBe(true)
  })

  it('rounds a value with more fractional digits than decimalPlaces, rather than rejecting it', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, { decimalPlaces: 2 }, false, 5.126)
    expect(result).toEqual({ valid: true, value: { column: 'valueNumber', value: 5.13 } })
  })

  it('leaves a value with fewer or equal fractional digits than decimalPlaces untouched', () => {
    const result = validateFieldValue({ fieldType: 'DECIMAL', options: [] }, { decimalPlaces: 2 }, false, 5.1)
    expect(result).toEqual({ valid: true, value: { column: 'valueNumber', value: 5.1 } })
  })
})

describe('validateFieldValue: BOOLEAN', () => {
  it('accepts true', () => {
    const result = validateFieldValue({ fieldType: 'BOOLEAN', options: [] }, null, false, true)
    expect(result).toEqual({ valid: true, value: { column: 'valueBoolean', value: true } })
  })

  it('accepts false even when the field is "required" -- false is a valid answer, not emptiness', () => {
    const result = validateFieldValue({ fieldType: 'BOOLEAN', options: [] }, null, true, false)
    expect(result).toEqual({ valid: true, value: { column: 'valueBoolean', value: false } })
  })

  it('rejects a non-boolean value', () => {
    const result = validateFieldValue({ fieldType: 'BOOLEAN', options: [] }, null, false, 'true')
    expect(result.valid).toBe(false)
  })
})

describe('validateFieldValue: DATE', () => {
  it('accepts a valid date string', () => {
    const result = validateFieldValue({ fieldType: 'DATE', options: [] }, null, false, '2026-07-31')
    expect(result.valid).toBe(true)
    expect((result as { value: { column: string } }).value.column).toBe('valueDate')
  })

  it('accepts a Date instance', () => {
    const result = validateFieldValue({ fieldType: 'DATE', options: [] }, null, false, new Date('2026-07-31'))
    expect(result.valid).toBe(true)
  })

  it('rejects an unparseable date', () => {
    const result = validateFieldValue({ fieldType: 'DATE', options: [] }, null, false, 'not a date')
    expect(result.valid).toBe(false)
  })
})

describe('validateFieldValue: TIME', () => {
  it('accepts a valid HH:mm string', () => {
    const result = validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, '14:30')
    expect(result).toEqual({ valid: true, value: { column: 'valueString', value: '14:30' } })
  })

  it('accepts midnight and the last minute of the day', () => {
    expect(validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, '00:00').valid).toBe(true)
    expect(validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, '23:59').valid).toBe(true)
  })

  it('rejects an hour past 23 or a minute past 59', () => {
    expect(validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, '24:00').valid).toBe(false)
    expect(validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, '10:60').valid).toBe(false)
  })

  it('rejects a non-string value', () => {
    const result = validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, 1430)
    expect(result.valid).toBe(false)
  })

  it('rejects a malformed string', () => {
    const result = validateFieldValue({ fieldType: 'TIME', options: [] }, null, false, '2:30 PM')
    expect(result.valid).toBe(false)
  })
})

describe('validateFieldValue: ENUM / RADIO', () => {
  for (const fieldType of ['ENUM', 'RADIO'] as const) {
    it(`${fieldType}: accepts a value in options`, () => {
      const result = validateFieldValue({ fieldType, options: ['a', 'b'] }, null, false, 'a')
      expect(result).toEqual({ valid: true, value: { column: 'valueString', value: 'a' } })
    })

    it(`${fieldType}: rejects a value not in options`, () => {
      const result = validateFieldValue({ fieldType, options: ['a', 'b'] }, null, false, 'c')
      expect(result).toEqual({ valid: false, error: 'errors.custom_domain.invalid_option' })
    })
  }
})

describe('validateFieldValue: CHECKBOXES', () => {
  it('accepts an array where every value is in options', () => {
    const result = validateFieldValue({ fieldType: 'CHECKBOXES', options: ['a', 'b', 'c'] }, null, false, ['a', 'c'])
    expect(result).toEqual({ valid: true, value: { column: 'valueJson', value: ['a', 'c'] } })
  })

  it('rejects an array containing a value not in options', () => {
    const result = validateFieldValue({ fieldType: 'CHECKBOXES', options: ['a', 'b'] }, null, false, ['a', 'z'])
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.invalid_option' })
  })

  it('rejects an empty array when required', () => {
    const result = validateFieldValue({ fieldType: 'CHECKBOXES', options: ['a', 'b'] }, null, true, [])
    expect(result).toEqual({ valid: false, error: 'errors.custom_domain.value_required' })
  })

  it('accepts an empty array when not required, skipping row creation', () => {
    const result = validateFieldValue({ fieldType: 'CHECKBOXES', options: ['a', 'b'] }, null, false, [])
    expect(result).toEqual({ valid: true, value: { column: null, value: undefined } })
  })

  it('accepts an omitted value when not required, skipping row creation', () => {
    const result = validateFieldValue({ fieldType: 'CHECKBOXES', options: ['a', 'b'] }, null, false, undefined)
    expect(result).toEqual({ valid: true, value: { column: null, value: undefined } })
  })

  it('rejects a non-array value', () => {
    const result = validateFieldValue({ fieldType: 'CHECKBOXES', options: ['a', 'b'] }, null, false, 'a')
    expect(result.valid).toBe(false)
  })
})
