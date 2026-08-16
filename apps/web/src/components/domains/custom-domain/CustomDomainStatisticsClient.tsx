'use client'
import { api } from '@/lib/trpc/client'
import { BarChart } from '@/components/domains/statistics/charts/BarChart'
import { LineChart } from '@/components/domains/statistics/charts/LineChart'
import { PieChart } from '@/components/domains/statistics/charts/PieChart'
import { chartColorForIndex } from '@/components/domains/statistics/charts/chart-colors'
import { formatMinutesAsTime } from '@/server/domains/custom-domain/chart-field-compat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year!, (month ?? 1) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatNumericValue(value: number, isTime: boolean, unit: string): string {
  return isTime ? formatMinutesAsTime(value) : `${value} ${unit}`.trim()
}

/** Renders a Custom Domain's user-defined charts (see ChartBuilder/ChartPickerDialog) for one
 * item, computed by `customDomainLog.getStatistics`. Numeric-family charts (LINE/BAR_MONTHLY)
 * mirror ReadingStatisticsClient's layout; categorical-family charts (PIE/BAR_CATEGORY) show a
 * count-per-option distribution instead of a trend/total. */
export function CustomDomainStatisticsClient({ itemId }: { itemId: string }) {
  const stats = api.customDomainLog.getStatistics.useQuery({ itemId })

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!stats.data || stats.data.charts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {stats.data?.entryCount === 0
              ? 'Log an entry to see statistics here.'
              : 'No charts configured yet — add one from the Log tab (field menu → Choose chart).'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const { charts } = stats.data
  const numericCharts = charts.filter((c) => c.family === 'numeric')
  const categoricalCharts = charts.filter((c) => c.family === 'categorical')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {numericCharts.map((c) => (
          <StatTile
            key={c.id}
            label={c.aggregation === 'SUM' ? `Total ${c.name.toLowerCase()}` : c.aggregation === 'AVG' ? `Average ${c.name.toLowerCase()}` : `Latest ${c.name.toLowerCase()}`}
            value={
              c.aggregation === 'SUM' ? formatNumericValue(c.total, c.isTime, c.unit)
                : c.aggregation === 'AVG' ? (c.avg == null ? '—' : formatNumericValue(c.avg, c.isTime, c.unit))
                : c.latest == null ? '—' : formatNumericValue(c.latest, c.isTime, c.unit)
            }
          />
        ))}
        {categoricalCharts.map((c) => (
          <StatTile
            key={c.id}
            label={`Most common ${c.name.toLowerCase()}`}
            value={c.mostCommon ? `${c.mostCommon.label} (${c.mostCommon.count})` : '—'}
          />
        ))}
      </div>

      {numericCharts.map((c) =>
        c.chartType === 'BAR_MONTHLY' ? (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.name} per month</CardTitle>
              <CardDescription>Sum of every logged entry, bucketed by month.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={c.monthly.map((p) => ({ label: formatMonthLabel(p.month), values: { [c.id]: p.total } }))}
                series={[{ key: c.id, label: c.name, colorClass: 'fill-chart-1' }]}
              />
            </CardContent>
          </Card>
        ) : (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription>Tracks {c.name.toLowerCase()}{c.unit ? ` (${c.unit})` : ''} across every logged entry.</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                points={c.trend.map((p) => ({ date: p.date, value: p.value }))}
                unitLabel={c.unit}
                valueFormatter={c.isTime ? (n) => formatMinutesAsTime(n) : undefined}
              />
            </CardContent>
          </Card>
        )
      )}

      {categoricalCharts.map((c) =>
        c.chartType === 'PIE' ? (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription>Share of logged entries per option.</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart data={c.distribution.map((d, i) => ({ label: d.label, value: d.count, colorClass: chartColorForIndex(i) }))} />
            </CardContent>
          </Card>
        ) : (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription>Count of logged entries per option.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={c.distribution.map((d) => ({ label: d.label, values: { v: d.count } }))}
                series={[{ key: 'v', label: 'Count', colorClass: 'fill-chart-1' }]}
                barColorClass={(_, i) => chartColorForIndex(i)}
              />
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
