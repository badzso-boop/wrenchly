'use client'
import { api } from '@/lib/trpc/client'
import { BarChart } from './charts/BarChart'
import { LineChart } from './charts/LineChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  )
}

export function PrintJobStatisticsClient({ itemId }: { itemId: string }) {
  const stats = api.printJob.getStatistics.useQuery({ itemId })
  const profile = api.profile.getByItemId.useQuery({ itemId })

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!stats.data || stats.data.totalPrints === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Log a print job to see statistics here.</p>
        </CardContent>
      </Card>
    )
  }

  const { totalPrints, totalFilamentGrams, totalHours, successRate, monthly } = stats.data

  const profileFilament = typeof profile.data?.filamentConsumedG === 'number' ? profile.data.filamentConsumedG : null
  const profileHours = typeof profile.data?.totalPrintHours === 'number' ? profile.data.totalPrintHours : null
  const profilePrints = typeof profile.data?.totalPrints === 'number' ? profile.data.totalPrints : null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile
          label="Total prints"
          value={String(totalPrints)}
          hint={profilePrints != null ? `Profile counter: ${profilePrints}` : 'Since your first logged job'}
        />
        <StatTile
          label="Total print hours"
          value={`${totalHours.toFixed(1)} h`}
          hint={profileHours != null ? `Profile counter: ${profileHours.toFixed(1)} h` : 'Sum of every logged duration'}
        />
        <StatTile
          label="Total filament consumed"
          value={`${totalFilamentGrams.toLocaleString()} g`}
          hint={profileFilament != null ? `Profile counter: ${profileFilament.toLocaleString()} g` : 'Sum of every logged job'}
        />
        <StatTile label="Success rate" value={`${successRate.toFixed(0)}%`} hint="Across all logged jobs" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filament consumed per month</CardTitle>
          <CardDescription>How many grams of filament you used each month.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { filamentGrams: m.filamentGrams } }))}
            series={[{ key: 'filamentGrams', label: 'Filament (g)', colorClass: 'fill-chart-1' }]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Print hours per month</CardTitle>
          <CardDescription>Total printer time each month.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { printHours: Math.round(m.printHours * 10) / 10 } }))}
            series={[{ key: 'printHours', label: 'Print hours', colorClass: 'fill-chart-2' }]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Success rate per month</CardTitle>
          <CardDescription>Share of jobs marked successful each month — a dip can flag a printer that needs attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            points={monthly.map((m) => ({ date: `${m.month}-01`, value: m.successRate }))}
            unitLabel="%"
            healthyMin={80}
            healthyMax={100}
            valueFormatter={(n) => n.toFixed(0)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
