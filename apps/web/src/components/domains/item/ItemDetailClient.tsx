'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Pencil, Bell, Car, FileText } from 'lucide-react'
import { getProfileFields } from '@/server/domains/profile/profile.fields'
import { MaintenanceList } from '@/components/domains/maintenance/MaintenanceList'
import { AddMaintenanceForm } from '@/components/domains/maintenance/AddMaintenanceForm'
import { ShareButton } from '@/components/domains/share/ShareButton'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function ItemDetailClient({ itemId }: { itemId: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const item = api.item.getById.useQuery({ id: itemId })
  const records = api.maintenance.listByItemId.useQuery({ itemId, limit: 20 })
  const pathname = usePathname()

  if (item.isLoading) return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="px-6 py-6 space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )

  if (!item.data) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Item not found.</p>
    </div>
  )

  const isVehicle = item.data.type === 'VEHICLE'
  const hasGenericProfile = item.data.type === 'CUSTOM' || getProfileFields(item.data.type) !== null

  const tabs = [
    { href: `/items/${itemId}`, label: 'Maintenance' },
    { href: `/items/${itemId}/reminders`, label: 'Reminders', icon: Bell },
    ...(isVehicle ? [{ href: `/items/${itemId}/vehicle`, label: 'Vehicle', icon: Car }] : []),
    ...(hasGenericProfile ? [{ href: `/items/${itemId}/profile`, label: 'Profile', icon: FileText }] : []),
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" render={<Link href="/dashboard" />} nativeButton={false}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold truncate">{item.data.name}</h1>
                <Badge variant="secondary" className="capitalize text-xs shrink-0">
                  {item.data.type.toLowerCase()}
                </Badge>
              </div>
              {(item.data.brand ?? item.data.model) && (
                <p className="text-sm text-muted-foreground truncate">
                  {[item.data.brand, item.data.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ShareButton itemId={itemId} />
            <Button variant="ghost" size="sm" render={<Link href={`/items/${itemId}/edit`} />} nativeButton={false}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-1 mt-3 -mb-4 -mx-0">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all duration-150',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 space-y-5 animate-in fade-in-0 duration-300">
        {/* Info card */}
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {item.data.purchaseDate && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Purchase Date</p>
                  <p className="font-medium">{new Date(item.data.purchaseDate).toLocaleDateString()}</p>
                </div>
              )}
              {item.data.purchasePrice && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Purchase Price</p>
                  <p className="font-medium">{Number(item.data.purchasePrice).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                <Badge variant={item.data.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs capitalize">
                  {item.data.status.toLowerCase()}
                </Badge>
              </div>
            </div>
            {item.data.description && (
              <>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">{item.data.description}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Maintenance section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Maintenance Log</h2>
            <Button
              size="sm"
              variant={showAddForm ? 'secondary' : 'default'}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Log Maintenance'}
            </Button>
          </div>

          {showAddForm && (
            <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
              <AddMaintenanceForm
                itemId={itemId}
                itemType={item.data.type}
                onSuccess={() => { setShowAddForm(false); void records.refetch() }}
              />
            </div>
          )}

          {records.isLoading && <Skeleton className="h-24 rounded-xl" />}
          {records.data && <MaintenanceList records={records.data} itemType={item.data.type} />}
        </div>
      </div>
    </div>
  )
}
