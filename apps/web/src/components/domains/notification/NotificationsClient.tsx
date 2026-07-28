'use client'
import { api } from '@/lib/trpc/client'
import { CheckCheck, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function NotificationsClient() {
  const notifications = api.notification.list.useQuery({ unreadOnly: false })
  const markRead = api.notification.markRead.useMutation({ onSuccess: () => notifications.refetch() })
  const markAll = api.notification.markAllRead.useMutation({ onSuccess: () => notifications.refetch() })
  const unreadCount = api.notification.countUnread.useQuery()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Notifications</h1>
          {(unreadCount.data ?? 0) > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
              {unreadCount.data}
            </Badge>
          )}
        </div>
        {(unreadCount.data ?? 0) > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        {notifications.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        )}

        {!notifications.isLoading && !notifications.data?.length && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-2">
          {notifications.data?.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'transition-all duration-200',
                !n.readAt && 'border-primary/30 bg-primary/5'
              )}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0', n.readAt ? 'bg-transparent' : 'bg-primary')} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.triggeredAt).toLocaleString()}
                  </p>
                </div>
                {!n.readAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs h-7"
                    onClick={() => markRead.mutate({ id: n.id })}
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
