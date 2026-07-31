'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCategoriesFor } from '@/server/domains/household-finance/household-finance.categories'

// Same currency list as the trip domain's AddTripLogForm — kept in sync deliberately.
export const CURRENCIES = ['HUF', 'EUR', 'USD', 'GBP', 'CHF']

// Hardcoded per the finalized spec (PR #14) — real user accounts/permissions for a shared
// Home item are planned as a separate, later PR, not this one.
export const PAID_BY_OPTIONS = ['Norbi', 'Dori']

export function AddHouseholdTransactionForm({ itemId, onSuccess }: { itemId: string; onSuccess: () => void }) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('HUF')
  const [category, setCategory] = useState('')
  const [paidBy, setPaidBy] = useState<string>(PAID_BY_OPTIONS[0] ?? 'Norbi')
  const [store, setStore] = useState('')
  const [description, setDescription] = useState('')

  const create = api.householdFinance.create.useMutation({
    onSuccess: () => { toast.success('Transaction logged'); onSuccess() },
  })

  const categories = getCategoriesFor(type)

  function handleTypeChange(v: string) {
    setType(v as 'EXPENSE' | 'INCOME')
    setCategory('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate({
      itemId,
      type,
      amount: Number(amount),
      currency,
      category: category || undefined,
      paidBy,
      store: type === 'EXPENSE' && store ? store : undefined,
      description: description || undefined,
      occurredAt: new Date(occurredAt),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">Log Expense / Income</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hf-type">Type *</Label>
              <Select value={type} onValueChange={(v) => { if (v !== null) handleTypeChange(v) }}>
                <SelectTrigger id="hf-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hf-date">Date *</Label>
              <DateField id="hf-date" value={occurredAt} onChange={setOccurredAt} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hf-category">Category</Label>
              <Select value={category || 'none'} onValueChange={(v) => { if (v !== null) setCategory(v === 'none' ? '' : v) }}>
                <SelectTrigger id="hf-category"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hf-paidby">Who</Label>
              <Select value={paidBy} onValueChange={(v) => { if (v !== null) setPaidBy(v) }}>
                <SelectTrigger id="hf-paidby"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAID_BY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hf-amount">Amount *</Label>
              <Input id="hf-amount" type="number" value={amount} onChange={(e) => setAmount((e.target as HTMLInputElement).value)} min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hf-currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v) }}>
                <SelectTrigger id="hf-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'EXPENSE' && (
            <div className="space-y-2">
              <Label htmlFor="hf-store">Store / place</Label>
              <Input id="hf-store" value={store} onChange={(e) => setStore((e.target as HTMLInputElement).value)} placeholder="e.g. Lidl, Wolt (optional)" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hf-description">Description</Label>
            <Textarea id="hf-description" value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Optional" />
          </div>

          {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}

          <Button type="submit" className="w-full" disabled={create.isPending || !amount}>
            {create.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
