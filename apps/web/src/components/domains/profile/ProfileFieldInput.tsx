'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProfileFieldDef } from '@/server/domains/profile/profile.fields'
import type { FormValues } from './profile-form-utils'

export function ProfileFieldInput({
  field,
  values,
  onChange,
}: {
  field: ProfileFieldDef
  values: FormValues
  onChange: (key: string, value: string | boolean) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}{field.required ? ' *' : ''}{field.unit ? ` (${field.unit})` : ''}
      </Label>

      {field.type === 'boolean' ? (
        <Switch
          checked={Boolean(values[field.key])}
          onCheckedChange={(checked) => onChange(field.key, checked)}
        />
      ) : field.type === 'select' ? (
        <Select
          value={String(values[field.key] ?? '')}
          onValueChange={(v) => { if (v !== null) onChange(field.key, v) }}
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
          onChange={(e) => onChange(field.key, (e.target as HTMLInputElement).value)}
          required={field.required}
        />
      )}
    </div>
  )
}
