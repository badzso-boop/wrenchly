'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ChartType, ChartAggregation } from '@prisma/client'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'LINE', label: 'Line — every logged entry over time' },
  { value: 'BAR_MONTHLY', label: 'Bar — summed per month' },
]

const AGGREGATIONS: { value: ChartAggregation; label: string }[] = [
  { value: 'LATEST', label: 'Latest value' },
  { value: 'SUM', label: 'Running total' },
]

interface ChartForRow {
  id: string
  name: string
  chartType: ChartType
  aggregation: ChartAggregation
  field: { id: string; name: string; unit: string | null }
}

function AddChartForm({
  customDomainId,
  numericFields,
  onAdded,
}: {
  customDomainId: string
  numericFields: FieldWithConfig[]
  onAdded: () => void
}) {
  const [fieldId, setFieldId] = useState('')
  const [chartType, setChartType] = useState<ChartType>('LINE')
  const [aggregation, setAggregation] = useState<ChartAggregation>('LATEST')
  const [name, setName] = useState('')

  const create = api.customDomainLog.createChart.useMutation({
    onSuccess: () => {
      toast.success('Chart added')
      setFieldId(''); setName(''); setChartType('LINE'); setAggregation('LATEST')
      onAdded()
    },
    onError: (err) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const field = numericFields.find((f) => f.id === fieldId)
    if (!field) return
    create.mutate({
      customDomainId,
      fieldId,
      name: name || `${field.name} over time`,
      chartType,
      aggregation,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <div className="space-y-1.5">
        <Label>Value to chart</Label>
        <Select value={fieldId} onValueChange={(v) => { if (v !== null) setFieldId(v) }}>
          <SelectTrigger><SelectValue placeholder="Pick a numeric log field…" /></SelectTrigger>
          <SelectContent>
            {numericFields.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}{f.unit ? ` (${f.unit})` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Chart type</Label>
          <Select value={chartType} onValueChange={(v) => { if (v !== null) setChartType(v as ChartType) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Stat tile shows</Label>
          <Select value={aggregation} onValueChange={(v) => { if (v !== null) setAggregation(v as ChartAggregation) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AGGREGATIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Chart name (optional)</Label>
        <Input value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Distance over time" />
      </div>

      <Button type="submit" size="sm" disabled={create.isPending || !fieldId}>
        {create.isPending ? 'Adding…' : 'Add chart'}
      </Button>
    </form>
  )
}

/** Lets a domain owner define which loggable numeric fields become charts on the item's
 * Statistics tab, and with which of the two starter chart types -- kept to a flat list (no
 * drag-reorder) since a handful of charts per domain is the expected scale, unlike the Log
 * form's fields where reorder matters for the entry form's layout. */
export function ChartBuilder({ customDomainId, fields }: { customDomainId: string; fields: FieldWithConfig[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const charts = api.customDomainLog.listCharts.useQuery({ customDomainId })

  const numericFields = fields.filter(
    (f) => f.loggable && !f.archivedAt && (f.fieldType === 'NUMBER' || f.fieldType === 'DECIMAL')
  )

  const remove = api.customDomainLog.deleteChart.useMutation({
    onSuccess: () => { toast.success('Chart removed'); charts.refetch() },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Statistics</p>

      {(charts.data as ChartForRow[] | undefined)?.map((chart) => (
        <div key={chart.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
          <span>
            {chart.name} <span className="text-muted-foreground">({chart.field.name})</span>
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove.mutate({ chartId: chart.id })}>
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {charts.data?.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground">No charts yet.</p>
      )}

      {numericFields.length === 0 ? (
        <p className="text-xs text-muted-foreground">Add a Number or Decimal log field first to chart it.</p>
      ) : showAdd ? (
        <AddChartForm
          customDomainId={customDomainId}
          numericFields={numericFields}
          onAdded={() => { setShowAdd(false); charts.refetch() }}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add chart
        </Button>
      )}
    </div>
  )
}
