'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp, Pencil, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getCategoriesFor } from '@/server/domains/household-finance/household-finance.categories'
import { CURRENCIES, PAID_BY_OPTIONS } from './AddHouseholdTransactionForm'
import type { HouseholdTransaction } from '@prisma/client'

function categoryLabel(type: 'EXPENSE' | 'INCOME', category: string | null): string | null {
  if (!category) return null
  return getCategoriesFor(type).find((c) => c.value === category)?.label ?? category
}

function EditHouseholdTransactionForm({ tx, onDone }: { tx: HouseholdTransaction; onDone: () => void }) {
  const utils = api.useUtils()
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(tx.type)
  const [occurredAt, setOccurredAt] = useState(new Date(tx.occurredAt).toISOString().slice(0, 10))
  const [amount, setAmount] = useState(String(tx.amount))
  const [currency, setCurrency] = useState(tx.currency)
  const [category, setCategory] = useState(tx.category ?? '')
  const [paidBy, setPaidBy] = useState(tx.paidBy ?? '')
  const [store, setStore] = useState(tx.store ?? '')
  const [description, setDescription] = useState(tx.description ?? '')

  const update = api.householdFinance.update.useMutation({
    onSuccess: () => {
      toast.success('Transaction updated')
      utils.householdFinance.listByItemId.invalidate()
      utils.householdFinance.getStatistics.invalidate()
      onDone()
    },
  })

  const categories = getCategoriesFor(type)

  function handleTypeChange(v: string) {
    setType(v as 'EXPENSE' | 'INCOME')
    setCategory('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate({
      id: tx.id,
      type,
      amount: Number(amount),
      currency,
      category: category || null,
      paidBy,
      store: type === 'EXPENSE' ? store || null : null,
      description: description || null,
      occurredAt: new Date(occurredAt),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-type-${tx.id}`}>Type *</Label>
          <Select value={type} onValueChange={(v) => { if (v !== null) handleTypeChange(v) }}>
            <SelectTrigger id={`edit-hf-type-${tx.id}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-date-${tx.id}`}>Date *</Label>
          <DateField id={`edit-hf-date-${tx.id}`} value={occurredAt} onChange={setOccurredAt} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-category-${tx.id}`}>Category</Label>
          <Select value={category || 'none'} onValueChange={(v) => { if (v !== null) setCategory(v === 'none' ? '' : v) }}>
            <SelectTrigger id={`edit-hf-category-${tx.id}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-paidby-${tx.id}`}>Who</Label>
          <Select value={paidBy} onValueChange={(v) => { if (v !== null) setPaidBy(v) }}>
            <SelectTrigger id={`edit-hf-paidby-${tx.id}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAID_BY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              {!PAID_BY_OPTIONS.includes(paidBy) && <SelectItem value={paidBy}>{paidBy}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-amount-${tx.id}`}>Amount *</Label>
          <Input id={`edit-hf-amount-${tx.id}`} type="number" value={amount} onChange={(e) => setAmount((e.target as HTMLInputElement).value)} min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-currency-${tx.id}`}>Currency</Label>
          <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v) }}>
            <SelectTrigger id={`edit-hf-currency-${tx.id}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              {!CURRENCIES.includes(currency) && <SelectItem value={currency}>{currency}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {type === 'EXPENSE' && (
        <div className="space-y-1.5">
          <Label htmlFor={`edit-hf-store-${tx.id}`}>Store / place</Label>
          <Input id={`edit-hf-store-${tx.id}`} value={store} onChange={(e) => setStore((e.target as HTMLInputElement).value)} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`edit-hf-description-${tx.id}`}>Description</Label>
        <Textarea id={`edit-hf-description-${tx.id}`} value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>

      {update.error && <p className="text-sm text-destructive">{update.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function HouseholdTransactionList({ transactions }: { transactions: HouseholdTransaction[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteTx = api.householdFinance.delete.useMutation({
    onSuccess: () => {
      utils.householdFinance.listByItemId.invalidate()
      utils.householdFinance.getStatistics.invalidate()
    },
  })

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No transactions logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isExpanded = expanded === tx.id
        const isIncome = tx.type === 'INCOME'

        return (
          <Card key={tx.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : tx.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {isIncome ? (
                      <ArrowUpCircle className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <Badge variant={isIncome ? 'secondary' : 'outline'}>{isIncome ? 'Income' : 'Expense'}</Badge>
                    {categoryLabel(tx.type, tx.category) && (
                      <span className="text-xs text-muted-foreground">{categoryLabel(tx.type, tx.category)}</span>
                    )}
                    <span className="font-medium text-sm ml-auto tabular-nums">
                      {Number(tx.amount).toLocaleString()} {tx.currency}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(tx.occurredAt).toLocaleDateString()}</span>
                    <span>{tx.paidBy}</span>
                    {tx.store && <span>{tx.store}</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === tx.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditHouseholdTransactionForm tx={tx} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== tx.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  {tx.description && <p className="text-sm text-muted-foreground pt-3">{tx.description}</p>}
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(tx.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this transaction?')) deleteTx.mutate({ id: tx.id }) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function HouseholdTransactionListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
