'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Card, CardContent } from '@/components/ui/card'
import { getReadingMetrics } from '@/server/domains/reading/reading.fields'
import { MetricField } from './MetricField'
import type { ItemReading, ItemType } from '@prisma/client'

function EditReadingForm({
  reading,
  itemType,
  onDone,
}: {
  reading: ItemReading
  itemType: ItemType
  onDone: () => void
}) {
  const utils = api.useUtils()
  const metrics = getReadingMetrics(itemType) ?? []
  const existingMetrics = reading.metrics as Record<string, number>
  const [recordedAt, setRecordedAt] = useState(new Date(reading.recordedAt).toISOString().slice(0, 10))
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(metrics.map((m) => [m.key, existingMetrics[m.key]?.toString() ?? '']))
  )
  const [notes, setNotes] = useState(reading.notes ?? '')

  const updateReading = api.reading.update.useMutation({
    onSuccess: () => {
      toast.success('Reading updated')
      utils.reading.listByItemId.invalidate()
      utils.reading.getStatistics.invalidate()
      onDone()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedMetrics: Record<string, number> = {}
    for (const m of metrics) {
      const raw = values[m.key]
      if (raw !== undefined && raw !== '') parsedMetrics[m.key] = Number(raw)
    }
    updateReading.mutate({
      id: reading.id,
      recordedAt: new Date(recordedAt),
      metrics: parsedMetrics,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="space-y-1.5">
        <Label htmlFor={`edit-reading-date-${reading.id}`}>Date *</Label>
        <DateField id={`edit-reading-date-${reading.id}`} value={recordedAt} onChange={setRecordedAt} required />
      </div>

      <div className={metrics.length > 1 ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
        {metrics.map((m) => (
          <MetricField
            key={m.key}
            metric={m}
            idPrefix={`edit-metric-${reading.id}`}
            value={values[m.key] ?? ''}
            onChange={(v) => setValues((prev) => ({ ...prev, [m.key]: v }))}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`edit-reading-notes-${reading.id}`}>Notes</Label>
        <Textarea id={`edit-reading-notes-${reading.id}`} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>

      {updateReading.error && <p className="text-sm text-destructive">{updateReading.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateReading.isPending}>
          {updateReading.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function ReadingList({ readings, itemType }: { readings: ItemReading[]; itemType: ItemType }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const metrics = getReadingMetrics(itemType) ?? []
  const deleteReading = api.reading.delete.useMutation({
    onSuccess: () => {
      utils.reading.listByItemId.invalidate()
      utils.reading.getStatistics.invalidate()
    },
  })

  if (readings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No readings logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {readings.map((reading) => {
        const isExpanded = expanded === reading.id
        const values = reading.metrics as Record<string, number>
        const summary = metrics
          .filter((m) => typeof values[m.key] === 'number')
          .map((m) => {
            const option = m.options?.find((o) => o.value === values[m.key])
            return option ? `${m.label}: ${option.label}` : `${values[m.key]} ${m.unit}`
          })
          .join(' · ')

        return (
          <Card key={reading.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : reading.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm truncate">{new Date(reading.recordedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{summary || '—'}</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === reading.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditReadingForm reading={reading} itemType={itemType} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== reading.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  {reading.notes && <p className="text-sm text-muted-foreground pt-3">{reading.notes}</p>}
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(reading.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this reading?')) deleteReading.mutate({ id: reading.id }) }}
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
