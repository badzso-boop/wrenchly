import type { ItemType } from '@prisma/client'

export interface MetricDef {
  key: string
  label: string
  unit: string
  healthyMin?: number
  healthyMax?: number
}

// Item types with a "log a number over time" tab. Phase 2 of the per-item-type statistics
// initiative adds the remaining PLANT/AQUARIUM/POOL/SOLAR/PROPERTY/MACHINE/TOOL/DEVICE/
// INSTRUMENT entries here — this stays a Partial<Record<...>> so those slot in without touching
// anything built for PET.
export const READING_METRICS: Partial<Record<ItemType, MetricDef[]>> = {
  PET: [{ key: 'weightKg', label: 'Weight', unit: 'kg' }],
}

export function getReadingMetrics(itemType: ItemType): MetricDef[] | null {
  return READING_METRICS[itemType] ?? null
}
