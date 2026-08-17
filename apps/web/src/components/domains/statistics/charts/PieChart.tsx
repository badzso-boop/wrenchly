'use client'
import { useEffect, useRef, useState } from 'react'

interface PieSlice {
  label: string
  value: number
  colorClass: string // e.g. 'fill-chart-1'
}

interface ActiveState {
  index: number
  x: number
  y: number
}

/**
 * Donut chart -- a count-per-option distribution (PIE chart type). Same fixed-viewBox/scale-via-
 * width, hover-tooltip, tap-to-show-on-mobile interaction pattern as LineChart/BarChart, so all
 * three read as one family of components rather than a bolted-on third style.
 */
export function PieChart({ data }: { data: PieSlice[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ActiveState | null>(null)

  if (data.length === 0 || data.every((d) => d.value <= 0)) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Not enough data yet.</p>
  }

  const W = 300
  const H = 160
  const cx = W / 2
  const cy = H / 2
  const rOuter = 62
  const rInner = 36
  const total = data.reduce((sum, d) => sum + d.value, 0)

  function pointerPosition(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: Math.min(rect.width - 8, Math.max(8, e.clientX - rect.left)), y: e.clientY - rect.top }
  }

  function trackPointer(i: number, e: { clientX: number; clientY: number }) {
    const pos = pointerPosition(e)
    if (pos) setActive({ index: i, ...pos })
  }

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

  // Slices start at 12 o'clock and go clockwise, each an SVG arc path between its start/end angle
  // on the outer radius and back on the inner radius (a "thick ring" wedge, i.e. a donut slice).
  let angleCursor = -Math.PI / 2
  const slices = data.map((d, i) => {
    const fraction = d.value / total
    const startAngle = angleCursor
    const endAngle = angleCursor + fraction * 2 * Math.PI
    angleCursor = endAngle
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
    const [ox1, oy1] = p(rOuter, startAngle)
    const [ox2, oy2] = p(rOuter, endAngle)
    const [ix1, iy1] = p(rInner, endAngle)
    const [ix2, iy2] = p(rInner, startAngle)
    const path = [
      `M ${ox1} ${oy1}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ox2} ${oy2}`,
      `L ${ix1} ${iy1}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ')
    return { ...d, path, fraction, i }
  })

  const activeSlice = active ? slices[active.index] : undefined

  return (
    <div>
      <div ref={containerRef} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="Pie chart">
          {slices.map((s) => (
            <path
              key={s.label}
              d={s.path}
              className={`${s.colorClass} cursor-pointer`}
              opacity={active && active.index !== s.i ? 0.5 : 1}
              onMouseEnter={(e) => trackPointer(s.i, e)}
              onMouseMove={(e) => trackPointer(s.i, e)}
              onMouseLeave={() => setActive((prev) => (prev?.index === s.i ? null : prev))}
              onClick={(e) => trackPointer(s.i, e)}
              onPointerUp={(e) => { if (e.pointerType === 'touch') trackPointer(s.i, e) }}
            />
          ))}
        </svg>

        {active && activeSlice && (
          <div
            className="pointer-events-none absolute whitespace-nowrap rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md z-10"
            style={{ left: active.x, top: active.y, transform: 'translate(-50%, calc(-100% - 10px))' }}
          >
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${activeSlice.colorClass}`} />
              <span className="font-medium">{activeSlice.label}</span>
              <span className="font-semibold tabular-nums text-muted-foreground">
                {activeSlice.value} ({Math.round(activeSlice.fraction * 100)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 justify-center">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${d.colorClass}`} />
            <span className="text-xs text-muted-foreground">{d.label} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
