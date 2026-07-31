'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { AddCustomLogEntryForm } from './AddCustomLogEntryForm'
import { CustomLogEntryList, CustomLogEntryListSkeleton } from './CustomLogEntryList'
import { Button } from '@/components/ui/button'

export function CustomLogPageClient({ itemId }: { itemId: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const item = api.item.getById.useQuery({ id: itemId })
  const log = api.customDomainLog.listEntries.useQuery({ itemId })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Log</h1>
          {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Entries</h2>
            <Button
              size="sm"
              variant={showAddForm ? 'secondary' : 'default'}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Log entry'}
            </Button>
          </div>

          {showAddForm && log.data && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <AddCustomLogEntryForm
                itemId={itemId}
                fields={log.data.fields}
                onSuccess={() => {
                  setShowAddForm(false)
                  void log.refetch()
                }}
              />
            </div>
          )}

          {log.isLoading && <CustomLogEntryListSkeleton />}
          {log.data && <CustomLogEntryList fields={log.data.fields} entries={log.data.entries} />}
        </div>
      </div>
    </div>
  )
}
