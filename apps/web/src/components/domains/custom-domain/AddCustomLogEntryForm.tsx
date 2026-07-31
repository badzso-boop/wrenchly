'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { LogFieldInput, type LogFieldValues } from './LogFieldInput'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddCustomLogEntryForm({
  itemId,
  fields,
  onSuccess,
}: {
  itemId: string
  fields: FieldWithConfig[]
  onSuccess: () => void
}) {
  const [recordedAt, setRecordedAt] = useState(todayIso())
  const [values, setValues] = useState<LogFieldValues>({})

  const activeFields = fields.filter((f) => !f.archivedAt).sort((a, b) => a.order - b.order)

  const createEntry = api.customDomainLog.createEntry.useMutation({
    onSuccess: () => {
      toast.success('Entry logged')
      setValues({})
      onSuccess()
    },
    onError: (err) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createEntry.mutate({ itemId, recordedAt: new Date(recordedAt), values })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <div className="space-y-1.5">
        <Label htmlFor="log-entry-date">Date *</Label>
        <DateField id="log-entry-date" value={recordedAt} onChange={setRecordedAt} required />
      </div>

      {activeFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">This log form has no fields yet — add some in Settings.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {activeFields.map((field) => (
            <div key={field.id} className={`space-y-1.5 ${field.widthCols === 2 ? 'col-span-2' : 'col-span-1'}`}>
              <Label>{field.name}{field.unit ? ` (${field.unit})` : ''}{field.required ? ' *' : ''}</Label>
              <LogFieldInput field={field} values={values} onChange={(key, v) => setValues((prev) => ({ ...prev, [key]: v }))} />
              {field.fieldConfig?.helpText && <p className="text-xs text-muted-foreground">{field.fieldConfig.helpText}</p>}
            </div>
          ))}
        </div>
      )}

      {createEntry.error && <p className="text-sm text-destructive">{createEntry.error.message}</p>}

      <Button type="submit" size="sm" disabled={createEntry.isPending || activeFields.length === 0}>
        {createEntry.isPending ? 'Saving…' : 'Log entry'}
      </Button>
    </form>
  )
}
