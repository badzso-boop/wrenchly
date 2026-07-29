'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getMaintenanceCategories } from '@/server/domains/maintenance/maintenance.categories'
import type { MaintenanceRecord, Part, ItemType } from '@prisma/client'

type RecordWithParts = MaintenanceRecord & { parts: Part[] }

// The full per-item-type category list (see maintenance.categories.ts) is much larger
// than a handful of vehicle terms, so colors are assigned deterministically by hashing
// the category value into a fixed palette instead of hand-maintaining one entry per key.
const CATEGORY_PALETTE = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
]
const OTHER_COLOR = 'bg-muted text-muted-foreground'

function categoryColor(category: string): string {
  if (category === 'OTHER') return OTHER_COLOR
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length] ?? OTHER_COLOR
}

interface EditPart {
  name: string
  quantity: number
  unit: string
  unitPrice: number | undefined
}

interface EditMaintenanceFormProps {
  record: RecordWithParts
  itemType: ItemType
  onDone: () => void
}

function EditMaintenanceForm({ record, itemType, onDone }: EditMaintenanceFormProps) {
  const utils = api.useUtils()
  const categories = getMaintenanceCategories(itemType)
  const [title, setTitle] = useState(record.title)
  const [category, setCategory] = useState(record.category)
  const [performedAt, setPerformedAt] = useState(new Date(record.performedAt).toISOString().slice(0, 10))
  const [odometerValue, setOdometerValue] = useState(record.odometerValue?.toString() ?? '')
  const [notes, setNotes] = useState(record.notes ?? '')
  const [parts, setParts] = useState<EditPart[]>(
    record.parts.map((p) => ({
      name: p.name,
      quantity: Number(p.quantity),
      unit: p.unit,
      unitPrice: p.unitPrice != null ? Number(p.unitPrice) : undefined,
    }))
  )

  const updateRecord = api.maintenance.update.useMutation({
    onSuccess: () => {
      toast.success('Maintenance record updated')
      utils.maintenance.listByItemId.invalidate()
      onDone()
    },
  })

  function addPart() {
    setParts([...parts, { name: '', quantity: 1, unit: 'pcs', unitPrice: undefined }])
  }

  function updatePart(index: number, field: keyof EditPart, value: string | number | undefined) {
    setParts(parts.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateRecord.mutate({
      id: record.id,
      title,
      category,
      performedAt: new Date(performedAt),
      odometerValue: odometerValue ? Number(odometerValue) : undefined,
      notes: notes || undefined,
      parts: parts.filter((p) => p.name).map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit, unitPrice: p.unitPrice })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-title-${record.id}`}>Title *</Label>
          <Input id={`edit-title-${record.id}`} value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} required />
        </div>
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
          <Label htmlFor={`edit-date-${record.id}`}>Date *</Label>
          <Input id={`edit-date-${record.id}`} type="date" value={performedAt} onChange={(e) => setPerformedAt((e.target as HTMLInputElement).value)} required />
        </div>
        {itemType === 'VEHICLE' && (
          <div className="space-y-1.5">
            <Label htmlFor={`edit-odo-${record.id}`}>Odometer (km)</Label>
            <Input id={`edit-odo-${record.id}`} type="number" value={odometerValue} onChange={(e) => setOdometerValue((e.target as HTMLInputElement).value)} min="0" />
          </div>
        )}
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor={`edit-notes-${record.id}`}>Notes</Label>
        <Textarea id={`edit-notes-${record.id}`} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>

      {updateRecord.error && <p className="text-sm text-destructive">{updateRecord.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateRecord.isPending || !title}>
          {updateRecord.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function MaintenanceList({ records, itemType }: { records: RecordWithParts[]; itemType: ItemType }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteRecord = api.maintenance.delete.useMutation()

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No maintenance records yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const isExpanded = expanded === record.id
        const colorClass = categoryColor(record.category)

        return (
          <Card key={record.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : record.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm truncate">{record.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
                      {record.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(record.performedAt).toLocaleDateString()}</span>
                    {record.odometerValue && <span>{Number(record.odometerValue).toLocaleString()} km</span>}
                    {record.costTotal && (
                      <span className="font-medium text-foreground">
                        {Number(record.costTotal).toLocaleString()} Ft
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === record.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditMaintenanceForm
                    record={record}
                    itemType={itemType}
                    onDone={() => setEditingId(null)}
                  />
                </div>
              )}

              {isExpanded && editingId !== record.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  {record.notes && (
                    <p className="text-sm text-muted-foreground pt-3 mb-3">{record.notes}</p>
                  )}
                  {record.parts.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Parts used</p>
                      <div className="space-y-1">
                        {record.parts.map((part) => (
                          <div key={part.id} className="flex items-center justify-between text-sm">
                            <span>{part.name}{part.partNumber ? ` (${part.partNumber})` : ''}</span>
                            <span className="text-muted-foreground">
                              {Number(part.quantity)}× {part.unitPrice ? `${Number(part.unitPrice).toLocaleString()} Ft` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(record.id)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this record?')) deleteRecord.mutate({ id: record.id }) }}
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
