import type { ItemType } from '@prisma/client'
import { Car, Route, BarChart3, LineChart, Printer, Wallet, ChefHat, Heart, type LucideIcon } from 'lucide-react'

interface ExtraTabDef {
  hrefSuffix: string
  label: string
  icon: LucideIcon
}

// Per-item-type extra tabs on the item detail page, beyond the always-present
// Maintenance/Reminders tabs — same registry pattern as profile.fields.ts's PROFILE_FIELDS and
// maintenance.categories.ts's MAINTENANCE_CATEGORIES. Adding a new item type's tabs is a new
// entry here, not a new `isX` conditional in ItemDetailClient.tsx.
const ITEM_TYPE_LOG_CONFIG: Partial<Record<ItemType, ExtraTabDef[]>> = {
  VEHICLE: [
    { hrefSuffix: '/vehicle', label: 'Vehicle', icon: Car },
    { hrefSuffix: '/trips', label: 'Trip Log', icon: Route },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  BOAT: [
    { hrefSuffix: '/trips', label: 'Voyage Log', icon: Route },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  BICYCLE: [
    { hrefSuffix: '/trips', label: 'Ride Log', icon: Route },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  DRONE: [
    { hrefSuffix: '/trips', label: 'Flight Log', icon: Route },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  PET: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  PLANT: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  AQUARIUM: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  POOL: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  SOLAR: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  PROPERTY: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  MACHINE: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  TOOL: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  DEVICE: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  INSTRUMENT: [
    { hrefSuffix: '/readings', label: 'Readings', icon: LineChart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  PRINTER_3D: [
    { hrefSuffix: '/print-jobs', label: 'Print Jobs', icon: Printer },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
  HOME: [
    { hrefSuffix: '/household-finance', label: 'Expenses & Income', icon: Wallet },
    { hrefSuffix: '/cooking-log', label: 'Cooking Log', icon: ChefHat },
    { hrefSuffix: '/favorite-meals', label: 'Favorite Meals', icon: Heart },
    { hrefSuffix: '/statistics', label: 'Statistics', icon: BarChart3 },
  ],
}

export function getExtraTabs(itemType: ItemType, itemId: string): { href: string; label: string; icon: LucideIcon }[] {
  const defs = ITEM_TYPE_LOG_CONFIG[itemType] ?? []
  return defs.map((d) => ({ href: `/items/${itemId}${d.hrefSuffix}`, label: d.label, icon: d.icon }))
}
