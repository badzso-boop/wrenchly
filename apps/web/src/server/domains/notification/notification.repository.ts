import { type PrismaClient, type SmartNotification } from '@prisma/client'

export class NotificationRepository {
  constructor(private db: PrismaClient) {}

  async findByUserId(userId: string, unreadOnly: boolean): Promise<SmartNotification[]> {
    return this.db.smartNotification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
    })
  }

  async countUnread(userId: string): Promise<number> {
    return this.db.smartNotification.count({ where: { userId, readAt: null } })
  }

  async markRead(id: string, userId: string): Promise<SmartNotification> {
    return this.db.smartNotification.update({ where: { id }, data: { readAt: new Date() } })
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db.smartNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
  }
}
