import { describe, it, expect } from 'vitest'
import { generateIcs } from '@/server/domains/calendar/calendar.service'
import type { Reminder, Item } from '@prisma/client'

const TZ = 'Europe/Budapest'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    userId: 'user-1',
    name: 'Toyota Corolla',
    type: 'VEHICLE',
    status: 'ACTIVE',
    description: null,
    imageUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as Item
}

function makeReminder(overrides: Partial<Reminder> & { item?: Item } = {}) {
  return {
    id: 'rem-1',
    userId: 'user-1',
    itemId: 'item-1',
    title: 'Oil Change',
    description: null,
    triggerType: 'INTERVAL_DAYS',
    triggerConfig: { days: 90 },
    nextTriggerAt: new Date('2027-03-01T10:00:00Z'),
    lastTriggeredAt: null,
    isActive: true,
    notifyChannels: ['push'],
    snoozeUntil: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    item: makeItem(),
    ...overrides,
  }
}

// ─── generateIcs ────────────────────────────────────────────────────────────

describe('generateIcs', () => {
  it('returns a valid ICS string with required headers', () => {
    const ics = generateIcs([], TZ)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('X-WR-CALNAME:Wrenchly Maintenance')
  })

  it('produces no VEVENT for empty reminders', () => {
    const ics = generateIcs([], TZ)
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('skips reminders without nextTriggerAt', () => {
    const reminder = makeReminder({ nextTriggerAt: null })
    const ics = generateIcs([reminder as any], TZ)
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('creates one primary VEVENT for a DATE reminder', () => {
    const reminder = makeReminder({ triggerType: 'DATE', triggerConfig: { date: '2027-06-01T00:00:00Z' } })
    const ics = generateIcs([reminder as any], TZ)
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length
    expect(eventCount).toBe(1)
  })

  it('SUMMARY is "Item Name — Reminder Title"', () => {
    const ics = generateIcs([makeReminder() as any], TZ)
    expect(ics).toContain('SUMMARY:Toyota Corolla — Oil Change')
  })

  it('DTSTART matches nextTriggerAt', () => {
    const ics = generateIcs([makeReminder() as any], TZ)
    // 2027-03-01T10:00:00Z → should appear in ICS DTSTART
    expect(ics).toContain('20270301')
  })

  it('includes a VALARM block for each event', () => {
    const ics = generateIcs([makeReminder() as any], TZ)
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('ACTION:DISPLAY')
  })

  it('generates 12 VEVENTs for INTERVAL_DAYS (1 primary + 11 future)', () => {
    const reminder = makeReminder({ triggerType: 'INTERVAL_DAYS', triggerConfig: { days: 90 } })
    const ics = generateIcs([reminder as any], TZ)
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length
    expect(eventCount).toBe(12)
  })

  it('future occurrences are spaced by the correct interval', () => {
    const base = new Date('2027-01-01T10:00:00Z')
    const reminder = makeReminder({
      triggerType: 'INTERVAL_DAYS',
      triggerConfig: { days: 30 },
      nextTriggerAt: base,
    })
    const ics = generateIcs([reminder as any], TZ)
    // 11th future occurrence = base + 11*30 = base + 330 days → 2027-11-27
    expect(ics).toContain('20271127')
  })

  it('ODOMETER reminder with nextTriggerAt still creates a VEVENT', () => {
    const reminder = makeReminder({
      triggerType: 'ODOMETER',
      triggerConfig: { every_km: 10000, last_done_at_km: 50000 },
      nextTriggerAt: new Date('2027-05-01T00:00:00Z'),
    })
    const ics = generateIcs([reminder as any], TZ)
    // ODOMETER has no future occurrences (INTERVAL_DAYS only), but primary event exists
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length
    expect(eventCount).toBe(1)
  })

  it('DESCRIPTION contains interval info for INTERVAL_DAYS', () => {
    const ics = generateIcs([makeReminder() as any], TZ)
    expect(ics).toContain('Repeats every 90 days')
  })

  it('DESCRIPTION contains "One-time reminder" for DATE', () => {
    const reminder = makeReminder({ triggerType: 'DATE', triggerConfig: { date: '2027-06-01T00:00:00Z' } })
    const ics = generateIcs([reminder as any], TZ)
    expect(ics).toContain('One-time reminder')
  })

  it('handles multiple reminders independently', () => {
    const r1 = makeReminder({ id: 'rem-1', title: 'Oil Change' })
    const r2 = makeReminder({
      id: 'rem-2',
      title: 'Brake Check',
      triggerType: 'DATE',
      triggerConfig: { date: '2027-08-01T00:00:00Z' },
      nextTriggerAt: new Date('2027-08-01T00:00:00Z'),
      item: makeItem({ name: 'Honda Civic' }),
    })
    const ics = generateIcs([r1 as any, r2 as any], TZ)
    expect(ics).toContain('Toyota Corolla — Oil Change')
    expect(ics).toContain('Honda Civic — Brake Check')
    // r1 → 12 events, r2 → 1 event
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length
    expect(eventCount).toBe(13)
  })

  it('each VEVENT has a stable UID', () => {
    const ics = generateIcs([makeReminder() as any], TZ)
    expect(ics).toContain('rem-1@wrenchly.app')
  })
})
