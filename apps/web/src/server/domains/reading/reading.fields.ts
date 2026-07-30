import type { ItemType } from '@prisma/client'

export interface MetricOption {
  value: number
  label: string
  colorClass: string // e.g. 'fill-chart-1' — used to color LineChart points by value
}

export interface MetricDef {
  key: string
  label: string
  unit: string
  healthyMin?: number
  healthyMax?: number
  /** How the stat tile summarizes this metric's history. 'latest' (default) shows the most
   * recent value (a pet's current weight); 'sum' shows a running total (a machine's operating
   * hours, accumulated across every logged session). */
  aggregation?: 'latest' | 'sum'
  /** How the per-metric chart renders. 'line' (default) plots every reading over time;
   * 'bar-monthly' buckets readings into a per-month total bar chart — the natural shape for
   * 'sum'-aggregated usage counters. */
  chartType?: 'line' | 'bar-monthly'
  /** Present for select-style metrics (e.g. a plant's health status) — renders a dropdown
   * instead of a numeric input, and colors LineChart points by the selected value. */
  options?: MetricOption[]
  /** 'sum'-aggregated metrics only: also surface a "this month" stat tile alongside the
   * all-time total. */
  showMonthToDate?: boolean
}

// Item types with a "log a number over time" tab. Phase 1 built the engine (PET only); Phase 2
// adds the remaining 9 domains here — this stays a Partial<Record<...>> so each type slots in
// independently.
export const READING_METRICS: Partial<Record<ItemType, MetricDef[]>> = {
  PET: [{ key: 'weightKg', label: 'Weight', unit: 'kg' }],

  PLANT: [
    { key: 'heightCm', label: 'Height', unit: 'cm' },
    {
      key: 'healthScore',
      label: 'Health',
      unit: '',
      options: [
        { value: 4, label: 'Healthy', colorClass: 'fill-chart-2' },
        { value: 3, label: 'Stressed', colorClass: 'fill-chart-3' },
        { value: 2, label: 'Sick', colorClass: 'fill-chart-4' },
        { value: 1, label: 'Dead', colorClass: 'fill-destructive' },
      ],
    },
  ],

  AQUARIUM: [
    { key: 'ph', label: 'pH', unit: '', healthyMin: 6.5, healthyMax: 7.5 },
    { key: 'ammoniaPpm', label: 'Ammonia', unit: 'ppm', healthyMin: 0, healthyMax: 0.25 },
    { key: 'nitritePpm', label: 'Nitrite', unit: 'ppm', healthyMin: 0, healthyMax: 0.25 },
    { key: 'nitratePpm', label: 'Nitrate', unit: 'ppm', healthyMin: 0, healthyMax: 40 },
    { key: 'tempC', label: 'Temperature', unit: '°C' },
  ],

  POOL: [
    { key: 'freeChlorinePpm', label: 'Free chlorine', unit: 'ppm', healthyMin: 1, healthyMax: 3 },
    { key: 'phLevel', label: 'pH', unit: '', healthyMin: 7.2, healthyMax: 7.6 },
    { key: 'alkalinityPpm', label: 'Alkalinity', unit: 'ppm', healthyMin: 80, healthyMax: 120 },
  ],

  SOLAR: [
    { key: 'kwhProduced', label: 'kWh produced', unit: 'kWh', aggregation: 'sum', chartType: 'bar-monthly', showMonthToDate: true },
  ],

  PROPERTY: [
    { key: 'electricityKwh', label: 'Electricity', unit: 'kWh', chartType: 'bar-monthly' },
    { key: 'gasM3', label: 'Gas', unit: 'm³', chartType: 'bar-monthly' },
    { key: 'waterM3', label: 'Water', unit: 'm³', chartType: 'bar-monthly' },
  ],

  MACHINE: [
    { key: 'operatingHours', label: 'Operating hours', unit: 'h', aggregation: 'sum', chartType: 'bar-monthly' },
    { key: 'cyclesRun', label: 'Cycles run', unit: '', aggregation: 'sum', chartType: 'bar-monthly' },
  ],

  TOOL: [
    { key: 'usageHours', label: 'Usage hours', unit: 'h', aggregation: 'sum', chartType: 'bar-monthly' },
    { key: 'batteryHealthPct', label: 'Battery health', unit: '%' },
  ],

  DEVICE: [
    { key: 'usageHours', label: 'Usage hours', unit: 'h', aggregation: 'sum', chartType: 'bar-monthly' },
    { key: 'batteryHealthPct', label: 'Battery health', unit: '%' },
  ],

  INSTRUMENT: [
    { key: 'practiceMinutes', label: 'Practice time', unit: 'min', aggregation: 'sum', chartType: 'bar-monthly', showMonthToDate: true },
  ],
}

export function getReadingMetrics(itemType: ItemType): MetricDef[] | null {
  return READING_METRICS[itemType] ?? null
}
