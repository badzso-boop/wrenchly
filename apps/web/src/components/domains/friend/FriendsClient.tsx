'use client'
import { useEffect, useState } from 'react'
import { UserPlus, Check, X, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

type PublicUser = { id: string; name: string; username: string | null; avatarUrl: string | null }

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

function UserRow({ user, right }: { user: PublicUser; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar size="sm">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        {user.username && <p className="text-xs text-muted-foreground truncate">@{user.username}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-1">{right}</div>
    </div>
  )
}

export function FriendsClient() {
  const me = api.user.getMe.useQuery()
  const myUserId = me.data?.id

  const utils = api.useUtils()
  const friends = api.friend.listFriends.useQuery()
  const received = api.friend.listPendingReceived.useQuery()
  const sent = api.friend.listPendingSent.useQuery()

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])
  const search = api.friend.search.useQuery({ query: debounced }, { enabled: debounced.length > 0 })

  function invalidateAll() {
    utils.friend.listFriends.invalidate()
    utils.friend.listPendingReceived.invalidate()
    utils.friend.listPendingSent.invalidate()
    utils.friend.search.invalidate()
  }

  const sendRequest = api.friend.sendRequest.useMutation({
    onSuccess: () => { toast.success('Friend request sent'); invalidateAll() },
    onError: (e) => toast.error(e.message),
  })
  const accept = api.friend.accept.useMutation({
    onSuccess: () => { toast.success('Friend request accepted'); invalidateAll() },
    onError: (e) => toast.error(e.message),
  })
  const decline = api.friend.decline.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  })
  const cancel = api.friend.cancel.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  })
  const remove = api.friend.remove.useMutation({
    onSuccess: () => { toast.success('Friend removed'); invalidateAll() },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <h1 className="text-xl font-semibold">Friends</h1>
        <p className="text-sm text-muted-foreground">
          {friends.data?.length ?? 0} friend{(friends.data?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" /> Find friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={query}
                onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                placeholder="Search by username"
              />
              {search.isFetching && debounced.length > 0 && (
                <Skeleton className="h-12 rounded-lg" />
              )}
              {!search.isFetching && debounced.length > 0 && (search.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
              )}
              <div className="divide-y">
                {(search.data ?? []).map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    right={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendRequest.mutate({ addresseeId: u.id })}
                        disabled={sendRequest.isPending}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {(received.data?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Pending — received ({received.data!.length})</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {received.data!.map((r) => (
                  <UserRow
                    key={r.id}
                    user={r.requester}
                    right={
                      <>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => accept.mutate({ requestId: r.id })}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => decline.mutate({ requestId: r.id })}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    }
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {(sent.data?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Pending — sent ({sent.data!.length})</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {sent.data!.map((r) => (
                  <UserRow
                    key={r.id}
                    user={r.addressee}
                    right={
                      <Button size="sm" variant="ghost" onClick={() => cancel.mutate({ requestId: r.id })}>
                        Cancel
                      </Button>
                    }
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Friends</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {friends.isLoading && (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              )}
              {!friends.isLoading && (friends.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No friends yet — search for a username above to send a request.
                </p>
              )}
              {(friends.data ?? []).map((r) => {
                const other = r.requesterId === myUserId ? r.addressee : r.requester
                return (
                  <UserRow
                    key={r.id}
                    user={other}
                    right={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => { if (window.confirm(`Remove ${other.name} as a friend?`)) remove.mutate({ friendUserId: other.id }) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
