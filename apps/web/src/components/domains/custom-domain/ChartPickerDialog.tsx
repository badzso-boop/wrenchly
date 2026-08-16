'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LineChart as LineChartIcon, BarChart3, PieChart as PieChartIcon, BarChart2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LineChart } from '@/components/domains/statistics/charts/LineChart'
import { BarChart } from '@/components/domains/statistics/charts/BarChart'
import { PieChart } from '@/components/domains/statistics/charts/PieChart'
import { chartColorForIndex } from '@/components/domains/statistics/charts/chart-colors'
import { chartTypesForFieldType, aggregationsForFieldType, formatMinutesAsTime } from '@/server/domains/custom-domain/chart-field-compat'
import type { ChartType, ChartAggregation, FieldType } from '@prisma/client'

interface FieldForChart {
  id: string
  name: string
  unit: string | null
  fieldType: FieldType
  options: string[]
}

const CHART_TYPE_META: Record<ChartType, { label: string; description: string; icon: typeof LineChartIcon }> = {
  LINE: { label: 'Line', description: 'Every logged entry, plotted over time', icon: LineChartIcon },
  BAR_MONTHLY: { label: 'Bar (monthly)', description: 'Summed per calendar month', icon: BarChart3 },
  PIE: { label: 'Pie', description: 'Share of entries per option', icon: PieChartIcon },
  BAR_CATEGORY: { label: 'Bar (by category)', description: 'Count of entries per option', icon: BarChart2 },
}

const AGGREGATION_LABELS: Record<ChartAggregation, string> = {
  LATEST: 'Latest value',
  SUM: 'Running total',
  AVG: 'Average',
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year!, (month ?? 1) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

// Deterministic (seeded by field id) illustrative data for the preview when the domain has no
// real sample entries yet -- lets the "Choose chart" dialog still show what each chart type looks
// like instead of an empty state, without the preview jittering between re-renders.
function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return () => {
    h = (h * 1103515245 + 12345) | 0
    return ((h >>> 0) % 1000) / 1000
  }
}

function fallbackNumericPreview(field: FieldForChart) {
  const rand = seededRandom(field.id)
  const now = new Date()
  const trend = Array.from({ length: 8 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (7 - i) * 4)
    const value =
      field.fieldType === 'TIME' ? Math.floor(6 * 60 + rand() * 10 * 60)
        : field.fieldType === 'DATE' ? 1
        : Math.round(10 + rand() * 40)
    return { date, value }
  })
  const monthlyMap = new Map<string, number>()
  for (const p of trend) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.value)
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))
  return { trend, monthly }
}

function fallbackCategoricalPreview(field: FieldForChart) {
  const rand = seededRandom(field.id)
  const labels = field.fieldType === 'BOOLEAN' ? ['Yes', 'No'] : field.options.length > 0 ? field.options : ['Option A', 'Option B']
  const distribution = labels
    .map((label) => ({ label, count: 1 + Math.floor(rand() * 8) }))
    .sort((a, b) => b.count - a.count)
  return { distribution }
}

function ChartTypePreview({
  chartType,
  field,
  numeric,
  categorical,
}: {
  chartType: ChartType
  field: FieldForChart
  numeric?: { trend: { date: Date; value: number }[]; monthly: { month: string; total: number }[] }
  categorical?: { distribution: { label: string; count: number }[] }
}) {
  if (chartType === 'LINE' && numeric) {
    return (
      <LineChart
        points={numeric.trend}
        unitLabel={field.unit ?? ''}
        valueFormatter={field.fieldType === 'TIME' ? (n) => formatMinutesAsTime(n) : undefined}
      />
    )
  }
  if (chartType === 'BAR_MONTHLY' && numeric) {
    return (
      <BarChart
        data={numeric.monthly.map((p) => ({ label: monthLabel(p.month), values: { v: p.total } }))}
        series={[{ key: 'v', label: field.name, colorClass: 'fill-chart-1' }]}
      />
    )
  }
  if (chartType === 'PIE' && categorical) {
    return (
      <PieChart
        data={categorical.distribution.map((d, i) => ({ label: d.label, value: d.count, colorClass: chartColorForIndex(i) }))}
      />
    )
  }
  if (chartType === 'BAR_CATEGORY' && categorical) {
    return (
      <BarChart
        data={categorical.distribution.map((d) => ({ label: d.label, values: { v: d.count } }))}
        series={[{ key: 'v', label: 'Count', colorClass: 'fill-chart-1' }]}
        barColorClass={(_, i) => chartColorForIndex(i)}
      />
    )
  }
  return null
}

export function ChartPickerDialog({
  open,
  onOpenChange,
  customDomainId,
  field,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customDomainId: string
  field: FieldForChart | null
  onSaved: () => void
}) {
  const chartTypes = field ? chartTypesForFieldType(field.fieldType) : []
  const aggregations = field ? aggregationsForFieldType(field.fieldType) : []

  const [selectedType, setSelectedType] = useState<ChartType | null>(null)
  const [aggregation, setAggregation] = useState<ChartAggregation | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open || !field) return
    setSelectedType(chartTypesForFieldType(field.fieldType)[0] ?? null)
    setAggregation(aggregationsForFieldType(field.fieldType)[0] ?? null)
    setName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, field?.id])

  const preview = api.customDomainLog.previewChartData.useQuery(
    { customDomainId, fieldId: field?.id ?? '' },
    { enabled: open && !!field }
  )

  const create = api.customDomainLog.createChart.useMutation({
    onSuccess: () => {
      toast.success('Chart added')
      onSaved()
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message),
  })

  if (!field) return null

  const isCategorical = chartTypes.includes('PIE')
  const hasRealData = preview.data?.hasData ?? false
  const numeric = hasRealData ? preview.data?.numeric : fallbackNumericPreview(field)
  const categorical = hasRealData ? preview.data?.categorical : fallbackCategoricalPreview(field)

  function handleSave() {
    if (!selectedType || !field) return
    create.mutate({
      customDomainId,
      fieldId: field.id,
      name: name || `${field.name}${selectedType === 'BAR_MONTHLY' ? ' per month' : ''}`,
      chartType: selectedType,
      aggregation: aggregation ?? 'LATEST',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a chart for &quot;{field.name}&quot;</DialogTitle>
        </DialogHeader>

        {!preview.isLoading && !hasRealData && (
          <p className="text-xs text-muted-foreground rounded-md bg-muted px-3 py-2">
            No logged entries yet for this field — showing example data below. Log a real entry to see your own chart here.
          </p>
        )}

        <div className="space-y-3">
          {chartTypes.map((type) => {
            const meta = CHART_TYPE_META[type]
            const isSelected = selectedType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${isSelected ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent/40'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <meta.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">— {meta.description}</span>
                </div>
                {preview.isLoading ? (
                  <div className="h-40 rounded-md bg-muted animate-pulse" />
                ) : (
                  <ChartTypePreview chartType={type} field={field} numeric={numeric} categorical={categorical} />
                )}
              </button>
            )
          })}
        </div>

        {!isCategorical && aggregations.length > 0 && (
          <div className="space-y-1.5">
            <Label>Stat tile shows</Label>
            <Select value={aggregation ?? ''} onValueChange={(v) => { if (v !== null) setAggregation(v as ChartAggregation) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {aggregations.map((a) => <SelectItem key={a} value={a}>{AGGREGATION_LABELS[a]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="chart-name">Chart name (optional)</Label>
          <Input id="chart-name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder={field.name} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!selectedType || create.isPending} onClick={handleSave}>
            {create.isPending ? 'Saving…' : 'Add chart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
