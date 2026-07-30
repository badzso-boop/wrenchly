'use client'
import { api } from '@/lib/trpc/client'
import { LineChart } from './charts/LineChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ReadingStatisticsClient({ itemId }: { itemId: string }) {
  const stats = api.reading.getStatistics.useQuery({ itemId })

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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <Card key={m.key}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Latest {m.label.toLowerCase()}</p>
              <p className="text-2xl font-semibold">{m.latest != null ? `${m.latest} ${m.unit}` : '—'}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Readings logged</p>
            <p className="text-2xl font-semibold">{readingCount}</p>
          </CardContent>
        </Card>
      </div>

      {metrics.map((m) => (
        <Card key={m.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{m.label} over time</CardTitle>
            <CardDescription>
              {m.healthyMin != null && m.healthyMax != null
                ? `Shaded band shows the healthy range (${m.healthyMin}–${m.healthyMax} ${m.unit}).`
                : `Tracks ${m.label.toLowerCase()} (${m.unit}) across every logged reading.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              points={m.trend.map((p) => ({ date: p.date, value: p.value }))}
              unitLabel={m.unit}
              healthyMin={m.healthyMin}
              healthyMax={m.healthyMax}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
