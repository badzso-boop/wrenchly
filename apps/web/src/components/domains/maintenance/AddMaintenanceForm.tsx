'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMaintenanceCategories } from '@/server/domains/maintenance/maintenance.categories'
import type { ItemType } from '@prisma/client'

interface Part {
  name: string
  quantity: number
  unit: string
  unitPrice: number | undefined
}

export function AddMaintenanceForm({ itemId, itemType, onSuccess }: { itemId: string; itemType: ItemType; onSuccess: () => void }) {
  const categories = getMaintenanceCategories(itemType)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[categories.length - 1]?.value ?? 'OTHER')
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10))
  const [odometerValue, setOdometerValue] = useState('')
  const [notes, setNotes] = useState('')
  const [parts, setParts] = useState<Part[]>([])

  const createRecord = api.maintenance.create.useMutation({
    onSuccess: () => { toast.success('Maintenance record saved'); onSuccess() },
  })

  function addPart() {
    setParts([...parts, { name: '', quantity: 1, unit: 'pcs', unitPrice: undefined }])
  }

  function updatePart(index: number, field: keyof Part, value: string | number | undefined) {
    setParts(parts.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createRecord.mutate({
      itemId, title, category,
      performedAt: new Date(performedAt),
      odometerValue: odometerValue ? Number(odometerValue) : undefined,
      notes: notes || undefined,
      parts: parts.filter((p) => p.name).map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit, unitPrice: p.unitPrice })),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">Log Maintenance</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} placeholder={`e.g. ${categories[0]?.label ?? 'Maintenance'}`} required />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => { if (v !== null) setCategory(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={itemType === 'VEHICLE' ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={performedAt} onChange={(e) => setPerformedAt((e.target as HTMLInputElement).value)} required />
            </div>
            {itemType === 'VEHICLE' && (
              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer (km)</Label>
                <Input id="odometer" type="number" value={odometerValue} onChange={(e) => setOdometerValue((e.target as HTMLInputElement).value)} placeholder="e.g. 55000" min="0" />
              </div>
            )}
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Parts Used</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addPart} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Part
              </Button>
            </div>
            {parts.map((part, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <Input value={part.name} onChange={(e) => updatePart(i, 'name', (e.target as HTMLInputElement).value)} placeholder="Part name" className="col-span-2 h-8 text-sm" />
                <Input type="number" value={part.quantity} onChange={(e) => updatePart(i, 'quantity', Number((e.target as HTMLInputElement).value))} min="0" className="h-8 text-sm" />
                <div className="flex gap-1">
                  <Input type="number" value={part.unitPrice ?? ''} onChange={(e) => updatePart(i, 'unitPrice', (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : undefined)} placeholder="Price" className="h-8 text-sm flex-1 min-w-0" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setParts(parts.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
          </div>

          {createRecord.error && <p className="text-sm text-destructive">{createRecord.error.message}</p>}

          <Button type="submit" className="w-full" disabled={createRecord.isPending || !title}>
            {createRecord.isPending ? 'Saving…' : 'Save Record'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
