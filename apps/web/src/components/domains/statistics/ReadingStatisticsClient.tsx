'use client'
import { Fragment } from 'react'
import { api } from '@/lib/trpc/client'
import { BarChart } from './charts/BarChart'
import { LineChart } from './charts/LineChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ItemType } from '@prisma/client'
import type { MetricStats } from '@/server/domains/reading/reading.service'

// Two domains' "frequency" chart is really a count of existing MaintenanceRecords, not a new
// ItemReading metric — see maintenance.repository.ts's countByCategoryPerMonth.
const FREQUENCY_SOURCE: Partial<Record<ItemType, { category: string; label: string }>> = {
  PLANT: { category: 'WATERING', label: 'Watering frequency' },
  AQUARIUM: { category: 'WATER_CHANGE', label: 'Water-change frequency' },
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year!, (month ?? 1) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function mergeMonthly(metrics: { key: string; monthly: { month: string; total: number }[] }[]) {
  const months = new Set<string>()
  for (const m of metrics) for (const p of m.monthly) months.add(p.month)
  return Array.from(months)
    .sort()
    .map((month) => ({
      label: formatMonthLabel(month),
      values: Object.fromEntries(metrics.map((m) => [m.key, m.monthly.find((p) => p.month === month)?.total ?? 0])),
    }))
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

function formatLatest(m: MetricStats): string {
  if (m.latest == null) return '—'
  const option = m.options?.find((o) => o.value === m.latest)
  return option ? option.label : `${m.latest} ${m.unit}`.trim()
}

export function ReadingStatisticsClient({ itemId, itemType }: { itemId: string; itemType: ItemType }) {
  const stats = api.reading.getStatistics.useQuery({ itemId })
  const frequencySource = FREQUENCY_SOURCE[itemType]
  const frequency = api.maintenance.getFrequencyByMonth.useQuery(
    { itemId, category: frequencySource?.category ?? '' },
    { enabled: !!frequencySource }
  )
  const solarProfile = api.profile.getByItemId.useQuery({ itemId }, { enabled: itemType === 'SOLAR' })

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

  if (!stats.data || stats.data.readingCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Log a reading to see statistics here.</p>
        </CardContent>
      </Card>
    )
  }

  const { metrics, readingCount } = stats.data
  const lineMetrics = metrics.filter((m) => m.chartType === 'line')
  const barMetrics = metrics.filter((m) => m.chartType === 'bar-monthly')
  // PROPERTY's electricity/gas/water readings are combined into one multi-series chart rather
  // than three separate ones (see the PR #9 brief) — every other bar-monthly domain gets one
  // chart per metric.
  const combineBarMetrics = itemType === 'PROPERTY' && barMetrics.length > 1

  const solarEstimateKwh = solarProfile.data && typeof solarProfile.data.annualYieldEstimateKwh === 'number'
    ? solarProfile.data.annualYieldEstimateKwh
    : null
  const monthToDateMetric = metrics.find((m) => m.aggregation === 'sum' && m.showMonthToDate)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m) =>
          m.aggregation === 'sum' ? (
            <Fragment key={m.key}>
              <StatTile label={`Total ${m.label.toLowerCase()}`} value={`${m.total} ${m.unit}`.trim()} />
              {m.showMonthToDate && (
                <StatTile label={`${m.label} this month`} value={`${m.monthToDate ?? 0} ${m.unit}`.trim()} />
              )}
            </Fragment>
          ) : (
            <StatTile key={m.key} label={`Latest ${m.label.toLowerCase()}`} value={formatLatest(m)} />
          )
        )}
        {itemType === 'SOLAR' && solarEstimateKwh != null && (
          <StatTile
            label="This month vs. estimate"
            value={`${monthToDateMetric?.monthToDate ?? 0} / ${(solarEstimateKwh / 12).toFixed(0)} kWh`}
          />
        )}
        <StatTile label="Readings logged" value={String(readingCount)} />
      </div>

      {combineBarMetrics ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consumption per month</CardTitle>
            <CardDescription>Electricity, gas, and water usage side by side each month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={mergeMonthly(barMetrics)}
              series={barMetrics.map((m, i) => ({
                key: m.key,
                label: m.label,
                colorClass: (['fill-chart-1', 'fill-chart-2', 'fill-chart-3'] as const)[i % 3]!,
              }))}
            />
          </CardContent>
        </Card>
      ) : (
        barMetrics.map((m) => (
          <Card key={m.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{m.label} per month</CardTitle>
              <CardDescription>{m.showMonthToDate ? 'Sum of every logged reading, bucketed by month.' : `Tracks ${m.label.toLowerCase()} (${m.unit}) by month.`}</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={m.monthly.map((p) => ({ label: formatMonthLabel(p.month), values: { [m.key]: p.total } }))}
                series={[{ key: m.key, label: m.label, colorClass: 'fill-chart-1' }]}
              />
            </CardContent>
          </Card>
        ))
      )}

      {lineMetrics.map((m) => (
        <Card key={m.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{m.label} over time</CardTitle>
            <CardDescription>
              {m.healthyMin != null && m.healthyMax != null
                ? `Shaded band shows the healthy range (${m.healthyMin}–${m.healthyMax} ${m.unit}).`
                : m.options
                  ? `Tracks ${m.label.toLowerCase()} across every logged reading.`
                  : `Tracks ${m.label.toLowerCase()} (${m.unit}) across every logged reading.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              points={m.trend.map((p) => ({ date: p.date, value: p.value }))}
              unitLabel={m.unit}
              healthyMin={m.healthyMin}
              healthyMax={m.healthyMax}
              pointColorClass={m.options ? (v) => m.options!.find((o) => o.value === v)?.colorClass ?? 'fill-chart-1' : undefined}
              valueLabel={m.options ? (v) => m.options!.find((o) => o.value === v)?.label ?? String(v) : undefined}
            />
          </CardContent>
        </Card>
      ))}

      {frequencySource && frequency.data && frequency.data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{frequencySource.label}</CardTitle>
            <CardDescription>How many times you logged this per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={frequency.data.map((p) => ({ label: formatMonthLabel(p.month), values: { count: p.count } }))}
              series={[{ key: 'count', label: 'Times logged', colorClass: 'fill-chart-2' }]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
