'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Share2, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export function ShareButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const utils = api.useUtils()
  const shares = api.share.listMine.useQuery(undefined, { enabled: open })

  const create = api.share.create.useMutation({
    onSuccess: () => { toast.success('Share link created'); utils.share.listMine.invalidate() },
  })
  const revoke = api.share.revoke.useMutation({
    onSuccess: () => { toast.success('Share link revoked'); utils.share.listMine.invalidate() },
  })

  const itemShares = (shares.data ?? []).filter((s) => s.itemId === itemId)

  function copyLink(id: string) {
    const url = `${window.location.origin}/share/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="shrink-0" />}>
        <Share2 className="h-4 w-4 mr-1" /> Share
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this item</DialogTitle>
          <DialogDescription>
            Anyone with the link can view a snapshot of this item&apos;s details and maintenance history — no account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {shares.isLoading && <Skeleton className="h-10 w-full" />}

          {itemShares.map((share) => (
            <div key={share.id} className="flex items-center gap-2 rounded-lg border p-2">
              <p className="flex-1 truncate text-xs font-mono text-muted-foreground">
                /share/{share.id}
              </p>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(share.id)}>
                {copiedId === share.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => revoke.mutate({ id: share.id })}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}

          {itemShares.length === 0 && !shares.isLoading && (
            <p className="text-sm text-muted-foreground">No active share links for this item.</p>
          )}

          <Button
            className="w-full"
            disabled={create.isPending}
            onClick={() => create.mutate({ itemId })}
          >
            {create.isPending ? 'Creating…' : 'Create new share link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
