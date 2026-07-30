interface TrendPoint {
  date: Date | string
  consumption: number
}

function niceMax(max: number): number {
  if (max <= 0) return 1
  const exponent = Math.floor(Math.log10(max))
  const fraction = max / 10 ** exponent
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * 10 ** exponent
}

/** Single-series line chart — per-trip fuel consumption (L/100km) over time. */
export function ConsumptionTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Not enough fuel data yet.</p>
  }

  const W = 300
  const H = 160
  const PAD_LEFT = 34
  const PAD_BOTTOM = 20
  const PAD_TOP = 8
  const PAD_RIGHT = 8
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_BOTTOM - PAD_TOP

  const max = niceMax(Math.max(...points.map((p) => p.consumption)) * 1.15)
  const gridSteps = [0, 0.5, 1].map((f) => f * max)

  const stepX = points.length > 1 ? plotW / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    x: PAD_LEFT + (points.length > 1 ? i * stepX : plotW / 2),
    y: PAD_TOP + plotH - (p.consumption / max) * plotH,
    point: p,
  }))

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')

  const labelStride = coords.length > 8 ? Math.ceil(coords.length / 6) : 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="Consumption trend chart">
      {gridSteps.map((v, i) => {
        const y = PAD_TOP + plotH - (v / max) * plotH
        return (
          <g key={i}>
            <line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y} y2={y} className="stroke-border" strokeWidth={1} />
            <text x={PAD_LEFT - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={7}>
              {v.toFixed(1)}
            </text>
          </g>
        )
      })}

      <path d={path} className="stroke-chart-1" fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={4} className="fill-chart-1" stroke="var(--background)" strokeWidth={2}>
            <title>{`${new Date(c.point.date).toLocaleDateString()}: ${c.point.consumption.toFixed(1)} L/100km`}</title>
          </circle>
          {i % labelStride === 0 && (
            <text x={c.x} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={7}>
              {new Date(c.point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
