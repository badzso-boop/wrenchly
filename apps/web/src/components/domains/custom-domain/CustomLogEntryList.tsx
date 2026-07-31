'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LogFieldInput, formatLogFieldValue, extractRawValue, resolveFieldWithConfig, type LogFieldValues } from './LogFieldInput'
import type { FieldWithConfig, EntryWithValues } from '@/server/domains/custom-domain/custom-domain.repository'

function entryToValues(entry: EntryWithValues): LogFieldValues {
  const values: LogFieldValues = {}
  for (const v of entry.values) values[v.field.key] = extractRawValue(v)
  return values
}

function EditEntryForm({
  entry,
  fieldsById,
  onDone,
}: {
  entry: EntryWithValues
  fieldsById: Record<string, FieldWithConfig>
  onDone: () => void
}) {
  const utils = api.useUtils()
  const [recordedAt, setRecordedAt] = useState(new Date(entry.recordedAt).toISOString().slice(0, 10))
  const [values, setValues] = useState<LogFieldValues>(() => entryToValues(entry))

  const activeFieldIds = Object.keys(fieldsById).filter((id) => !fieldsById[id]!.archivedAt)
  const activeFields = activeFieldIds.map((id) => fieldsById[id]!).sort((a, b) => a.order - b.order)

  const updateEntry = api.customDomainLog.updateEntry.useMutation({
    onSuccess: () => {
      toast.success('Entry updated')
      utils.customDomainLog.listEntries.invalidate()
      onDone()
    },
    onError: (err) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateEntry.mutate({ entryId: entry.id, recordedAt: new Date(recordedAt), values })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="space-y-1.5">
        <Label htmlFor={`edit-log-date-${entry.id}`}>Date *</Label>
        <DateField id={`edit-log-date-${entry.id}`} value={recordedAt} onChange={setRecordedAt} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {activeFields.map((field) => (
          <div key={field.id} className={`space-y-1.5 ${field.widthCols === 2 ? 'col-span-2' : 'col-span-1'}`}>
            <Label>{field.name}{field.unit ? ` (${field.unit})` : ''}{field.required ? ' *' : ''}</Label>
            <LogFieldInput field={field} values={values} onChange={(key, v) => setValues((prev) => ({ ...prev, [key]: v }))} />
            {field.fieldConfig?.helpText && <p className="text-xs text-muted-foreground">{field.fieldConfig.helpText}</p>}
          </div>
        ))}
      </div>
      {updateEntry.error && <p className="text-sm text-destructive">{updateEntry.error.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateEntry.isPending}>{updateEntry.isPending ? 'Saving…' : 'Save'}</Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function CustomLogEntryList({ fields, entries }: { fields: FieldWithConfig[]; entries: EntryWithValues[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f]))

  const deleteEntry = api.customDomainLog.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success('Entry deleted')
      utils.customDomainLog.listEntries.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No entries logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isExpanded = expanded === entry.id
        const preview = entry.values.slice(0, 2)
        return (
          <Card key={entry.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : entry.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm">{new Date(entry.recordedAt).toLocaleDateString()}</span>
                    {preview.map((v) => (
                      <span key={v.id} className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary shrink-0">
                        {v.field.name}: {formatLogFieldValue(resolveFieldWithConfig(fieldsById, v.fieldId, v.field), extractRawValue(v))}
                      </span>
                    ))}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === entry.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditEntryForm entry={entry} fieldsById={fieldsById} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== entry.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-sm">
                    {entry.values.map((v) => {
                      const field = fieldsById[v.fieldId] ?? v.field
                      const isArchived = !!field.archivedAt
                      return (
                        <div key={v.id}>
                          <p className="text-muted-foreground text-xs mb-0.5">
                            {v.field.name}{isArchived ? ' (removed field)' : ''}
                          </p>
                          <p className="font-medium">{formatLogFieldValue(resolveFieldWithConfig(fieldsById, v.fieldId, v.field), extractRawValue(v))}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(entry.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this entry?')) deleteEntry.mutate({ entryId: entry.id }) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function CustomLogEntryListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
