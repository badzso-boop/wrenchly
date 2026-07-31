'use client'

/**
 * Generic horizontal progress meter — a value against a max, severity-colored (good/warning/
 * critical). Built for BICYCLE's chain-wear indicator but kept generic since the same shape
 * (current usage vs. a wear-out threshold) plausibly fits other "consumable wearing down" cases
 * later — not over-abstracted beyond that, no config beyond the thresholds below.
 */
export function Meter({
  label,
  value,
  max,
  unit = '',
  valueFormatter = (n) => n.toLocaleString(),
}: {
  label: string
  value: number
  max: number
  unit?: string
  valueFormatter?: (n: number) => string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colorClass = pct < 60 ? 'bg-chart-2' : pct < 85 ? 'bg-chart-3' : 'bg-destructive'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {valueFormatter(value)}{unit} / {valueFormatter(max)}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
