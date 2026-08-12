'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Check, X, Trash2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
}

export function CollaboratorsPageClient({ itemId }: { itemId: string }) {
  const session = authClient.useSession()
  const myUserId = session.data?.user?.id

  const item = api.item.getById.useQuery({ id: itemId })
  const collaborators = api.itemCollaborator.listForItem.useQuery({ itemId })
  const friends = api.friend.listFriends.useQuery()
  const utils = api.useUtils()

  const [selectedFriendId, setSelectedFriendId] = useState<string>('')

  function refresh() {
    utils.itemCollaborator.listForItem.invalidate({ itemId })
  }

  const invite = api.itemCollaborator.invite.useMutation({
    onSuccess: () => { toast.success('Invite sent'); setSelectedFriendId(''); refresh() },
    onError: (e) => toast.error(e.message),
  })
  const acceptInvite = api.itemCollaborator.acceptInvite.useMutation({
    onSuccess: () => { toast.success('Invite accepted'); refresh() },
    onError: (e) => toast.error(e.message),
  })
  const declineInvite = api.itemCollaborator.declineInvite.useMutation({
    onSuccess: () => refresh(),
    onError: (e) => toast.error(e.message),
  })
  const remove = api.itemCollaborator.remove.useMutation({
    onSuccess: () => { toast.success('Removed'); refresh() },
    onError: (e) => toast.error(e.message),
  })

  const isOwner = !!item.data && item.data.userId === myUserId
  const rows = collaborators.data ?? []
  const alreadyCollaboratingIds = new Set(rows.map((r) => r.userId))
  const eligibleFriends = (friends.data ?? [])
    .map((f) => (f.requesterId === myUserId ? f.addressee : f.requester))
    .filter((u) => !alreadyCollaboratingIds.has(u.id) && u.id !== item.data?.userId)

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />} nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Collaborators</h1>
          {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          {isOwner && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Invite a friend</CardTitle>
              </CardHeader>
              <CardContent>
                {eligibleFriends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No eligible friends to invite — add friends on the{' '}
                    <Link href="/friends" className="underline">Friends page</Link> first.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Select value={selectedFriendId} onValueChange={(v) => { if (v !== null) setSelectedFriendId(v) }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Choose a friend" /></SelectTrigger>
                      <SelectContent>
                        {eligibleFriends.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}{f.username ? ` (@${f.username})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => invite.mutate({ itemId, targetUserId: selectedFriendId })}
                      disabled={!selectedFriendId || invite.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Invite
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                Collaborators {rows.length > 0 && `(${rows.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {collaborators.isLoading && (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              )}
              {!collaborators.isLoading && rows.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No collaborators yet. {isOwner ? 'Invite a friend above to cooperate on this item.' : ''}
                </p>
              )}
              {rows.map((c) => {
                const isMe = c.userId === myUserId
                const isPending = c.status === 'PENDING'
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2">
                    <Avatar size="sm">
                      {c.user.avatarUrl && <AvatarImage src={c.user.avatarUrl} alt={c.user.name} />}
                      <AvatarFallback>{initials(c.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.user.name} {isMe && <span className="text-muted-foreground">(you)</span>}
                      </p>
                      {c.user.username && <p className="text-xs text-muted-foreground truncate">@{c.user.username}</p>}
                    </div>
                    {isPending && (
                      <Badge variant="secondary" className="text-xs shrink-0">Pending</Badge>
                    )}
                    <div className="shrink-0 flex items-center gap-1">
                      {isPending && isMe && (
                        <>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => acceptInvite.mutate({ id: c.id })}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => declineInvite.mutate({ id: c.id })}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {!isPending && isMe && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => { if (window.confirm('Leave this item?')) remove.mutate({ itemId, targetUserId: c.userId }) }}
                        >
                          <LogOut className="h-3.5 w-3.5 mr-1" /> Leave
                        </Button>
                      )}
                      {isOwner && !isMe && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => { if (window.confirm(`Remove ${c.user.name}?`)) remove.mutate({ itemId, targetUserId: c.userId }) }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
