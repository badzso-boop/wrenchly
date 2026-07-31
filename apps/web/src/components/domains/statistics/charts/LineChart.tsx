'use client'
import { useEffect, useRef, useState } from 'react'

interface LineChartPoint {
  date: Date | string
  value: number
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

/**
 * Generic single-series line chart — a per-item-type metric trend over time (renamed/generalized
 * from the vehicle-only ConsumptionTrendChart: the Y-axis unit is now a parameter instead of a
 * hardcoded "L/100km", and an optional shaded band highlights a healthy/target range).
 */
export function LineChart({
  points,
  unitLabel,
  healthyMin,
  healthyMax,
  valueFormatter = (n) => n.toFixed(1),
  pointColorClass,
  valueLabel,
}: {
  points: LineChartPoint[]
  unitLabel: string
  healthyMin?: number
  healthyMax?: number
  valueFormatter?: (n: number) => string
  /** Colors each point (and the tooltip's swatch) by its own value instead of the default
   * chart-1 — e.g. a plant's health-status timeline (green/yellow/orange/red per point). */
  pointColorClass?: (value: number) => string
  /** Overrides the tooltip's value text (e.g. "Healthy" instead of "4") — the axis/line still
   * plots the raw numeric value. */
  valueLabel?: (value: number) => string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ActiveState | null>(null)

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Not enough data yet.</p>
  }

  const W = 300
  const H = 160
  const PAD_LEFT = 34
  const PAD_BOTTOM = 20
  const PAD_TOP = 8
  const PAD_RIGHT = 8
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_BOTTOM - PAD_TOP

  const dataMax = Math.max(...points.map((p) => p.value), healthyMax ?? 0)
  const max = niceMax(dataMax * 1.15)
  const gridSteps = [0, 0.5, 1].map((f) => f * max)

  const yFor = (value: number) => PAD_TOP + plotH - (value / max) * plotH

  const stepX = points.length > 1 ? plotW / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    x: PAD_LEFT + (points.length > 1 ? i * stepX : plotW / 2),
    y: yFor(p.value),
    point: p,
  }))

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')

  const labelStride = coords.length > 8 ? Math.ceil(coords.length / 6) : 1

  // Position the tooltip at the actual pointer position (relative to the chart container),
  // rather than deriving it from the SVG's own viewBox math — the <svg> uses default
  // preserveAspectRatio, so it letterboxes (centers with side-margins) whenever the container's
  // aspect ratio doesn't match the viewBox's, which drifts a viewBox-based estimate off the real
  // point position.
  function pointerPosition(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: Math.min(rect.width - 8, Math.max(8, e.clientX - rect.left)), y: e.clientY - rect.top }
  }

  function trackPointer(i: number, e: { clientX: number; clientY: number }) {
    const pos = pointerPosition(e)
    if (pos) setActive({ index: i, ...pos })
  }

  // Tapping a point on mobile fires a synthetic hover (mouseenter/mousemove) immediately followed
  // by the click, both from the same physical touch — a click handler that toggles based on
  // "is this index already active" would close what the hover just opened. Click always shows;
  // dismissal is a document-level "click outside the chart" listener instead.
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="Line chart">
        {gridSteps.map((v, i) => {
          const y = yFor(v)
          return (
            <g key={i}>
              <line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y} y2={y} className="stroke-border" strokeWidth={1} />
              <text x={PAD_LEFT - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={7}>
                {valueFormatter(v)}
              </text>
            </g>
          )
        })}

        {healthyMin != null && healthyMax != null && (
          <rect
            x={PAD_LEFT}
            y={yFor(healthyMax)}
            width={plotW}
            height={Math.max(0, yFor(healthyMin) - yFor(healthyMax))}
            className="fill-muted"
            fillOpacity={0.5}
          />
        )}

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
              onPointerUp={(e) => { if (e.pointerType === 'touch') trackPointer(i, e) }}
            >
              {/* Invisible, generously-sized hit target — much bigger than the visible dot, easy to tap. */}
              <circle cx={c.x} cy={c.y} r={14} fill="transparent" pointerEvents="all" />
              <circle
                cx={c.x}
                cy={c.y}
                r={isActive ? 5.5 : 4}
                className={pointColorClass ? pointColorClass(c.point.value) : 'fill-chart-1'}
                stroke="var(--background)"
                strokeWidth={2}
                pointerEvents="none"
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
            {/* Reuses the same fill-* class as the chart points (not a bg-* div) — the class
               string only ever appears literally as "fill-*" in reading.fields.ts, so Tailwind's
               scanner can see it; a runtime fill->bg string replace would silently produce an
               un-styled class since "bg-chart-2" etc. never appears as source text anywhere. */}
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 8 8" aria-hidden="true">
              <circle cx={4} cy={4} r={4} className={pointColorClass ? pointColorClass(activeCoord.point.value) : 'fill-chart-1'} />
            </svg>
            <span className="font-semibold tabular-nums">
              {valueLabel ? valueLabel(activeCoord.point.value) : `${valueFormatter(activeCoord.point.value)} ${unitLabel}`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
