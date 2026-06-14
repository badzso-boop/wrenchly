import { type PrismaClient, type Reminder, type User, type Item } from '@prisma/client'

type ReminderWithRelations = Reminder & { user: User; item: Item }

export class ReminderRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<Reminder | null> {
    return this.db.reminder.findUnique({ where: { id } })
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Reminder | null> {
    return this.db.reminder.findFirst({ where: { id, userId } })
  }

  async findByItemId(itemId: string, userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: { itemId, userId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findActiveByUserId(userId: string): Promise<(Reminder & { item: Item })[]> {
    return this.db.reminder.findMany({
      where: { userId, isActive: true },
      include: { item: true },
      orderBy: { nextTriggerAt: 'asc' },
    })
  }

  async findDue(before: Date): Promise<ReminderWithRelations[]> {
    return this.db.reminder.findMany({
      where: {
        isActive: true,
        nextTriggerAt: { lte: before },
      },
      include: { user: true, item: true },
    })
  }

  async findOdometerByItemId(itemId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: { itemId, isActive: true, triggerType: 'ODOMETER' },
    })
  }

  async create(data: {
    userId: string
    itemId: string
    title: string
    triggerType: string
    triggerConfig: Record<string, unknown>
    nextTriggerAt?: Date | null
  }): Promise<Reminder> {
    return this.db.reminder.create({ data: data as Parameters<typeof this.db.reminder.create>[0]['data'] })
  }

  async update(
    id: string,
    data: {
      title?: string
      isActive?: boolean
      triggerType?: string
      triggerConfig?: Record<string, unknown>
      nextTriggerAt?: Date | null
      lastTriggeredAt?: Date | null
    }
  ): Promise<Reminder> {
    return this.db.reminder.update({
      where: { id },
      data: data as Parameters<typeof this.db.reminder.update>[0]['data'],
    })
  }

  async delete(id: string): Promise<void> {
    await this.db.reminder.delete({ where: { id } })
  }
}
