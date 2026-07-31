'use client'
import { useEffect, useRef, useState } from 'react'

interface BarSeries {
  key: string
  label: string
  colorClass: string // e.g. 'fill-chart-1'
}

interface BarDatum {
  label: string
  values: Record<string, number>
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ActiveState | null>(null)

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

  // Position the tooltip at the actual pointer position (relative to the chart container),
  // rather than deriving it from the SVG's own viewBox math — the <svg> uses default
  // preserveAspectRatio, so it letterboxes (centers with side-margins) whenever the container's
  // aspect ratio doesn't match the viewBox's, which made a viewBox-based estimate drift off the
  // real bar position.
  function pointerPosition(e: React.MouseEvent): { x: number; y: number } | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: Math.min(rect.width - 8, Math.max(8, e.clientX - rect.left)), y: e.clientY - rect.top }
  }

  function trackPointer(i: number, e: React.MouseEvent) {
    const pos = pointerPosition(e)
    if (pos) setActive({ index: i, ...pos })
  }

  // Tapping a bar on mobile fires a synthetic hover (mouseenter/mousemove) immediately followed
  // by the click, both from the same single tap — if the click toggled off whenever the index
  // was already active, that phantom hover-then-click sequence closed the tooltip right back up
  // before it was ever visible. A tap should always show its bar; dismiss by tapping elsewhere.
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

  const activeDatum = active ? data[active.index] : undefined

  return (
    <div>
      <div ref={containerRef} className="relative">
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
            const isActive = active?.index === i
            let yCursor = PAD_TOP + plotH
            return (
              <g
                key={d.label}
                className="cursor-pointer"
                onMouseEnter={(e) => trackPointer(i, e)}
                onMouseMove={(e) => trackPointer(i, e)}
                onMouseLeave={() => setActive((prev) => (prev?.index === i ? null : prev))}
                onClick={(e) => trackPointer(i, e)}
              >
                {/* Invisible full-column hit target — bigger than the bar itself, easy to tap on mobile. */}
                <rect x={PAD_LEFT + i * slotW} y={PAD_TOP} width={slotW} height={plotH} fill="transparent" pointerEvents="all" />
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
                      opacity={isActive ? 1 : 0.88}
                      pointerEvents="none"
                    />
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

        {active && activeDatum && (
          <div
            className="pointer-events-none absolute whitespace-nowrap rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md z-10"
            style={{ left: active.x, top: active.y, transform: 'translate(-50%, calc(-100% - 10px))' }}
          >
            <div className="mb-0.5 font-medium">{activeDatum.label}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className={`inline-block h-1.5 w-3 rounded-sm ${s.colorClass}`} />
                <span className="text-muted-foreground">{s.label}:</span>
                <span className="font-semibold tabular-nums">{valueFormatter(activeDatum.values[s.key] ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

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
