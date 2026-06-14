import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { ReminderRepository } from '@/server/domains/reminder/reminder.repository'
import { UserRepository } from '@/server/domains/user/user.repository'
import { generateIcs } from '@/server/domains/calendar/calendar.service'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const userRepo = new UserRepository(db)
  const user = await userRepo.findByCalendarToken(token)

  if (!user) {
    return new NextResponse('Not found', { status: 404 })
  }

  const reminderRepo = new ReminderRepository(db)
  const reminders = await reminderRepo.findActiveByUserId(user.id)

  const ics = generateIcs(reminders, user.timezone)

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="wrenchly.ics"',
      'Cache-Control': 'max-age=3600, s-maxage=3600',
    },
  })
}
