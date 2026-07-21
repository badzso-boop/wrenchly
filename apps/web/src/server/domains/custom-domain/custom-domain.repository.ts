import {
  type PrismaClient,
  type CustomDomain,
  type CustomDomainField,
  type CustomItemData,
  type FieldType,
  Prisma,
} from '@prisma/client'

export type CustomDomainWithFields = CustomDomain & { fields: CustomDomainField[] }

export class CustomDomainRepository {
  constructor(private db: PrismaClient) {}

  async listByUserId(userId: string): Promise<CustomDomainWithFields[]> {
    return this.db.customDomain.findMany({
      where: { userId },
      include: { fields: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string): Promise<CustomDomainWithFields | null> {
    return this.db.customDomain.findUnique({
      where: { id },
      include: { fields: { orderBy: { order: 'asc' } } },
    })
  }

  async create(userId: string, data: { name: string; icon?: string | null }): Promise<CustomDomain> {
    return this.db.customDomain.create({ data: { userId, ...data } })
  }

  async delete(id: string): Promise<void> {
    await this.db.customDomain.delete({ where: { id } })
  }

  async addField(
    customDomainId: string,
    data: {
      name: string
      key: string
      fieldType: FieldType
      unit?: string | null
      required?: boolean
      options?: string[]
      order?: number
    }
  ): Promise<CustomDomainField> {
    return this.db.customDomainField.create({ data: { customDomainId, ...data } })
  }

  async findFieldById(fieldId: string): Promise<CustomDomainField | null> {
    return this.db.customDomainField.findUnique({ where: { id: fieldId } })
  }

  async removeField(fieldId: string): Promise<void> {
    await this.db.customDomainField.delete({ where: { id: fieldId } })
  }

  async findItemData(itemId: string): Promise<CustomItemData | null> {
    return this.db.customItemData.findUnique({ where: { itemId } })
  }

  async attachItem(itemId: string, customDomainId: string): Promise<CustomItemData> {
    return this.db.customItemData.create({ data: { itemId, customDomainId, data: {} } })
  }

  async updateItemData(itemId: string, data: Record<string, unknown>): Promise<CustomItemData> {
    return this.db.customItemData.update({
      where: { itemId },
      data: { data: data as Prisma.InputJsonValue },
    })
  }
}
