'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getProfileFields } from '@/server/domains/profile/profile.fields'
import { ProfileClient } from './ProfileClient'

export function ProfilePageClient({ itemId }: { itemId: string }) {
  const item = api.item.getById.useQuery({ id: itemId })

  const fields = item.data ? getProfileFields(item.data.type) : null

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/items/${itemId}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          {item.data && <p className="text-sm text-muted-foreground">{item.data.name}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto">
          {item.isLoading && <Skeleton className="h-48 rounded-xl" />}
          {item.data && fields && <ProfileClient itemId={itemId} fields={fields} />}
          {item.data && !fields && (
            <p className="text-muted-foreground text-sm">This item type has no extended profile.</p>
          )}
        </div>
      </div>
    </div>
  )
}
