'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { getLogFieldTypeDef } from './custom-log-field-types'
import type { FieldType } from '@prisma/client'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'

export interface LoggableFieldFormResult {
  field: FieldWithConfig
  /** Only meaningful in create mode: which side a half-width field should be inserted on. */
  insertionSide?: 'left' | 'right'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customDomainId: string
  /** Fixed for the lifetime of the dialog -- type can't change after a field is created. */
  fieldType: FieldType
  /** Present in edit mode; omitted in create mode. */
  existing?: FieldWithConfig | null
  onSaved: (result: LoggableFieldFormResult) => void
}

export function LoggableFieldDialog({ open, onOpenChange, customDomainId, fieldType, existing, onSaved }: Props) {
  const typeDef = getLogFieldTypeDef(fieldType)
  const isEdit = !!existing

  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [required, setRequired] = useState(false)
  const [widthCols, setWidthCols] = useState<1 | 2>(2)
  const [side, setSide] = useState<'left' | 'right'>('right')
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [decimalPlaces, setDecimalPlaces] = useState('')
  const [maxLength, setMaxLength] = useState('')
  const [helpText, setHelpText] = useState('')

  useEffect(() => {
    if (!open) return
    setName(existing?.name ?? '')
    setUnit(existing?.unit ?? '')
    setRequired(existing?.required ?? false)
    setWidthCols((existing?.widthCols as 1 | 2) ?? 2)
    setSide('right')
    setOptions(existing?.options ?? [])
    setNewOption('')
    setMinValue(existing?.fieldConfig?.minValue != null ? String(existing.fieldConfig.minValue) : '')
    setMaxValue(existing?.fieldConfig?.maxValue != null ? String(existing.fieldConfig.maxValue) : '')
    setDecimalPlaces(existing?.fieldConfig?.decimalPlaces != null ? String(existing.fieldConfig.decimalPlaces) : '')
    setMaxLength(existing?.fieldConfig?.maxLength != null ? String(existing.fieldConfig.maxLength) : '')
    setHelpText(existing?.fieldConfig?.helpText ?? '')
  }, [open, existing])

  const addField = api.customDomainLog.addLoggableField.useMutation({
    onSuccess: (field) => {
      toast.success('Field added')
      onSaved({ field, insertionSide: widthCols === 1 ? side : undefined })
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message),
  })
  const updateField = api.customDomainLog.updateLoggableField.useMutation({
    onSuccess: (field) => {
      toast.success('Field updated')
      onSaved({ field })
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const pending = addField.isPending || updateField.isPending

  function buildConfig() {
    if (!typeDef.hasMinMax && !typeDef.hasDecimalPlaces && !typeDef.hasMaxLength && !helpText) return undefined
    return {
      minValue: typeDef.hasMinMax && minValue !== '' ? Number(minValue) : null,
      maxValue: typeDef.hasMinMax && maxValue !== '' ? Number(maxValue) : null,
      decimalPlaces: typeDef.hasDecimalPlaces && decimalPlaces !== '' ? Number(decimalPlaces) : null,
      maxLength: typeDef.hasMaxLength && maxLength !== '' ? Number(maxLength) : null,
      helpText: helpText || null,
    }
  }

  function addOption() {
    const v = newOption.trim()
    if (!v || options.includes(v)) return
    setOptions([...options, v])
    setNewOption('')
  }
  function removeOption(o: string) {
    setOptions(options.filter((x) => x !== o))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (typeDef.hasOptions && options.length === 0) {
      toast.error('Add at least one option')
      return
    }
    const config = buildConfig()
    if (isEdit) {
      updateField.mutate({
        fieldId: existing!.id,
        name,
        unit: unit || undefined,
        required,
        options: typeDef.hasOptions ? options : undefined,
        widthCols,
        config,
      })
    } else {
      addField.mutate({
        customDomainId,
        name,
        fieldType,
        unit: unit || undefined,
        required,
        options: typeDef.hasOptions ? options : undefined,
        widthCols,
        config,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit' : 'Add'} {typeDef.label} field
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="log-field-name">Field name</Label>
            <Input id="log-field-name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. pH level" required autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label>Width</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={widthCols === 2 ? 'default' : 'outline'} onClick={() => setWidthCols(2)}>
                Full width
              </Button>
              <Button type="button" size="sm" variant={widthCols === 1 ? 'default' : 'outline'} onClick={() => setWidthCols(1)}>
                Half width
              </Button>
            </div>
            {widthCols === 1 && !isEdit && (
              <div className="flex gap-2 pt-1">
                <Button type="button" size="xs" variant={side === 'left' ? 'secondary' : 'ghost'} onClick={() => setSide('left')}>Left</Button>
                <Button type="button" size="xs" variant={side === 'right' ? 'secondary' : 'ghost'} onClick={() => setSide('right')}>Right</Button>
              </div>
            )}
          </div>

          {!typeDef.hasOptions && (
            <div className="space-y-1.5">
              <Label htmlFor="log-field-unit">Unit (optional)</Label>
              <Input id="log-field-unit" value={unit} onChange={(e) => setUnit((e.target as HTMLInputElement).value)} placeholder="e.g. ppm" />
            </div>
          )}

          {typeDef.hasOptions && (
            <div className="space-y-1.5">
              <Label>Options</Label>
              <div className="flex flex-wrap gap-1.5">
                {options.map((o) => (
                  <span key={o} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
                    {o}
                    <button type="button" onClick={() => removeOption(o)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                  placeholder="Add option…"
                  className="h-8 text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={addOption}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}

          {typeDef.hasMinMax && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="log-field-min">Min value</Label>
                <Input id="log-field-min" type="number" value={minValue} onChange={(e) => setMinValue((e.target as HTMLInputElement).value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="log-field-max">Max value</Label>
                <Input id="log-field-max" type="number" value={maxValue} onChange={(e) => setMaxValue((e.target as HTMLInputElement).value)} />
              </div>
            </div>
          )}

          {typeDef.hasDecimalPlaces && (
            <div className="space-y-1.5">
              <Label htmlFor="log-field-decimals">Decimal places</Label>
              <Input id="log-field-decimals" type="number" min="0" max="10" value={decimalPlaces} onChange={(e) => setDecimalPlaces((e.target as HTMLInputElement).value)} placeholder="e.g. 2" />
            </div>
          )}

          {typeDef.hasMaxLength && (
            <div className="space-y-1.5">
              <Label htmlFor="log-field-maxlen">Max length</Label>
              <Input id="log-field-maxlen" type="number" min="1" value={maxLength} onChange={(e) => setMaxLength((e.target as HTMLInputElement).value)} placeholder="e.g. 200" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="log-field-help">Help text (optional)</Label>
            <Input id="log-field-help" value={helpText} onChange={(e) => setHelpText((e.target as HTMLInputElement).value)} placeholder="Shown under the field when logging" />
          </div>

          {typeDef.supportsRequired && (
            <div className="flex items-center gap-2">
              <Switch checked={required} onCheckedChange={setRequired} />
              <Label className="text-sm">Required</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || !name}>
              {pending ? 'Saving…' : isEdit ? 'Save' : 'Add field'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
