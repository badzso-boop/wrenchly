'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const TRIGGER_LABELS: Record<string, string> = {
  DATE: 'Date', INTERVAL_DAYS: 'Interval', ODOMETER: 'Odometer', CRON: 'Schedule', WEATHER: 'Weather',
}
const TRIGGER_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  DATE: 'default', INTERVAL_DAYS: 'secondary', ODOMETER: 'outline', CRON: 'secondary', WEATHER: 'default',
}

export function ReminderList({ itemId }: { itemId: string }) {
  const reminders = api.reminder.getByItemId.useQuery({ itemId })
  const deleteReminder = api.reminder.delete.useMutation({ onSuccess: () => reminders.refetch() })
  const toggleActive = api.reminder.update.useMutation({ onSuccess: () => reminders.refetch() })

  if (reminders.isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  )

  if (!reminders.data?.length) return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground text-sm">No reminders yet.</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-2">
      {reminders.data.map((r) => (
        <Card key={r.id} className={`transition-all duration-200 ${!r.isActive ? 'opacity-60' : ''}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={TRIGGER_VARIANTS[r.triggerType] ?? 'secondary'} className="text-xs">
                  {TRIGGER_LABELS[r.triggerType] ?? r.triggerType}
                </Badge>
                {!r.isActive && <span className="text-xs text-muted-foreground">Paused</span>}
              </div>
              <p className="font-medium text-sm truncate">{r.title}</p>
              {r.nextTriggerAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Next: {new Date(r.nextTriggerAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleActive.mutate({ id: r.id, isActive: !r.isActive })}
                title={r.isActive ? 'Pause' : 'Activate'}
              >
                {r.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => { if (window.confirm('Delete this reminder?')) deleteReminder.mutate({ id: r.id }) }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
