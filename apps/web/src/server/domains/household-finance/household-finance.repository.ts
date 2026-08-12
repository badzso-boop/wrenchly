import type { PrismaClient, HouseholdTransaction, HouseholdTransactionType, Prisma } from '@prisma/client'
import { resolveItemAccess } from '../item/item-access.service'

export interface HouseholdFinanceListFilters {
  month?: string // 'YYYY-MM'
  type?: HouseholdTransactionType
}

export class HouseholdFinanceRepository {
  constructor(private db: PrismaClient) {}

  async findByIdAndUserId(id: string, userId: string): Promise<HouseholdTransaction | null> {
    const tx = await this.db.householdTransaction.findUnique({ where: { id } })
    if (!tx) return null
    const access = await resolveItemAccess(this.db, tx.itemId, userId)
    return access ? tx : null
  }

  // Server-side filtering (month/type) rather than fetch-all-and-filter-in-the-client — a
  // household could accumulate years of transactions, and the list view only ever needs one
  // month/direction at a time.
  async listByItemId(
    itemId: string,
    userId: string,
    filters?: HouseholdFinanceListFilters
  ): Promise<HouseholdTransaction[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    const where: Prisma.HouseholdTransactionWhereInput = { itemId }
    if (filters?.type) where.type = filters.type
    if (filters?.month) {
      const parts = filters.month.split('-')
      const year = Number(parts[0])
      const month = Number(parts[1])
      where.occurredAt = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) }
    }
    return this.db.householdTransaction.findMany({ where, orderBy: { occurredAt: 'desc' } })
  }

  // Statistics need the full, unfiltered set for the item to compute all-time/monthly buckets.
  async findAllByItemId(itemId: string, userId: string): Promise<HouseholdTransaction[]> {
    const access = await resolveItemAccess(this.db, itemId, userId)
    if (!access) return []
    return this.db.householdTransaction.findMany({
      where: { itemId },
      orderBy: { occurredAt: 'asc' },
    })
  }

  async create(data: {
    userId: string
    itemId: string
    type: HouseholdTransactionType
    amount: number
    currency: string
    category: string | null
    paidBy: string
    store: string | null
    description: string | null
    occurredAt: Date
  }): Promise<HouseholdTransaction> {
    return this.db.householdTransaction.create({ data })
  }

  async update(
    id: string,
    data: Partial<{
      type: HouseholdTransactionType
      amount: number
      currency: string
      category: string | null
      paidBy: string
      store: string | null
      description: string | null
      occurredAt: Date
    }>
  ): Promise<HouseholdTransaction> {
    return this.db.householdTransaction.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.db.householdTransaction.delete({ where: { id } })
  }
}
