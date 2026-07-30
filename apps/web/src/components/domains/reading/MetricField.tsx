import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MetricDef } from '@/server/domains/reading/reading.fields'

/** One metric's input — a numeric field, or a dropdown for select-style metrics (e.g. a plant's
 * health status). Shared by AddReadingForm and EditReadingForm so the two never drift apart. */
export function MetricField({
  metric,
  value,
  onChange,
  idPrefix,
}: {
  metric: MetricDef
  value: string
  onChange: (value: string) => void
  idPrefix: string
}) {
  const id = `${idPrefix}-${metric.key}`

  if (metric.options) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{metric.label}</Label>
        <Select value={value || null} onValueChange={(v) => { if (v !== null) onChange(v) }}>
          <SelectTrigger id={id}><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {metric.options.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{metric.label}{metric.unit ? ` (${metric.unit})` : ''}</Label>
      <Input
        id={id}
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={metric.unit || undefined}
      />
    </div>
  )
}
