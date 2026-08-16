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
import { CURRENCIES } from '@/components/domains/household-finance/AddHouseholdTransactionForm'
import { FuzzyMatchConfirmDialog, type SimilarNameCandidate } from './FuzzyMatchConfirmDialog'

export function AddCookingLogEntryForm({
  itemId,
  initialName,
  onSuccess,
}: {
  itemId: string
  initialName?: string
  onSuccess: () => void
}) {
  const [name, setName] = useState(initialName ?? '')
  const [ingredients, setIngredients] = useState('')
  const [servings, setServings] = useState('')
  const [daysCovered, setDaysCovered] = useState('')
  const [cost, setCost] = useState('')
  const [currency, setCurrency] = useState('HUF')
  const [linkedTransactionId, setLinkedTransactionId] = useState('')
  const [cookedAt, setCookedAt] = useState(new Date().toISOString().slice(0, 10))
  const [candidates, setCandidates] = useState<SimilarNameCandidate[] | null>(null)

  // Optional "link to the grocery expense that covered this" dropdown — only GROCERY-category
  // expenses are relevant here, filtered client-side (no server-side category filter exists,
  // the list endpoint only filters by month/type).
  const expenses = api.householdFinance.listByItemId.useQuery({ itemId, type: 'EXPENSE' })
  const groceryExpenses = (expenses.data ?? []).filter((e) => e.category === 'GROCERY')

  const create = api.cooking.create.useMutation({
    onSuccess: (result) => {
      if (result.status === 'possible_duplicate') {
        setCandidates(result.candidates)
        return
      }
      toast.success('Cooking log entry saved')
      onSuccess()
    },
  })

  function buildInput() {
    return {
      itemId,
      name,
      ingredients: ingredients || undefined,
      servings: servings ? Number(servings) : undefined,
      daysCovered: daysCovered ? Number(daysCovered) : undefined,
      cost: cost ? Number(cost) : undefined,
      currency,
      linkedTransactionId: linkedTransactionId || undefined,
      cookedAt: new Date(cookedAt),
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate(buildInput())
  }

  function handleConfirmNew() {
    create.mutate({ ...buildInput(), forceNew: true })
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base">Log a Meal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cl-name">Name *</Label>
                <Input id="cl-name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Carbonara" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-date">Cooked on *</Label>
                <DateField id="cl-date" value={cookedAt} onChange={setCookedAt} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cl-ingredients">Ingredients</Label>
              <Textarea
                id="cl-ingredients"
                value={ingredients}
                onChange={(e) => setIngredients((e.target as HTMLTextAreaElement).value)}
                rows={3}
                placeholder="Free text — one per line or however you like"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cl-servings">Servings</Label>
                <Input id="cl-servings" type="number" min="1" value={servings} onChange={(e) => setServings((e.target as HTMLInputElement).value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-days">Days it covers</Label>
                <Input id="cl-days" type="number" min="1" value={daysCovered} onChange={(e) => setDaysCovered((e.target as HTMLInputElement).value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cl-cost">Cost</Label>
                <Input id="cl-cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost((e.target as HTMLInputElement).value)} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-currency">Currency</Label>
                <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v) }}>
                  <SelectTrigger id="cl-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cl-linked-tx">Link to a grocery expense (optional)</Label>
              <Select
                value={linkedTransactionId || 'none'}
                onValueChange={(v) => { if (v !== null) setLinkedTransactionId(v === 'none' ? '' : v) }}
              >
                <SelectTrigger id="cl-linked-tx">
                  {/* Base UI's SelectValue shows the raw `value` (here a
                      transaction id) unless told how to render a label for
                      it — without this, the closed trigger showed the UUID
                      instead of the transaction's date/amount. */}
                  <SelectValue placeholder="None">
                    {(v: string) => {
                      if (!v || v === 'none') return 'None'
                      const match = groceryExpenses.find((e) => e.id === v)
                      if (!match) return 'None'
                      return `${new Date(match.occurredAt).toLocaleDateString()} — ${Number(match.amount).toLocaleString()} ${match.currency}${match.store ? ` (${match.store})` : ''}`
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {groceryExpenses.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {new Date(e.occurredAt).toLocaleDateString()} — {Number(e.amount).toLocaleString()} {e.currency}
                      {e.store ? ` (${e.store})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}

            <Button type="submit" className="w-full" disabled={create.isPending || !name}>
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {candidates && (
        <FuzzyMatchConfirmDialog
          open={!!candidates}
          onOpenChange={(open) => { if (!open) setCandidates(null) }}
          candidates={candidates}
          onConfirmNew={handleConfirmNew}
        />
      )}
    </>
  )
}
