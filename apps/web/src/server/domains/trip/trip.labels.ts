import type { ItemType } from '@prisma/client'

export interface TripLogLabelDef {
  tabLabel: string
  formTitle: string
  /** The "how much this trip" field's label — km for most types, engine hours for BOAT. */
  distanceFieldLabel: string
  distanceRequired: boolean
  /** VEHICLE/BOAT track a real running meter (odometer / engine-hour meter): the form asks for
   * a starting reading, distance/hours travelled, and computes the ending reading. BICYCLE/DRONE
   * have no such per-trip "starting reading" concept — only this trip's own numbers matter, so
   * these fields are hidden and the backend fills start=0/end=distanceKm internally. */
  showOdometerFields: boolean
  startFieldLabel: string
  showFuelSection: boolean
  showDuration: boolean
  showElevation: boolean
  showBattery: boolean
}

const TRIP_LOG_TYPES = ['VEHICLE', 'BOAT', 'BICYCLE', 'DRONE'] as const
export type TripLogItemType = (typeof TRIP_LOG_TYPES)[number]

export const TRIP_LOG_LABELS: Record<TripLogItemType, TripLogLabelDef> = {
  VEHICLE: {
    tabLabel: 'Trip Log',
    formTitle: 'Log Trip',
    distanceFieldLabel: 'Distance traveled (km)',
    distanceRequired: true,
    showOdometerFields: true,
    startFieldLabel: 'Starting odometer (km)',
    showFuelSection: true,
    showDuration: false,
    showElevation: false,
    showBattery: false,
  },
  BOAT: {
    tabLabel: 'Voyage Log',
    formTitle: 'Log Voyage',
    distanceFieldLabel: 'Engine hours (this voyage)',
    distanceRequired: true,
    showOdometerFields: true,
    startFieldLabel: 'Starting engine hours',
    showFuelSection: true,
    showDuration: false,
    showElevation: false,
    showBattery: false,
  },
  BICYCLE: {
    tabLabel: 'Ride Log',
    formTitle: 'Log Ride',
    distanceFieldLabel: 'Distance (km)',
    distanceRequired: true,
    showOdometerFields: false,
    startFieldLabel: '',
    showFuelSection: false,
    showDuration: true,
    showElevation: true,
    showBattery: false,
  },
  DRONE: {
    tabLabel: 'Flight Log',
    formTitle: 'Log Flight',
    distanceFieldLabel: 'Distance (km)',
    distanceRequired: false,
    showOdometerFields: false,
    startFieldLabel: '',
    showFuelSection: false,
    showDuration: true,
    showElevation: false,
    showBattery: true,
  },
}

export function isTripLogItemType(itemType: ItemType): itemType is TripLogItemType {
  return (TRIP_LOG_TYPES as readonly string[]).includes(itemType)
}

export function getTripLogLabels(itemType: ItemType): TripLogLabelDef | null {
  return isTripLogItemType(itemType) ? TRIP_LOG_LABELS[itemType] : null
}
