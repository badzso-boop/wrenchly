'use client'
import { api } from '@/lib/trpc/client'
import { BarChart } from '@/components/domains/statistics/charts/BarChart'
import { LineChart } from '@/components/domains/statistics/charts/LineChart'
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

/** Renders a Custom Domain's user-defined charts (see ChartBuilder) for one item, computed by
 * `customDomainLog.getStatistics`. Deliberately mirrors ReadingStatisticsClient's shape/layout --
 * a chart here is just the user-authored equivalent of that file's static MetricDef. */
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
              : 'No charts configured yet — add one from Custom Domains → Statistics.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const { charts } = stats.data

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {charts.map((c) => (
          <StatTile
            key={c.id}
            label={c.aggregation === 'SUM' ? `Total ${c.name.toLowerCase()}` : `Latest ${c.name.toLowerCase()}`}
            value={
              c.aggregation === 'SUM'
                ? `${c.total} ${c.unit}`.trim()
                : c.latest == null ? '—' : `${c.latest} ${c.unit}`.trim()
            }
          />
        ))}
      </div>

      {charts.map((c) =>
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
              <LineChart points={c.trend.map((p) => ({ date: p.date, value: p.value }))} unitLabel={c.unit} />
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
