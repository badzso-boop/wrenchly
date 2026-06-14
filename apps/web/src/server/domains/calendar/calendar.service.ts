import ical, { ICalCalendarMethod, ICalAlarmType } from 'ical-generator'
import { addDays } from 'date-fns'
import type { Reminder, Item } from '@prisma/client'

type ReminderWithItem = Reminder & { item: Item }

function buildDescription(reminder: ReminderWithItem): string {
  const config = reminder.triggerConfig as Record<string, unknown>
  switch (String(reminder.triggerType)) {
    case 'INTERVAL_DAYS': {
      const days = config['days']
      return typeof days === 'number' ? `Repeats every ${days} day${days !== 1 ? 's' : ''}` : ''
    }
    case 'DATE':
      return 'One-time reminder'
    case 'CRON':
      return `Schedule: ${config['expression'] ?? ''}`
    case 'ODOMETER': {
      const km = config['every_km']
      return typeof km === 'number' ? `Every ${km.toLocaleString()} km` : ''
    }
    default:
      return ''
  }
}

// For INTERVAL_DAYS reminders, generate next N occurrences so the calendar
// shows upcoming events beyond just the immediate next trigger.
function futureOccurrences(reminder: ReminderWithItem, count = 12): Date[] {
  if (String(reminder.triggerType) !== 'INTERVAL_DAYS') return []
  if (!reminder.nextTriggerAt) return []

  const config = reminder.triggerConfig as Record<string, unknown>
  const days = config['days']
  if (typeof days !== 'number') return []

  const dates: Date[] = []
  let cursor = reminder.nextTriggerAt
  for (let i = 1; i < count; i++) {
    cursor = addDays(cursor, days)
    dates.push(cursor)
  }
  return dates
}

export function generateIcs(reminders: ReminderWithItem[], userTimezone: string): string {
  const calendar = ical({
    name: 'Wrenchly Maintenance',
    description: 'Your maintenance reminders from Wrenchly',
    timezone: userTimezone,
    method: ICalCalendarMethod.PUBLISH,
  })

  for (const reminder of reminders) {
    if (!reminder.nextTriggerAt) continue

    const summary = `${reminder.item.name} — ${reminder.title}`
    const description = buildDescription(reminder)
    const start = reminder.nextTriggerAt

    // Primary event
    const event = calendar.createEvent({
      id: `${reminder.id}@wrenchly.app`,
      summary,
      description,
      start,
      end: new Date(start.getTime() + 60 * 60 * 1000),
      timezone: userTimezone,
    })

    event.createAlarm({
      type: ICalAlarmType.display,
      triggerBefore: 24 * 60 * 60, // 24 hours before, in seconds
      description: summary,
    })

    // Future occurrences for recurring reminders
    for (const [i, date] of futureOccurrences(reminder).entries()) {
      const future = calendar.createEvent({
        id: `${reminder.id}-${i + 1}@wrenchly.app`,
        summary,
        description,
        start: date,
        end: new Date(date.getTime() + 60 * 60 * 1000),
        timezone: userTimezone,
      })
      future.createAlarm({
        type: ICalAlarmType.display,
        triggerBefore: 24 * 60 * 60,
        description: summary,
      })
    }
  }

  return calendar.toString()
}
