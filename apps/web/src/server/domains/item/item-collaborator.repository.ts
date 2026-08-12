import { type PrismaClient, type ItemCollaborator, type User, ItemCollaboratorStatus } from '@prisma/client'

type PublicUser = Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>
const PUBLIC_USER_SELECT = { id: true, name: true, username: true, avatarUrl: true } as const

export type ItemCollaboratorWithUser = ItemCollaborator & { user: PublicUser }

export class ItemCollaboratorRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<ItemCollaborator | null> {
    return this.db.itemCollaborator.findUnique({ where: { id } })
  }

  async findByItemAndUser(itemId: string, userId: string): Promise<ItemCollaborator | null> {
    return this.db.itemCollaborator.findUnique({ where: { itemId_userId: { itemId, userId } } })
  }

  async create(itemId: string, userId: string, invitedById: string): Promise<ItemCollaborator> {
    return this.db.itemCollaborator.create({ data: { itemId, userId, invitedById } })
  }

  /** Re-invite after a decline: flips the same row back to PENDING instead of erroring/duplicating. */
  async reopenAsPending(id: string, invitedById: string): Promise<ItemCollaborator> {
    return this.db.itemCollaborator.update({
      where: { id },
      data: { invitedById, status: ItemCollaboratorStatus.PENDING, respondedAt: null },
    })
  }

  async updateStatus(id: string, status: ItemCollaboratorStatus): Promise<ItemCollaborator> {
    return this.db.itemCollaborator.update({ where: { id }, data: { status, respondedAt: new Date() } })
  }

  async delete(id: string): Promise<void> {
    await this.db.itemCollaborator.delete({ where: { id } })
  }

  async listForItem(itemId: string): Promise<ItemCollaboratorWithUser[]> {
    return this.db.itemCollaborator.findMany({
      where: { itemId },
      include: { user: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    })
  }
}
