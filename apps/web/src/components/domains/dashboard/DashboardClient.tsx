'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const TYPE_ICONS: Record<string, string> = {
  VEHICLE: '🚗', PROPERTY: '🏠', PLANT: '🌱', MACHINE: '⚙️', TOOL: '🔧',
  DEVICE: '📱', PET: '🐾', AQUARIUM: '🐠', POOL: '🏊', BOAT: '⛵',
  DRONE: '🚁', INSTRUMENT: '🎸', BICYCLE: '🚲', SOLAR: '☀️', CUSTOM: '📦',
}

export function DashboardClient() {
  const items = api.item.list.useQuery({})

  const activeItems = items.data?.filter((i) => i.status === 'ACTIVE') ?? []
  const archivedItems = items.data?.filter((i) => i.status !== 'ACTIVE') ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{activeItems.length} active item{activeItems.length !== 1 ? 's' : ''}</p>
        </div>
        <Button render={<Link href="/items/new" />} nativeButton={false} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        {items.isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {!items.isLoading && activeItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-lg font-semibold mb-1">No items yet</h2>
            <p className="text-muted-foreground text-sm mb-6">Add your first item to start tracking maintenance</p>
            <Button render={<Link href="/items/new" />} nativeButton={false}>
              <Plus className="h-4 w-4 mr-1" /> Add Your First Item
            </Button>
          </div>
        )}

        {activeItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeItems.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="group">
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{TYPE_ICONS[item.type] ?? '📦'}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.type.toLowerCase()}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-1">
                      {item.name}
                    </h3>
                    {(item.brand ?? item.model) && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {[item.brand, item.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {item.purchaseDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Since {new Date(item.purchaseDate).getFullYear()}
                      </p>
                    )}
                    <div className="flex items-center justify-end mt-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {archivedItems.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Archived & other ({archivedItems.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {archivedItems.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <Card className="opacity-50 hover:opacity-75 transition-opacity duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{TYPE_ICONS[item.type] ?? '📦'}</span>
                        <span className="font-medium text-sm line-clamp-1">{item.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs capitalize shrink-0">
                          {item.status.toLowerCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
