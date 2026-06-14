'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { Plus, Minus, AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

const CATEGORIES = ['Oil & Fluids', 'Filters', 'Brakes', 'Electrical', 'Tyres', 'Tools', 'Chemicals', 'Gardening', 'Aquarium', 'Other']

export function InventoryClient() {
  const items = api.inventory.list.useQuery()
  const create = api.inventory.create.useMutation({
    onSuccess: () => { items.refetch(); setShowForm(false); resetForm(); toast.success('Item added') },
  })
  const adjust = api.inventory.adjustQuantity.useMutation({ onSuccess: () => items.refetch() })
  const del = api.inventory.delete.useMutation({ onSuccess: () => { items.refetch(); toast.success('Item deleted') } })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Oil & Fluids', quantity: '1', unit: 'pcs', minQuantity: '', location: '' })

  function resetForm() {
    setForm({ name: '', category: 'Oil & Fluids', quantity: '1', unit: 'pcs', minQuantity: '', location: '' })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    create.mutate({ name: form.name, category: form.category, quantity: Number(form.quantity), unit: form.unit, minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined, location: form.location || undefined })
  }

  const list = items.data ?? []
  const lowStock = list.filter((i) => i.minQuantity !== null && Number(i.quantity) <= Number(i.minQuantity))

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">{list.length} item{list.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Item</>}
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-3xl mx-auto space-y-6">
          {showForm && (
            <Card className="animate-in slide-in-from-top-2 duration-200">
              <CardHeader className="pb-4"><CardTitle className="text-base">New Inventory Item</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} placeholder="e.g. Castrol Edge 5W-30" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={form.category} onValueChange={(v) => { if (v !== null) setForm((f) => ({ ...f, category: v })) }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: (e.target as HTMLInputElement).value }))} placeholder="e.g. Shelf A3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="qty">Quantity *</Label>
                      <Input id="qty" type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: (e.target as HTMLInputElement).value }))} min="0" step="0.001" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit *</Label>
                      <Input id="unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: (e.target as HTMLInputElement).value }))} placeholder="pcs / L" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minQty">Min alert</Label>
                      <Input id="minQty" type="number" value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: (e.target as HTMLInputElement).value }))} min="0" step="0.001" placeholder="Optional" />
                    </div>
                  </div>
                  {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
                  <Button type="submit" className="w-full" disabled={create.isPending || !form.name}>
                    {create.isPending ? 'Adding…' : 'Add to Inventory'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {lowStock.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Low stock ({lowStock.length})</p>
                </div>
                <div className="space-y-1">
                  {lowStock.map((i) => (
                    <p key={i.id} className="text-sm text-amber-700 dark:text-amber-400">
                      {i.name} — {Number(i.quantity)} {i.unit} (min: {Number(i.minQuantity)})
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {items.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          )}

          {!items.isLoading && list.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No inventory items yet.</p>
            </div>
          )}

          <div className="space-y-2">
            {list.map((item) => {
              const isLow = item.minQuantity !== null && Number(item.quantity) <= Number(item.minQuantity)
              return (
                <Card key={item.id} className={isLow ? 'border-amber-300 dark:border-amber-700' : ''}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.category}{item.location ? ` · ${item.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => adjust.mutate({ id: item.id, delta: -1 })}
                        disabled={Number(item.quantity) === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold w-16 text-center tabular-nums">
                        {Number(item.quantity)} <span className="font-normal text-muted-foreground text-xs">{item.unit}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => adjust.mutate({ id: item.id, delta: 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => { if (window.confirm('Delete?')) del.mutate({ id: item.id }) }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
