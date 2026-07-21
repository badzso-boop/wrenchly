'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileFieldDef } from '@/server/domains/profile/profile.fields'
import { ProfileFieldInput } from './ProfileFieldInput'
import { toValues, toPayload, formatDisplayValue, type FormValues } from './profile-form-utils'

export function ProfileClient({ itemId, fields }: { itemId: string; fields: ProfileFieldDef[] }) {
  const utils = api.useUtils()
  const profile = api.profile.getByItemId.useQuery({ itemId })
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<FormValues>({})

  const upsert = api.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success('Profile saved')
      utils.profile.getByItemId.invalidate({ itemId })
      setEditing(false)
    },
  })

  function openEdit() {
    setValues(toValues(fields, profile.data))
    setEditing(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    upsert.mutate({ itemId, data: toPayload(fields, values) })
  }

  if (profile.isLoading) return <Skeleton className="h-48 rounded-xl" />

  const p = profile.data

  return (
    <div className="space-y-4">
      {p && !editing && (
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base">Profile</CardTitle>
            <Button variant="ghost" size="sm" onClick={openEdit}>Edit</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {fields
                .map((field) => [field.label, formatDisplayValue(field, p[field.key])] as const)
                .filter(([, value]) => value !== null)
                .map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!p && !editing && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No profile set up yet.</p>
            <Button onClick={openEdit}>Set up profile</Button>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="animate-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{p ? 'Edit profile' : 'New profile'}</CardTitle>
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
