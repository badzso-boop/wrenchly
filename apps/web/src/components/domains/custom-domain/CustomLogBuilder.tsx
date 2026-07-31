'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, MoreVertical, Plus, Archive } from 'lucide-react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import type { FieldType } from '@prisma/client'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

interface DomainForBuilder {
  id: string
  fields: FieldWithConfig[]
}

export function CustomLogBuilder({
  domain,
  onChanged,
  isPublished = false,
}: {
  domain: DomainForBuilder
  onChanged: () => void
  isPublished?: boolean
}) {
  const utils = api.useUtils()
  const [dialog, setDialog] = useState<{ fieldType: FieldType; existing?: FieldWithConfig } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = activeFields.map((f) => f.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorder.mutate({ customDomainId: domain.id, orderedFieldIds: arrayMove(ids, from, to) })
  }

  function handleSaved(result: LoggableFieldFormResult) {
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
        {!isPublished && (
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
        )}
      </div>

      {activeFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No log fields yet — add one with the + button above.</p>
      ) : isPublished ? (
        <FieldLayoutPreview fields={activeFields} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeFields.map((f) => f.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2">
              {activeFields.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  onConfigure={() => setDialog({ fieldType: field.fieldType, existing: field })}
                  onRemove={() => {
                    if (window.confirm(`Remove "${field.name}" from the log form?`)) archive.mutate({ fieldId: field.id })
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isPublished && dialog && (
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

/** Non-interactive field-layout preview, reused by the Store page for domains the viewer doesn't
 * own (and here for a domain's own canvas once it's published and locked). Same grid math as
 * `SortableFieldRow`, just without drag/configure/remove affordances. */
export function ReadOnlyFieldRow({ field }: { field: Pick<FieldWithConfig, 'id' | 'name' | 'unit' | 'required' | 'fieldType' | 'widthCols'> }) {
  const typeDef = getLogFieldTypeDef(field.fieldType)
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border p-2 ${field.widthCols === 2 ? 'col-span-2' : 'col-span-1'}`}>
      <typeDef.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">
        {field.name}
        {field.unit ? ` (${field.unit})` : ''}
        {field.required ? ' *' : ''}
      </span>
    </div>
  )
}

export function FieldLayoutPreview({ fields }: { fields: Pick<FieldWithConfig, 'id' | 'name' | 'unit' | 'required' | 'fieldType' | 'widthCols'>[] }) {
  if (fields.length === 0) return <p className="text-sm text-muted-foreground">No log fields.</p>
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((field) => <ReadOnlyFieldRow key={field.id} field={field} />)}
    </div>
  )
}

function SortableFieldRow({
  field,
  onConfigure,
  onRemove,
}: {
  field: FieldWithConfig
  onConfigure: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const typeDef = getLogFieldTypeDef(field.fieldType)
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-lg border p-2 ${field.widthCols === 2 ? 'col-span-2' : 'col-span-1'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/50 shrink-0 active:cursor-grabbing"
        aria-label={`Reorder ${field.name}`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <typeDef.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">
        {field.name}
        {field.unit ? ` (${field.unit})` : ''}
        {field.required ? ' *' : ''}
      </span>
      <div className="flex items-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" />}>
            <MoreVertical className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onConfigure}>Configure</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Archive className="h-3.5 w-3.5" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
