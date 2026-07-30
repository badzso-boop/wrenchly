'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReadingMetrics } from '@/server/domains/reading/reading.fields'
import { MetricField } from './MetricField'
import type { ItemType } from '@prisma/client'

export function AddReadingForm({
  itemId,
  itemType,
  onSuccess,
}: {
  itemId: string
  itemType: ItemType
  onSuccess: () => void
}) {
  const metrics = getReadingMetrics(itemType) ?? []
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 10))
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')

  const createReading = api.reading.create.useMutation({
    onSuccess: () => { toast.success('Reading saved'); onSuccess() },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedMetrics: Record<string, number> = {}
    for (const m of metrics) {
      const raw = values[m.key]
      if (raw !== undefined && raw !== '') parsedMetrics[m.key] = Number(raw)
    }
    createReading.mutate({
      itemId,
      recordedAt: new Date(recordedAt),
      metrics: parsedMetrics,
      notes: notes || undefined,
    })
  }

  const hasAnyValue = metrics.some((m) => values[m.key])

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">Log Reading</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reading-date">Date *</Label>
            <DateField id="reading-date" value={recordedAt} onChange={setRecordedAt} required />
          </div>

          <div className={metrics.length > 1 ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
            {metrics.map((m) => (
              <MetricField
                key={m.key}
                metric={m}
                idPrefix="metric"
                value={values[m.key] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [m.key]: v }))}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading-notes">Notes</Label>
            <Textarea id="reading-notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
          </div>

          {createReading.error && <p className="text-sm text-destructive">{createReading.error.message}</p>}

          <Button type="submit" className="w-full" disabled={createReading.isPending || !hasAnyValue}>
            {createReading.isPending ? 'Saving…' : 'Save Reading'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
