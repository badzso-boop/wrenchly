'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { AddTripLogForm } from './AddTripLogForm'
import { TripLogList, TripLogListSkeleton } from './TripLogList'
import { Button } from '@/components/ui/button'
import { getTripLogLabels } from '@/server/domains/trip/trip.labels'

export function TripLogPageClient({ itemId }: { itemId: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const item = api.item.getById.useQuery({ id: itemId })
  const trips = api.trip.listByItemId.useQuery({ itemId, limit: 50 })
  const utils = api.useUtils()

  const labels = item.data ? getTripLogLabels(item.data.type) : null

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{labels?.tabLabel ?? 'Trip Log'}</h1>
            {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
          </div>
        </div>
        <Button variant="ghost" size="sm" render={<Link href={`/items/${itemId}/statistics`} />} nativeButton={false}>
          <BarChart3 className="h-4 w-4 mr-1" /> Statistics
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{labels?.tabLabel ?? 'Trips'}</h2>
            <Button
              size="sm"
              variant={showAddForm ? 'secondary' : 'default'}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : `+ ${labels?.formTitle ?? 'Log Trip'}`}
            </Button>
          </div>

          {showAddForm && item.data && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <AddTripLogForm
                itemId={itemId}
                itemType={item.data.type}
                onSuccess={() => {
                  setShowAddForm(false)
                  void trips.refetch()
                  void utils.trip.getStatistics.invalidate()
                  void utils.vehicle.getByItemId.invalidate()
                }}
              />
            </div>
          )}

          {trips.isLoading && <TripLogListSkeleton />}
          {trips.data && item.data && <TripLogList trips={trips.data} itemType={item.data.type} itemId={itemId} />}
        </div>
      </div>
    </div>
  )
}
