interface BarSeries {
  key: string
  label: string
  colorClass: string // e.g. 'fill-chart-1'
}

interface BarDatum {
  label: string
  values: Record<string, number>
}

function niceMax(max: number): number {
  if (max <= 0) return 1
  const exponent = Math.floor(Math.log10(max))
  const fraction = max / 10 ** exponent
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * 10 ** exponent
}

/**
 * Stacked bar chart (a single series renders as a plain bar). Fixed viewBox, scales via
 * width=100% — coordinates below are all fractions of the 300x160 box.
 */
export function BarChart({
  data,
  series,
  valueFormatter = (n) => n.toLocaleString(),
}: {
  data: BarDatum[]
  series: BarSeries[]
  valueFormatter?: (n: number) => string
}) {
  const W = 300
  const H = 160
  const PAD_LEFT = 34
  const PAD_BOTTOM = 20
  const PAD_TOP = 8
  const plotW = W - PAD_LEFT - 8
  const plotH = H - PAD_BOTTOM - PAD_TOP

  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0))
  const max = niceMax(Math.max(1, ...totals))
  const gridSteps = [0, 0.5, 1].map((f) => f * max)

  const slotW = plotW / Math.max(1, data.length)
  const barW = Math.min(24, slotW * 0.55)
  const gap = 2

  // Decimate x-axis labels so they don't collide when there are many bars.
  const labelStride = data.length > 8 ? Math.ceil(data.length / 6) : 1

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Not enough data yet.</p>
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="Bar chart">
        {gridSteps.map((v, i) => {
          const y = PAD_TOP + plotH - (v / max) * plotH
          return (
            <g key={i}>
              <line x1={PAD_LEFT} x2={W - 4} y1={y} y2={y} className="stroke-border" strokeWidth={1} />
              <text x={PAD_LEFT - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={7}>
                {valueFormatter(Math.round(v))}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const x = PAD_LEFT + i * slotW + (slotW - barW) / 2
          let yCursor = PAD_TOP + plotH
          return (
            <g key={d.label}>
              {series.map((s) => {
                const value = d.values[s.key] ?? 0
                if (value <= 0) return null
                const segH = (value / max) * plotH
                const y = yCursor - segH
                yCursor = y - gap
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, segH)}
                    rx={2}
                    className={s.colorClass}
                  >
                    <title>{`${d.label} — ${s.label}: ${valueFormatter(value)}`}</title>
                  </rect>
                )
              })}
              {i % labelStride === 0 && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={7}>
                  {d.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {series.length > 1 && (
        <div className="flex items-center gap-4 mt-1 justify-center">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${s.colorClass}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
