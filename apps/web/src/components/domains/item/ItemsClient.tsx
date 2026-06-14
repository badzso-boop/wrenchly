'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'Sold', value: 'SOLD' },
] as const

const TYPE_ICONS: Record<string, string> = {
  VEHICLE: '🚗', PROPERTY: '🏠', PLANT: '🌱', MACHINE: '⚙️', TOOL: '🔧',
  DEVICE: '📱', PET: '🐾', AQUARIUM: '🐠', POOL: '🏊', BOAT: '⛵',
  DRONE: '🚁', INSTRUMENT: '🎸', BICYCLE: '🚲', SOLAR: '☀️', CUSTOM: '📦',
}

export function ItemsClient() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const items = api.item.list.useQuery({ status: filter as never })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Items</h1>
        <Button render={<Link href="/items/new" />} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="px-6 py-3 flex gap-2 border-b overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value as string | undefined)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-all duration-150 shrink-0',
              filter === f.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        {items.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        )}

        {!items.isLoading && !items.data?.length && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No items found.</p>
            <Button render={<Link href="/items/new" />} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {items.data?.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="group block">
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-xl shrink-0">{TYPE_ICONS[item.type] ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium group-hover:text-primary transition-colors truncate">{item.name}</p>
                    {(item.brand ?? item.model) && (
                      <p className="text-sm text-muted-foreground truncate">
                        {[item.brand, item.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize shrink-0 text-xs">
                    {item.status.toLowerCase()}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
