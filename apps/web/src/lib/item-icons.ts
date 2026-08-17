const CUSTOM_FALLBACK_ICON = '📦'

export const ITEM_TYPE_ICONS: Record<string, string> = {
  VEHICLE: '🚗', PROPERTY: '🏠', HOME: '🏡', PLANT: '🌱', MACHINE: '⚙️', TOOL: '🔧',
  DEVICE: '📱', PRINTER_3D: '🖨️', PET: '🐾', AQUARIUM: '🐠', POOL: '🏊', BOAT: '⛵',
  DRONE: '🚁', INSTRUMENT: '🎸', BICYCLE: '🚲', SOLAR: '☀️', CUSTOM: CUSTOM_FALLBACK_ICON,
}

/**
 * A CUSTOM item shows its own CustomDomain's icon (e.g. 🏠 for a "Home" domain)
 * instead of the generic CUSTOM box icon, once one is set.
 */
export function getItemIcon(item: {
  type: string
  customItemData?: { customDomain?: { icon: string | null } | null } | null
}): string {
  if (item.type === 'CUSTOM') {
    return item.customItemData?.customDomain?.icon || CUSTOM_FALLBACK_ICON
  }
  return ITEM_TYPE_ICONS[item.type] ?? CUSTOM_FALLBACK_ICON
}
