'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { AddHouseholdTransactionForm } from './AddHouseholdTransactionForm'
import { HouseholdTransactionList, HouseholdTransactionListSkeleton } from './HouseholdTransactionList'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function HouseholdFinancePageClient({ itemId }: { itemId: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL')

  const item = api.item.getById.useQuery({ id: itemId })
  const transactions = api.householdFinance.listByItemId.useQuery({
    itemId,
    month,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
  })
  const utils = api.useUtils()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Expenses &amp; Income</h1>
            {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
          </div>
        </div>
        <Button variant="ghost" size="sm" render={<Link href={`/items/${itemId}/statistics`} />} nativeButton={false}>
          <BarChart3 className="h-4 w-4 mr-1" /> Statistics
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-semibold">Transactions</h2>
            <Button
              size="sm"
              variant={showAddForm ? 'secondary' : 'default'}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Log Transaction'}
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth((e.target as HTMLInputElement).value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
            />
            <Select value={typeFilter} onValueChange={(v) => { if (v !== null) setTypeFilter(v as 'ALL' | 'EXPENSE' | 'INCOME') }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showAddForm && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <AddHouseholdTransactionForm
                itemId={itemId}
                onSuccess={() => {
                  setShowAddForm(false)
                  void transactions.refetch()
                  void utils.householdFinance.getStatistics.invalidate()
                }}
              />
            </div>
          )}

          {transactions.isLoading && <HouseholdTransactionListSkeleton />}
          {transactions.data && <HouseholdTransactionList transactions={transactions.data} />}
        </div>
      </div>
    </div>
  )
}
