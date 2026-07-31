'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Download } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldLayoutPreview } from './CustomLogBuilder'
import { formatLogFieldValue, extractRawValue } from './LogFieldInput'
import type { CustomDomainStoreListing } from '@/server/domains/custom-domain/custom-domain.repository'

function StoreEntryCard({ domain, onImported }: { domain: CustomDomainStoreListing; onImported: () => void }) {
  const importDomain = api.customDomainLog.importDomain.useMutation({
    onSuccess: () => { toast.success(`Imported "${domain.name}" into your custom domains`); onImported() },
    onError: (err) => toast.error(err.message),
  })
  const sample = domain.customItemDataEntries[0]
  const fieldsById = Object.fromEntries(domain.fields.map((f) => [f.id, f]))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{domain.icon ? `${domain.icon} ` : ''}{domain.name}</CardTitle>
          <Button size="sm" disabled={importDomain.isPending} onClick={() => importDomain.mutate({ sourceDomainId: domain.id })}>
            <Download className="h-3.5 w-3.5 mr-1" /> {importDomain.isPending ? 'Importing…' : 'Import to my inventory'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Log form layout</p>
          <FieldLayoutPreview fields={domain.fields} />
        </div>
        {sample && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Sample entry</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm rounded-lg border p-3">
              {sample.values.map((v) => {
                const field = fieldsById[v.fieldId] ?? { ...v.field, fieldConfig: null }
                return (
                  <div key={v.id}>
                    <p className="text-muted-foreground text-xs mb-0.5">{v.field.name}</p>
                    <p className="font-medium">{formatLogFieldValue(field, extractRawValue(v))}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CustomDomainStoreClient() {
  const router = useRouter()
  const store = api.customDomainLog.listStore.useQuery()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href="/settings" />} nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Custom Domain Store</h1>
          <p className="text-sm text-muted-foreground">Import a published domain into your own inventory</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-2xl mx-auto space-y-4">
          {store.isLoading && (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          )}
          {store.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No published custom domains yet.</p>
          )}
          {store.data?.map((domain) => (
            <StoreEntryCard key={domain.id} domain={domain} onImported={() => router.push('/settings')} />
          ))}
        </div>
      </div>
    </div>
  )
}
