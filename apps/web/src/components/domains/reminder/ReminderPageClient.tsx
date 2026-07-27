'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { ReminderList } from './ReminderList'
import { AddReminderForm } from './AddReminderForm'
import { Button } from '@/components/ui/button'

export function ReminderPageClient({ itemId }: { itemId: string }) {
  const item = api.item.getById.useQuery({ id: itemId })
  const [showForm, setShowForm] = useState(false)
  const reminders = api.reminder.getByItemId.useQuery({ itemId })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Reminders</h1>
            {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Reminder</>}
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        {showForm && (
          <div className="max-w-lg mx-auto mb-6 animate-in slide-in-from-top-2 duration-200">
            <AddReminderForm
              itemId={itemId}
              onSuccess={() => { setShowForm(false); void reminders.refetch() }}
            />
          </div>
        )}
        <div className="max-w-lg mx-auto">
          <ReminderList itemId={itemId} />
        </div>
      </div>
    </div>
  )
}
