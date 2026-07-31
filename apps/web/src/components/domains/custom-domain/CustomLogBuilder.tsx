'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, ChevronUp, ChevronDown, MoreVertical, Plus, Archive } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { LOG_FIELD_TYPES, getLogFieldTypeDef } from './custom-log-field-types'
import { LoggableFieldDialog, type LoggableFieldFormResult } from './LoggableFieldDialog'
import type { CustomDomainField, FieldType } from '@prisma/client'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

interface DomainForBuilder {
  id: string
  fields: CustomDomainField[]
}

/** Fields fetched via `customDomain.listMine` don't include the joined `fieldConfig` row (that
 * query isn't scoped to this phase's needs). We only learn a field's real config when this
 * session creates or edits it (both mutations return the full row with config). Editing a field
 * from an earlier session, before touching it here, opens the dialog with blank config inputs --
 * the field itself and its data are unaffected, only the edit dialog's prefill is incomplete.
 * A dedicated "get fields with config" query would remove this gap; left as a follow-up. */
function toFieldWithConfigFallback(field: CustomDomainField): FieldWithConfig {
  return { ...field, fieldConfig: null }
}

export function CustomLogBuilder({ domain, onChanged }: { domain: DomainForBuilder; onChanged: () => void }) {
  const utils = api.useUtils()
  const [configCache, setConfigCache] = useState<Record<string, FieldWithConfig>>({})
  const [dialog, setDialog] = useState<{ fieldType: FieldType; existing?: FieldWithConfig } | null>(null)

  const activeFields = domain.fields
    .filter((f) => f.loggable && !f.archivedAt)
    .sort((a, b) => a.order - b.order)

  const reorder = api.customDomainLog.reorderFields.useMutation({
    onSuccess: () => onChanged(),
    onError: (err) => toast.error(err.message),
  })
  const archive = api.customDomainLog.archiveField.useMutation({
    onSuccess: () => { toast.success('Field removed'); onChanged() },
    onError: (err) => toast.error(err.message),
  })

  function move(fieldId: string, direction: -1 | 1) {
    const ids = activeFields.map((f) => f.id)
    const idx = ids.indexOf(fieldId)
    const swapWith = idx + direction
    if (swapWith < 0 || swapWith >= ids.length) return
    ;[ids[idx], ids[swapWith]] = [ids[swapWith]!, ids[idx]!]
    reorder.mutate({ customDomainId: domain.id, orderedFieldIds: ids })
  }

  function handleSaved(result: LoggableFieldFormResult) {
    setConfigCache((prev) => ({ ...prev, [result.field.id]: result.field }))
    if (result.insertionSide === 'left' && activeFields.length > 0) {
      const priorIds = activeFields.map((f) => f.id)
      const reordered = [...priorIds.slice(0, -1), result.field.id, priorIds[priorIds.length - 1]!]
      reorder.mutate({ customDomainId: domain.id, orderedFieldIds: reordered })
    } else {
      onChanged()
    }
    void utils.customDomainLog.listEntries.invalidate()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Log form</p>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" className="rounded-full" />}>
            <Plus className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LOG_FIELD_TYPES.map((t) => (
              <DropdownMenuItem key={t.value} onClick={() => setDialog({ fieldType: t.value })}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No log fields yet — add one with the + button above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {activeFields.map((field, i) => {
            const typeDef = getLogFieldTypeDef(field.fieldType)
            return (
              <div
                key={field.id}
                className={`flex items-center gap-1.5 rounded-lg border p-2 ${field.widthCols === 2 ? 'col-span-2' : 'col-span-1'}`}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <typeDef.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">
                  {field.name}
                  {field.unit ? ` (${field.unit})` : ''}
                  {field.required ? ' *' : ''}
                </span>
                <div className="flex items-center shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => move(field.id, -1)}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === activeFields.length - 1} onClick={() => move(field.id, 1)}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" />}>
                      <MoreVertical className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDialog({ fieldType: field.fieldType, existing: configCache[field.id] ?? toFieldWithConfigFallback(field) })}
                      >
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => { if (window.confirm(`Remove "${field.name}" from the log form?`)) archive.mutate({ fieldId: field.id }) }}
                      >
                        <Archive className="h-3.5 w-3.5" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dialog && (
        <LoggableFieldDialog
          open={!!dialog}
          onOpenChange={(open) => { if (!open) setDialog(null) }}
          customDomainId={domain.id}
          fieldType={dialog.fieldType}
          existing={dialog.existing}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
