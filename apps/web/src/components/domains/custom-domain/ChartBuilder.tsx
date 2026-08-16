'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartPickerDialog } from './ChartPickerDialog'
import { chartTypesForFieldType } from '@/server/domains/custom-domain/chart-field-compat'
import type { ChartType, ChartAggregation } from '@prisma/client'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

interface ChartForRow {
  id: string
  name: string
  chartType: ChartType
  aggregation: ChartAggregation
  field: { id: string; name: string; unit: string | null }
}

/** Lets a domain owner pick which loggable fields become charts on the item's Statistics tab.
 * "Add chart" is a two-step flow: pick the field here, then ChartPickerDialog shows every chart
 * type that field supports with a live (or illustrative) preview to choose from -- the same
 * dialog also opens directly from a field's own "Choose chart" menu item in the Log builder. */
export function ChartBuilder({ customDomainId, fields }: { customDomainId: string; fields: FieldWithConfig[] }) {
  const [pickingField, setPickingField] = useState(false)
  const [fieldId, setFieldId] = useState('')
  const [chartField, setChartField] = useState<FieldWithConfig | null>(null)
  const charts = api.customDomainLog.listCharts.useQuery({ customDomainId })

  const chartableFields = fields.filter(
    (f) => f.loggable && !f.archivedAt && chartTypesForFieldType(f.fieldType).length > 0
  )

  const remove = api.customDomainLog.deleteChart.useMutation({
    onSuccess: () => { toast.success('Chart removed'); charts.refetch() },
    onError: (err) => toast.error(err.message),
  })

  function handlePickField() {
    const field = chartableFields.find((f) => f.id === fieldId)
    if (!field) return
    setChartField(field)
    setPickingField(false)
    setFieldId('')
  }

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

      {charts.data?.length === 0 && !pickingField && (
        <p className="text-sm text-muted-foreground">No charts yet.</p>
      )}

      {chartableFields.length === 0 ? (
        <p className="text-xs text-muted-foreground">Add a Number, Decimal, Time, Date, Choice, Yes/No, Radio or Checkbox log field first to chart it.</p>
      ) : pickingField ? (
        <div className="flex items-center gap-2 rounded-lg border p-2">
          <Select value={fieldId} onValueChange={(v) => { if (v !== null) setFieldId(v) }}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Pick a field…" /></SelectTrigger>
            <SelectContent>
              {chartableFields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}{f.unit ? ` (${f.unit})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" disabled={!fieldId} onClick={handlePickField}>Continue</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setPickingField(false); setFieldId('') }}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setPickingField(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add chart
        </Button>
      )}

      <ChartPickerDialog
        open={!!chartField}
        onOpenChange={(open) => { if (!open) setChartField(null) }}
        customDomainId={customDomainId}
        field={chartField}
        onSaved={() => charts.refetch()}
      />
    </div>
  )
}
