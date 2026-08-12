import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import type { HouseholdTransaction, HouseholdTransactionType } from '@prisma/client'
import { type HouseholdFinanceRepository, type HouseholdFinanceListFilters } from './household-finance.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { isValidCategory } from './household-finance.categories'

interface TransactionCreateInput {
  itemId: string
  type: HouseholdTransactionType
  amount: number
  currency?: string
  category?: string | null
  paidBy: string
  store?: string | null
  description?: string | null
  occurredAt: Date
}

interface TransactionUpdateInput {
  type?: HouseholdTransactionType
  amount?: number
  currency?: string
  category?: string | null
  paidBy?: string
  store?: string | null
  description?: string | null
  occurredAt?: Date
}

function sum(list: HouseholdTransaction[]): number {
  return list.reduce((s, t) => s + Number(t.amount), 0)
}

function breakdownBy(list: HouseholdTransaction[], key: (t: HouseholdTransaction) => string) {
  const map = new Map<string, number>()
  for (const t of list) {
    const k = key(t)
    map.set(k, (map.get(k) ?? 0) + Number(t.amount))
  }
  return Array.from(map.entries()).map(([k, amount]) => ({ key: k, amount }))
}

export class HouseholdFinanceService {
  constructor(
    private repo: HouseholdFinanceRepository,
    private itemRepo: ItemRepository
  ) {}

  async create(userId: string, input: TransactionCreateInput): Promise<HouseholdTransaction> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
    if (item.type !== 'HOME') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.household_finance.not_home_item' })
    }
    if (input.category && !isValidCategory(input.type, input.category)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.household_finance.invalid_category' })
    }

    return this.repo.create({
      userId,
      itemId: input.itemId,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? 'HUF',
      category: input.category ?? null,
      paidBy: input.paidBy,
      store: input.store ?? null,
      description: input.description ?? null,
      occurredAt: input.occurredAt,
    })
  }

  async update(id: string, userId: string, input: TransactionUpdateInput): Promise<HouseholdTransaction> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.household_finance.not_found' })

    const effectiveType = input.type ?? existing.type
    const effectiveCategory = input.category !== undefined ? input.category : existing.category
    if (effectiveCategory && !isValidCategory(effectiveType, effectiveCategory)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.household_finance.invalid_category' })
    }

    return this.repo.update(id, input)
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.household_finance.not_found' })
    await this.repo.delete(id)
  }

  async listByItemId(
    itemId: string,
    userId: string,
    filters?: HouseholdFinanceListFilters
  ): Promise<HouseholdTransaction[]> {
    return this.repo.listByItemId(itemId, userId, filters)
  }

  async getStatistics(itemId: string, userId: string) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const transactions = await this.repo.findAllByItemId(itemId, userId)
    const expenses = transactions.filter((t) => t.type === 'EXPENSE')
    const incomes = transactions.filter((t) => t.type === 'INCOME')

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const allTime = { expense: sum(expenses), income: sum(incomes) }
    const last30Days = {
      expense: sum(expenses.filter((t) => t.occurredAt >= thirtyDaysAgo)),
      income: sum(incomes.filter((t) => t.occurredAt >= thirtyDaysAgo)),
    }

    const monthlyMap = new Map<string, { month: string; expense: number; income: number }>()
    for (const t of transactions) {
      const key = format(t.occurredAt, 'yyyy-MM')
      const bucket = monthlyMap.get(key) ?? { month: key, expense: 0, income: 0 }
      if (t.type === 'EXPENSE') bucket.expense += Number(t.amount)
      else bucket.income += Number(t.amount)
      monthlyMap.set(key, bucket)
    }
    const monthly = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, balance: m.income - m.expense }))

    const expenseByCategory = breakdownBy(expenses, (t) => t.category ?? 'OTHER').map((b) => ({
      category: b.key,
      amount: b.amount,
    }))
    const incomeByCategory = breakdownBy(incomes, (t) => t.category ?? 'OTHER').map((b) => ({
      category: b.key,
      amount: b.amount,
    }))

    // `paidBy` is now a legacy display-only fallback (superseded by paidByUserId,
    // see item-collaborator domain) - every row is backfilled so this is
    // realistically never null in practice, but the type went optional with
    // the migration. Real paidByUserId-based attribution is a later step.
    const expenseByPaidBy = breakdownBy(expenses, (t) => t.paidBy ?? 'Unknown').map((b) => ({ paidBy: b.key, amount: b.amount }))
    const incomeByPaidBy = breakdownBy(incomes, (t) => t.paidBy ?? 'Unknown').map((b) => ({ paidBy: b.key, amount: b.amount }))

    // Net balance per person: how much they've put into the shared pool (INCOME) minus how
    // much of the household's spending is attributed to them (EXPENSE) — positive means
    // they're "in credit" relative to the household, negative means the opposite.
    const people = new Set([...expenseByPaidBy.map((p) => p.paidBy), ...incomeByPaidBy.map((p) => p.paidBy)])
    const netBalanceByPerson = Array.from(people).map((paidBy) => {
      const income = incomeByPaidBy.find((p) => p.paidBy === paidBy)?.amount ?? 0
      const expense = expenseByPaidBy.find((p) => p.paidBy === paidBy)?.amount ?? 0
      return { paidBy, net: income - expense }
    })

    const currencies = Array.from(new Set(transactions.map((t) => t.currency)))

    return {
      allTime,
      last30Days,
      monthly,
      expenseByCategory,
      incomeByCategory,
      expenseByPaidBy,
      incomeByPaidBy,
      netBalanceByPerson,
      currencies,
      transactionCount: transactions.length,
    }
  }
}
