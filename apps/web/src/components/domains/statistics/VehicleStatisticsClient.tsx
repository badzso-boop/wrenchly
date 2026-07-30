'use client'
import { api } from '@/lib/trpc/client'
import { BarChart } from './charts/BarChart'
import { ConsumptionTrendChart } from './charts/ConsumptionTrendChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

export function VehicleStatisticsClient({ itemId }: { itemId: string }) {
  const stats = api.trip.getStatistics.useQuery({ itemId })

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!stats.data || stats.data.tripCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Log a trip to see statistics here.</p>
        </CardContent>
      </Card>
    )
  }

  const { allTime, last30Days, monthly, consumptionTrend, tripCount } = stats.data

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Total distance" value={`${allTime.distanceKm.toLocaleString()} km`} />
        <StatTile label="Total fuel cost" value={allTime.fuelCost.toLocaleString()} />
        <StatTile label="Tolls, vignettes & parking" value={allTime.expenseCost.toLocaleString()} />
        <StatTile
          label="Avg. consumption (all time)"
          value={allTime.avgConsumption > 0 ? `${allTime.avgConsumption.toFixed(1)} L/100km` : '—'}
        />
        <StatTile
          label="Avg. consumption (last 30 days)"
          value={last30Days.avgConsumption > 0 ? `${last30Days.avgConsumption.toFixed(1)} L/100km` : '—'}
        />
        <StatTile label="Trips logged" value={String(tripCount)} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Distance per month</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { distanceKm: m.distanceKm } }))}
            series={[{ key: 'distanceKm', label: 'Distance (km)', colorClass: 'fill-chart-1' }]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Cost per month</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { fuelCost: m.fuelCost, expenseCost: m.expenseCost } }))}
            series={[
              { key: 'fuelCost', label: 'Fuel', colorClass: 'fill-chart-1' },
              { key: 'expenseCost', label: 'Tolls/Parking', colorClass: 'fill-chart-2' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Consumption per trip (L/100km)</CardTitle></CardHeader>
        <CardContent>
          <ConsumptionTrendChart points={consumptionTrend} />
        </CardContent>
      </Card>
    </div>
  )
}
