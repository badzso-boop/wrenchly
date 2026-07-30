'use client'
import { useEffect, useRef, useState } from 'react'

interface TrendPoint {
  date: Date | string
  consumption: number
}

interface ActiveState {
  index: number
  x: number
  y: number
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ActiveState | null>(null)

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

  // Position the tooltip at the actual pointer position (relative to the chart container),
  // rather than deriving it from the SVG's own viewBox math — the <svg> uses default
  // preserveAspectRatio, so it letterboxes (centers with side-margins) whenever the container's
  // aspect ratio doesn't match the viewBox's, which made a viewBox-based estimate drift off the
  // real point position.
  function pointerPosition(e: React.MouseEvent): { x: number; y: number } | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: Math.min(rect.width - 8, Math.max(8, e.clientX - rect.left)), y: e.clientY - rect.top }
  }

  function trackPointer(i: number, e: React.MouseEvent) {
    const pos = pointerPosition(e)
    if (pos) setActive({ index: i, ...pos })
  }

  // Tapping a point on mobile fires a synthetic hover (mouseenter/mousemove) immediately
  // followed by the click, both from the same single tap — if the click toggled off whenever
  // the index was already active, that phantom hover-then-click sequence closed the tooltip
  // right back up before it was ever visible. A tap should always show its point; dismiss by
  // tapping elsewhere.
  useEffect(() => {
    if (!active) return
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [active])

  const activeCoord = active ? coords[active.index] : undefined

  return (
    <div ref={containerRef} className="relative">
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

        {coords.map((c, i) => {
          const isActive = active?.index === i
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={(e) => trackPointer(i, e)}
              onMouseMove={(e) => trackPointer(i, e)}
              onMouseLeave={() => setActive((prev) => (prev?.index === i ? null : prev))}
              onClick={(e) => trackPointer(i, e)}
            >
              {/* Invisible, generously-sized hit target — much bigger than the visible dot, easy to tap. */}
              <circle cx={c.x} cy={c.y} r={14} fill="transparent" pointerEvents="all" />
              <circle
                cx={c.x}
                cy={c.y}
                r={isActive ? 5.5 : 4}
                className="fill-chart-1"
                stroke="var(--background)"
                strokeWidth={2}
              />
              {i % labelStride === 0 && (
                <text x={c.x} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={7}>
                  {new Date(c.point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {active && activeCoord && (
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md z-10"
          style={{ left: active.x, top: active.y, transform: 'translate(-50%, calc(-100% - 10px))' }}
        >
          <div className="mb-0.5 font-medium">{new Date(activeCoord.point.date).toLocaleDateString()}</div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-3 rounded-sm bg-chart-1" />
            <span className="text-muted-foreground">Consumption:</span>
            <span className="font-semibold tabular-nums">{activeCoord.point.consumption.toFixed(1)} L/100km</span>
          </div>
        </div>
      )}
    </div>
  )
}
