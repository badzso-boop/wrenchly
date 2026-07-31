'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { AddCookingLogEntryForm } from './AddCookingLogEntryForm'
import { CookingLogEntryList, CookingLogEntryListSkeleton } from './CookingLogEntryList'
import { Button } from '@/components/ui/button'

export function CookingLogPageClient({ itemId }: { itemId: string }) {
  const searchParams = useSearchParams()
  const prefillName = searchParams.get('prefillName') ?? undefined
  const [showAddForm, setShowAddForm] = useState(!!prefillName)

  const item = api.item.getById.useQuery({ id: itemId })
  const entries = api.cooking.listByItemId.useQuery({ itemId })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Cooking Log</h1>
            {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
          </div>
        </div>
        <Button variant="ghost" size="sm" render={<Link href={`/items/${itemId}/statistics`} />} nativeButton={false}>
          <BarChart3 className="h-4 w-4 mr-1" /> Statistics
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-semibold">Meals</h2>
            <Button size="sm" variant={showAddForm ? 'secondary' : 'default'} onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Cancel' : '+ Log Meal'}
            </Button>
          </div>

          {showAddForm && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <AddCookingLogEntryForm
                itemId={itemId}
                initialName={prefillName}
                onSuccess={() => { setShowAddForm(false); void entries.refetch() }}
              />
            </div>
          )}

          {entries.isLoading && <CookingLogEntryListSkeleton />}
          {entries.data && <CookingLogEntryList entries={entries.data} />}
        </div>
      </div>
    </div>
  )
}
