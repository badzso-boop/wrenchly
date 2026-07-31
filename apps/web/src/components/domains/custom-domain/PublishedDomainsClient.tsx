'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddCustomLogEntryForm } from './AddCustomLogEntryForm'
import { CustomLogEntryList, CustomLogEntryListSkeleton } from './CustomLogEntryList'
import type { CustomDomainWithFields } from '@/server/domains/custom-domain/custom-domain.repository'

/** A published domain's own sample-data editor. There's no dedicated "sample item" model --
 * per the phase-5 brief, this reuses whichever Item the publisher already has attached to the
 * domain (oldest one, via `getSampleItem`). If none exists yet, the publisher needs to attach
 * an item to this domain first from the item's own page before sample data can be edited here. */
function PublishedDomainCard({ domain }: { domain: CustomDomainWithFields }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const sampleItem = api.customDomainLog.getSampleItem.useQuery({ customDomainId: domain.id })
  const log = api.customDomainLog.listEntries.useQuery(
    { itemId: sampleItem.data?.id ?? '' },
    { enabled: !!sampleItem.data }
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{domain.icon ? `${domain.icon} ` : ''}{domain.name}</CardTitle>
        <CardDescription>
          Published{domain.publishedAt ? ` on ${new Date(domain.publishedAt).toLocaleDateString()}` : ''} — field
          structure is locked. You can still edit this domain's sample entries below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sampleItem.isLoading && <Skeleton className="h-16 w-full" />}
        {sampleItem.data === null && (
          <p className="text-sm text-muted-foreground">
            No item is attached to this domain yet — attach one from an item's page to start logging sample data.
          </p>
        )}
        {sampleItem.data && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Sample item: {sampleItem.data.name}</p>
              <Button size="sm" variant={showAddForm ? 'secondary' : 'default'} onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : '+ Log entry'}
              </Button>
            </div>
            {showAddForm && log.data && (
              <AddCustomLogEntryForm
                itemId={sampleItem.data.id}
                fields={log.data.fields}
                onSuccess={() => { setShowAddForm(false); void log.refetch() }}
              />
            )}
            {log.isLoading && <CustomLogEntryListSkeleton />}
            {log.data && <CustomLogEntryList fields={log.data.fields} entries={log.data.entries} />}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function PublishedDomainsClient() {
  const domains = api.customDomain.listMine.useQuery()
  const published = domains.data?.filter((d) => d.isPublished) ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href="/settings" />} nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">My Published Domains</h1>
          <p className="text-sm text-muted-foreground">Field structure is locked; sample data stays editable</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-4">
          {domains.isLoading && <Skeleton className="h-40 w-full" />}
          {domains.data && published.length === 0 && (
            <p className="text-sm text-muted-foreground">You haven't published any custom domains yet.</p>
          )}
          {published.map((domain) => <PublishedDomainCard key={domain.id} domain={domain} />)}
        </div>
      </div>
    </div>
  )
}
