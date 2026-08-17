import { describe, it, expect } from 'vitest'
import {
  chartTypesForFieldType,
  aggregationsForFieldType,
  isChartableFieldType,
  minutesFromTimeString,
  formatMinutesAsTime,
} from '@/server/domains/custom-domain/chart-field-compat'

describe('chartTypesForFieldType', () => {
  it('offers both LINE and BAR_MONTHLY for NUMBER/DECIMAL', () => {
    expect(chartTypesForFieldType('NUMBER')).toEqual(['LINE', 'BAR_MONTHLY'])
    expect(chartTypesForFieldType('DECIMAL')).toEqual(['LINE', 'BAR_MONTHLY'])
  })

  it('offers only LINE for TIME (a monthly sum of times-of-day is meaningless)', () => {
    expect(chartTypesForFieldType('TIME')).toEqual(['LINE'])
  })

  it('offers only BAR_MONTHLY (frequency) for DATE', () => {
    expect(chartTypesForFieldType('DATE')).toEqual(['BAR_MONTHLY'])
  })

  it('offers PIE and BAR_CATEGORY for every categorical field type', () => {
    for (const t of ['ENUM', 'RADIO', 'BOOLEAN', 'CHECKBOXES'] as const) {
      expect(chartTypesForFieldType(t)).toEqual(['PIE', 'BAR_CATEGORY'])
    }
  })

  it('offers nothing for a non-chartable field type', () => {
    expect(chartTypesForFieldType('TEXT')).toEqual([])
    expect(chartTypesForFieldType('LONG_TEXT')).toEqual([])
    expect(chartTypesForFieldType('URL')).toEqual([])
  })
})

describe('isChartableFieldType', () => {
  it('agrees with chartTypesForFieldType having at least one entry', () => {
    for (const t of ['NUMBER', 'DECIMAL', 'TIME', 'DATE', 'ENUM', 'RADIO', 'BOOLEAN', 'CHECKBOXES'] as const) {
      expect(isChartableFieldType(t)).toBe(true)
    }
    expect(isChartableFieldType('TEXT')).toBe(false)
  })
})

describe('aggregationsForFieldType', () => {
  it('offers LATEST/SUM/AVG for NUMBER/DECIMAL', () => {
    expect(aggregationsForFieldType('NUMBER')).toEqual(['LATEST', 'SUM', 'AVG'])
  })

  it('excludes SUM for TIME (summing times-of-day is meaningless)', () => {
    expect(aggregationsForFieldType('TIME')).toEqual(['LATEST', 'AVG'])
  })

  it('offers none for DATE or categorical types', () => {
    expect(aggregationsForFieldType('DATE')).toEqual([])
    expect(aggregationsForFieldType('ENUM')).toEqual([])
  })
})

describe('minutesFromTimeString / formatMinutesAsTime', () => {
  it('round-trips a valid HH:mm string', () => {
    expect(minutesFromTimeString('14:30')).toBe(870)
    expect(formatMinutesAsTime(870)).toBe('14:30')
  })

  it('rejects a malformed string', () => {
    expect(minutesFromTimeString('2:30 PM')).toBeNull()
    expect(minutesFromTimeString('25:00')).toBeNull()
  })

  it('wraps minutes past midnight back into a 24h clock', () => {
    expect(formatMinutesAsTime(24 * 60 + 30)).toBe('00:30')
  })
})
