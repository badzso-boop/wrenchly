import { type PrismaClient, type ShareExport } from '@prisma/client'

export class ShareRepository {
  constructor(private db: PrismaClient) {}

  async listByUserId(userId: string): Promise<ShareExport[]> {
    return this.db.shareExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string): Promise<ShareExport | null> {
    return this.db.shareExport.findUnique({ where: { id } })
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ShareExport | null> {
    return this.db.shareExport.findFirst({ where: { id, userId } })
  }

  async create(data: {
    userId: string
    itemId: string
    content: string
    expiresAt?: Date | null
  }): Promise<ShareExport> {
    return this.db.shareExport.create({ data })
  }

  async delete(id: string): Promise<void> {
    await this.db.shareExport.delete({ where: { id } })
  }
}
