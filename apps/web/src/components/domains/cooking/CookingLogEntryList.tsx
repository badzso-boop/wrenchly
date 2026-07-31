'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp, Pencil, ShoppingCart } from 'lucide-react'
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
import { CURRENCIES } from '@/components/domains/household-finance/AddHouseholdTransactionForm'
import type { CookingLogEntry } from '@prisma/client'

function EditCookingLogEntryForm({ entry, onDone }: { entry: CookingLogEntry; onDone: () => void }) {
  const utils = api.useUtils()
  const [name, setName] = useState(entry.name)
  const [ingredients, setIngredients] = useState(entry.ingredients ?? '')
  const [servings, setServings] = useState(entry.servings != null ? String(entry.servings) : '')
  const [daysCovered, setDaysCovered] = useState(entry.daysCovered != null ? String(entry.daysCovered) : '')
  const [cost, setCost] = useState(entry.cost != null ? String(entry.cost) : '')
  const [currency, setCurrency] = useState(entry.currency)
  const [cookedAt, setCookedAt] = useState(new Date(entry.cookedAt).toISOString().slice(0, 10))

  const update = api.cooking.update.useMutation({
    onSuccess: () => {
      toast.success('Entry updated')
      utils.cooking.listByItemId.invalidate()
      onDone()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate({
      id: entry.id,
      name,
      ingredients: ingredients || null,
      servings: servings ? Number(servings) : null,
      daysCovered: daysCovered ? Number(daysCovered) : null,
      cost: cost ? Number(cost) : null,
      currency,
      cookedAt: new Date(cookedAt),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-cl-name-${entry.id}`}>Name *</Label>
          <Input id={`edit-cl-name-${entry.id}`} value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-cl-date-${entry.id}`}>Cooked on *</Label>
          <DateField id={`edit-cl-date-${entry.id}`} value={cookedAt} onChange={setCookedAt} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`edit-cl-ingredients-${entry.id}`}>Ingredients</Label>
        <Textarea id={`edit-cl-ingredients-${entry.id}`} value={ingredients} onChange={(e) => setIngredients((e.target as HTMLTextAreaElement).value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-cl-servings-${entry.id}`}>Servings</Label>
          <Input id={`edit-cl-servings-${entry.id}`} type="number" min="1" value={servings} onChange={(e) => setServings((e.target as HTMLInputElement).value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-cl-days-${entry.id}`}>Days it covers</Label>
          <Input id={`edit-cl-days-${entry.id}`} type="number" min="1" value={daysCovered} onChange={(e) => setDaysCovered((e.target as HTMLInputElement).value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-cl-cost-${entry.id}`}>Cost</Label>
          <Input id={`edit-cl-cost-${entry.id}`} type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost((e.target as HTMLInputElement).value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-cl-currency-${entry.id}`}>Currency</Label>
          <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v) }}>
            <SelectTrigger id={`edit-cl-currency-${entry.id}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              {!CURRENCIES.includes(currency) && <SelectItem value={currency}>{currency}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>
      {update.error && <p className="text-sm text-destructive">{update.error.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

function AddToShoppingList({ cookingLogEntryId }: { cookingLogEntryId: string }) {
  const [text, setText] = useState('')
  const [showInput, setShowInput] = useState(false)

  const createItems = api.cooking.createShoppingListItemsForRecipe.useMutation({
    onSuccess: () => {
      toast.success('Added to shopping list')
      setText('')
      setShowInput(false)
    },
  })

  function handleSubmit() {
    const names = text.split('\n').map((n) => n.trim()).filter(Boolean)
    if (names.length === 0) return
    createItems.mutate({ cookingLogEntryId, names })
  }

  if (!showInput) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowInput(true)}>
        <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add to shopping list
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
        rows={3}
        placeholder="One ingredient per line — these become new shopping list items"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={createItems.isPending || !text.trim()}>
          {createItems.isPending ? 'Adding…' : 'Add items'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowInput(false)}>Cancel</Button>
      </div>
    </div>
  )
}

export function CookingLogEntryList({ entries }: { entries: CookingLogEntry[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteEntry = api.cooking.delete.useMutation({
    onSuccess: () => utils.cooking.listByItemId.invalidate(),
  })

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No meals logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isExpanded = expanded === entry.id
        return (
          <Card key={entry.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button className="w-full p-4 text-left flex items-center gap-4" onClick={() => setExpanded(isExpanded ? null : entry.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm">{entry.name}</span>
                    {entry.cost != null && (
                      <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                        {Number(entry.cost).toLocaleString()} {entry.currency}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(entry.cookedAt).toLocaleDateString()}</span>
                    {entry.servings != null && <span>{entry.servings} servings</span>}
                    {entry.daysCovered != null && <span>covers {entry.daysCovered}d</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === entry.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditCookingLogEntryForm entry={entry} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== entry.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t space-y-3 pt-3">
                  {entry.ingredients && <p className="text-sm text-muted-foreground whitespace-pre-line">{entry.ingredients}</p>}
                  <AddToShoppingList cookingLogEntryId={entry.id} />
                  <div className="flex justify-end gap-1 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(entry.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this entry?')) deleteEntry.mutate({ id: entry.id }) }}
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

export function CookingLogEntryListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
