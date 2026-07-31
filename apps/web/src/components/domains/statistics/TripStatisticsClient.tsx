'use client'
import { api } from '@/lib/trpc/client'
import { BarChart } from './charts/BarChart'
import { LineChart } from './charts/LineChart'
import { Meter } from './Meter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ItemType } from '@prisma/client'

// A bike chain is typically replaced every ~2500km — not user-configurable yet (see PR brief),
// called out as a named constant rather than a magic number so it's easy to find/promote to a
// BicycleProfile field later if that's ever wanted.
const CHAIN_REPLACEMENT_INTERVAL_KM = 2500

// From PR #7: show a real currency label next to cost totals instead of a bare number, since
// fuel/expense costs are entered per-fuel-stop/per-expense with their own currency.
function currencyLabel(currencies: string[]): string {
  if (currencies.length === 0) return ''
  if (currencies.length > 1) return 'mixed currencies'
  return currencies[0] === 'HUF' ? 'Ft' : (currencies[0] ?? '')
}

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

export function TripStatisticsClient({ itemId, itemType }: { itemId: string; itemType: ItemType }) {
  const stats = api.trip.getStatistics.useQuery({ itemId })
  const profile = api.profile.getByItemId.useQuery({ itemId }, { enabled: itemType === 'BICYCLE' })

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
          <p className="text-muted-foreground text-sm">Log an entry to see statistics here.</p>
        </CardContent>
      </Card>
    )
  }

  const { allTime, last30Days, monthly, consumptionTrend, consumptionUnit, speedTrend, batteryTrend, currencies, tripCount } = stats.data
  const currency = currencyLabel(currencies)
  const mixedCurrencies = currencies.length > 1

  if (itemType === 'BICYCLE') {
    const chainKm = typeof profile.data?.chainKm === 'number' ? profile.data.chainKm : null
    const avgSpeed = speedTrend.length > 0 ? speedTrend.reduce((s, p) => s + p.speedKmh, 0) / speedTrend.length : null

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile label="Total distance" value={`${allTime.distanceKm.toLocaleString()} km`} hint="Since your first logged ride" />
          <StatTile label="Total elevation gain" value={`${allTime.elevationGainM.toLocaleString()} m`} hint="Sum of every logged climb" />
          <StatTile label="Avg. speed" value={avgSpeed != null ? `${avgSpeed.toFixed(1)} km/h` : '—'} hint="Across rides with a logged duration" />
          <StatTile label="Rides logged" value={String(tripCount)} hint="Number of ride entries" />
        </div>

        {chainKm != null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Chain wear</CardTitle>
              <CardDescription>Distance since the chain was last replaced/reset — reset it from the Profile tab after servicing.</CardDescription>
            </CardHeader>
            <CardContent>
              <Meter label="Chain distance" value={chainKm} max={CHAIN_REPLACEMENT_INTERVAL_KM} unit=" km" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distance per month</CardTitle>
            <CardDescription>How many km you rode each month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthly.map((m) => ({ label: m.month, values: { distanceKm: m.distanceKm } }))}
              series={[{ key: 'distanceKm', label: 'Distance (km)', colorClass: 'fill-chart-1' }]}
            />
          </CardContent>
        </Card>

        {speedTrend.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average speed per ride</CardTitle>
              <CardDescription>Distance ÷ duration for each ride that logged a time.</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart points={speedTrend.map((p) => ({ date: p.date, value: p.speedKmh }))} unitLabel="km/h" />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (itemType === 'DRONE') {
    const avgBattery = batteryTrend.length > 0 ? batteryTrend.reduce((s, p) => s + p.batteryPercentUsed, 0) / batteryTrend.length : null

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile label="Total flights" value={String(tripCount)} hint="Number of logged flights" />
          <StatTile
            label="Total flight hours"
            value={`${monthly.reduce((s, m) => s + m.durationMin, 0) / 60 > 0 ? (monthly.reduce((s, m) => s + m.durationMin, 0) / 60).toFixed(1) : 0} h`}
            hint="Sum of every logged flight duration"
          />
          <StatTile label="Avg. battery used" value={avgBattery != null ? `${avgBattery.toFixed(0)}%` : '—'} hint="Across flights with a logged battery reading" />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Flights per month</CardTitle>
            <CardDescription>How many flights you logged each month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthly.map((m) => ({ label: m.month, values: { tripCount: m.tripCount } }))}
              series={[{ key: 'tripCount', label: 'Flights', colorClass: 'fill-chart-1' }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Flight hours per month</CardTitle>
            <CardDescription>Total time in the air each month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthly.map((m) => ({ label: m.month, values: { hours: Math.round((m.durationMin / 60) * 10) / 10 } }))}
              series={[{ key: 'hours', label: 'Flight hours', colorClass: 'fill-chart-2' }]}
            />
          </CardContent>
        </Card>

        {batteryTrend.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Battery used per flight</CardTitle>
              <CardDescription>How much battery each flight consumed.</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart points={batteryTrend.map((p) => ({ date: p.date, value: p.batteryPercentUsed }))} unitLabel="%" />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // VEHICLE and BOAT share the same fuel-based shape — only the unit/labels differ (L/100km vs.
  // L/hour, "distance" vs. "engine hours").
  const isBoat = itemType === 'BOAT'
  const distanceLabel = isBoat ? 'engine hours' : 'km'
  const distanceTileLabel = isBoat ? 'Total engine hours' : 'Total distance'
  const entryLabel = isBoat ? 'Voyages logged' : 'Trips logged'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label={distanceTileLabel} value={`${allTime.distanceKm.toLocaleString()} ${distanceLabel}`} hint="Since your first logged entry" />
        <StatTile
          label="Total fuel cost"
          value={`${allTime.fuelCost.toLocaleString()} ${currency}`}
          hint={mixedCurrencies ? 'Amounts added as-is, not converted' : 'All fuel purchases combined'}
        />
        <StatTile
          label="Tolls, vignettes & parking"
          value={`${allTime.expenseCost.toLocaleString()} ${currency}`}
          hint={mixedCurrencies ? 'Amounts added as-is, not converted' : 'All logged road/water-usage costs'}
        />
        <StatTile
          label="Avg. consumption (all time)"
          value={allTime.avgConsumption > 0 ? `${allTime.avgConsumption.toFixed(1)} ${consumptionUnit}` : '—'}
          hint="Total fuel ÷ total distance"
        />
        <StatTile
          label="Avg. consumption (last 30 days)"
          value={last30Days.avgConsumption > 0 ? `${last30Days.avgConsumption.toFixed(1)} ${consumptionUnit}` : '—'}
          hint="Recent use only, not all-time"
        />
        <StatTile label={entryLabel} value={String(tripCount)} hint="Number of logged entries" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isBoat ? 'Engine hours per month' : 'Distance per month'}</CardTitle>
          <CardDescription>{isBoat ? 'How many engine hours you logged each month.' : 'How many km you drove each month — spot busy months vs. quiet ones.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { distanceKm: m.distanceKm } }))}
            series={[{ key: 'distanceKm', label: isBoat ? 'Engine hours' : 'Distance (km)', colorClass: 'fill-chart-1' }]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cost per month</CardTitle>
          <CardDescription>Fuel cost vs. tolls, vignettes &amp; parking side by side each month — the legend below the chart shows which color is which.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { fuelCost: m.fuelCost, expenseCost: m.expenseCost } }))}
            series={[
              { key: 'fuelCost', label: 'Fuel', colorClass: 'fill-chart-1' },
              { key: 'expenseCost', label: 'Tolls/Parking', colorClass: 'fill-chart-2' },
            ]}
            valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Consumption per entry ({consumptionUnit})</CardTitle>
          <CardDescription>Your fuel efficiency over time — a rising trend can mean it's time for a maintenance check, or just more demanding use.</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            points={consumptionTrend.map((c) => ({ date: c.date, value: c.consumption }))}
            unitLabel={consumptionUnit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
