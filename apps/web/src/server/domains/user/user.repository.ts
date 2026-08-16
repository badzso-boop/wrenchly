import { type PrismaClient, type User, type NotificationPreference } from '@prisma/client'

export class UserRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } })
  }

  async update(
    id: string,
    data: {
      name?: string
      locale?: string
      timezone?: string
      expoPushToken?: string | null
      defaultLat?: number | null
      defaultLon?: number | null
    }
  ): Promise<User> {
    return this.db.user.update({ where: { id }, data })
  }

  async getNotifPref(userId: string): Promise<NotificationPreference | null> {
    return this.db.notificationPreference.findUnique({ where: { userId } })
  }

  async saveCalendarToken(userId: string, token: string): Promise<User> {
    return this.db.user.update({ where: { id: userId }, data: { calendarToken: token } })
  }

  /** Stored lowercase so uniqueness holds regardless of the case the user typed
   * (Postgres has no case-insensitive collation configured here). Throws the
   * raw Prisma error on a unique-constraint hit (P2002) - the caller (handler)
   * maps that to a friendly "username taken" TRPCError. */
  async updateUsername(id: string, username: string): Promise<User> {
    return this.db.user.update({ where: { id }, data: { username: username.toLowerCase() } })
  }

  async findByCalendarToken(token: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { calendarToken: token } })
  }

  async upsertNotifPref(
    userId: string,
    data: {
      pushEnabled?: boolean
      emailEnabled?: boolean
      quietHoursFrom?: number | null
      quietHoursTo?: number | null
      advanceDays?: number
      weeklyDigest?: boolean
    }
  ): Promise<NotificationPreference> {
    return this.db.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })
  }
}
