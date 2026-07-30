'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VehicleStatisticsClient } from './VehicleStatisticsClient'
import { ReadingStatisticsClient } from './ReadingStatisticsClient'
import { Button } from '@/components/ui/button'

export function StatisticsPageClient({ itemId }: { itemId: string }) {
  const item = api.item.getById.useQuery({ id: itemId })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Statistics</h1>
          {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto">
          {item.data?.type === 'VEHICLE' ? (
            <VehicleStatisticsClient itemId={itemId} />
          ) : (
            <ReadingStatisticsClient itemId={itemId} />
          )}
        </div>
      </div>
    </div>
  )
}
