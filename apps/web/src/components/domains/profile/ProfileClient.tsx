'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileFieldDef } from '@/server/domains/profile/profile.fields'

type FormValues = Record<string, string | boolean>

function toFormValue(value: unknown): string | boolean {
  if (typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10)
  if (value === null || value === undefined) return ''
  return String(value)
}

function toValues(fields: ProfileFieldDef[], data: Record<string, unknown> | null | undefined): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    values[field.key] = field.type === 'boolean' ? Boolean(data?.[field.key]) : toFormValue(data?.[field.key])
  }
  return values
}

function toPayload(fields: ProfileFieldDef[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    const raw = values[field.key]
    if (field.type === 'boolean') { payload[field.key] = Boolean(raw); continue }
    if (raw === '' || raw === undefined) { payload[field.key] = null; continue }
    if (field.type === 'number' || field.type === 'decimal') payload[field.key] = Number(raw)
    else if (field.type === 'date') payload[field.key] = new Date(String(raw))
    else payload[field.key] = raw
  }
  return payload
}

function formatDisplayValue(field: ProfileFieldDef, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (field.type === 'boolean') return value ? 'Yes' : 'No'
  if (field.type === 'date') return new Date(String(value)).toLocaleDateString()
  return field.unit ? `${value} ${field.unit}` : String(value)
}

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

  function setValue(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }))
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
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}{field.required ? ' *' : ''}{field.unit ? ` (${field.unit})` : ''}
                  </Label>

                  {field.type === 'boolean' ? (
                    <Switch
                      checked={Boolean(values[field.key])}
                      onCheckedChange={(checked) => setValue(field.key, checked)}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={String(values[field.key] ?? '')}
                      onValueChange={(v) => { if (v !== null) setValue(field.key, v) }}
                    >
                      <SelectTrigger id={field.key}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={
                        field.type === 'number' || field.type === 'decimal' ? 'number'
                          : field.type === 'date' ? 'date' : 'text'
                      }
                      step={field.type === 'decimal' ? 'any' : undefined}
                      value={String(values[field.key] ?? '')}
                      onChange={(e) => setValue(field.key, (e.target as HTMLInputElement).value)}
                      required={field.required}
                    />
                  )}
                </div>
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
