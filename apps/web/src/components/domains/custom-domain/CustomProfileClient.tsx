'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProfileFieldInput } from '@/components/domains/profile/ProfileFieldInput'
import { toValues, toPayload, formatDisplayValue, type FormValues } from '@/components/domains/profile/profile-form-utils'
import type { ProfileFieldDef, ProfileFieldType } from '@/server/domains/profile/profile.fields'
import type { CustomDomainField, FieldType } from '@prisma/client'

export const FIELD_TYPE_MAP: Record<FieldType, ProfileFieldType> = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  ENUM: 'select',
  URL: 'text',
  // LONG_TEXT/DECIMAL/RADIO/CHECKBOXES are new Log-tab-oriented widget types; mapped to the
  // closest existing Profile-tab rendering for now (Profile tab itself is unchanged this phase)
  LONG_TEXT: 'text',
  DECIMAL: 'decimal',
  RADIO: 'select',
  CHECKBOXES: 'select',
}

export function toFieldDef(field: CustomDomainField): ProfileFieldDef {
  return {
    key: field.key,
    label: field.name,
    type: FIELD_TYPE_MAP[field.fieldType],
    unit: field.unit ?? undefined,
    required: field.required,
    options: field.options,
  }
}

function DomainPicker({ itemId }: { itemId: string }) {
  const utils = api.useUtils()
  const domains = api.customDomain.listMine.useQuery()
  const [selected, setSelected] = useState<string>('')

  const attach = api.customDomain.attachItem.useMutation({
    onSuccess: () => {
      toast.success('Custom domain attached')
      utils.customDomain.getItemData.invalidate({ itemId })
    },
  })

  if (domains.isLoading) return <Skeleton className="h-32 rounded-xl" />

  if (!domains.data || domains.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <p className="text-muted-foreground">You don&apos;t have any custom domains yet.</p>
          <p className="text-sm text-muted-foreground">Create one from Custom Domains first, then come back here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Attach a custom domain</CardTitle>
        <CardDescription>Pick which custom item type this belongs to.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selected} onValueChange={(v) => { if (v !== null) setSelected(v) }}>
          <SelectTrigger><SelectValue placeholder="Select a domain…" /></SelectTrigger>
          <SelectContent>
            {domains.data.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.icon ? `${d.icon} ` : ''}{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="w-full"
          disabled={!selected || attach.isPending}
          onClick={() => attach.mutate({ itemId, customDomainId: selected })}
        >
          {attach.isPending ? 'Attaching…' : 'Attach'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function CustomProfileClient({ itemId }: { itemId: string }) {
  const utils = api.useUtils()
  const itemData = api.customDomain.getItemData.useQuery({ itemId })
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<FormValues>({})

  const upsert = api.customDomain.upsertItemData.useMutation({
    onSuccess: () => {
      toast.success('Profile saved')
      utils.customDomain.getItemData.invalidate({ itemId })
      setEditing(false)
    },
  })

  if (itemData.isLoading) return <Skeleton className="h-48 rounded-xl" />

  if (!itemData.data) return <DomainPicker itemId={itemId} />

  const { itemData: record, domain } = itemData.data
  const fields = (domain?.fields ?? []).map(toFieldDef)
  const data = record.data as Record<string, unknown>

  function openEdit() {
    setValues(toValues(fields, data))
    setEditing(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    upsert.mutate({ itemId, data: toPayload(fields, values) })
  }

  return (
    <div className="space-y-4">
      {!editing && (
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base">{domain?.name ?? 'Profile'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={openEdit}>Edit</Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="text-muted-foreground text-sm">This domain has no fields yet — add some in Settings.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {fields
                  .map((field) => [field.label, formatDisplayValue(field, data[field.key])] as const)
                  .filter(([, value]) => value !== null)
                  .map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="animate-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Edit {domain?.name ?? 'profile'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <ProfileFieldInput
                  key={field.key}
                  field={field}
                  values={values}
                  onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
                />
              ))}

              {upsert.error && <p className="text-sm text-destructive">{upsert.error.message}</p>}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={upsert.isPending}>
                  {upsert.isPending ? 'Saving…' : 'Save profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
