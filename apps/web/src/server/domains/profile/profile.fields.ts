import type { ItemType } from '@prisma/client'

export type ProfileFieldType = 'text' | 'number' | 'decimal' | 'date' | 'boolean' | 'select'

export interface ProfileFieldDef {
  key: string
  label: string
  type: ProfileFieldType
  required?: boolean
  unit?: string
  options?: string[]
}

// Item types with their own bespoke domain (VEHICLE) or no extended profile at all
// (MACHINE/TOOL/DEVICE — plain items) or a dynamic, DB-defined field set (CUSTOM) are
// intentionally absent here — this registry only covers the generic 1:1 profile tables.
export const PROFILE_FIELDS: Partial<Record<ItemType, ProfileFieldDef[]>> = {
  PROPERTY: [
    { key: 'propertyType', label: 'Property type', type: 'text', required: true },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'yearBuilt', label: 'Year built', type: 'number' },
    { key: 'floorAreaM2', label: 'Floor area', type: 'number', unit: 'm²' },
    { key: 'floors', label: 'Floors', type: 'number' },
    { key: 'rooms', label: 'Rooms', type: 'number' },
    { key: 'heatingType', label: 'Heating type', type: 'text' },
    { key: 'boilerBrand', label: 'Boiler brand', type: 'text' },
    { key: 'boilerModel', label: 'Boiler model', type: 'text' },
    { key: 'roofType', label: 'Roof type', type: 'text' },
  ],
  PLANT: [
    { key: 'commonName', label: 'Common name', type: 'text' },
    { key: 'botanicalName', label: 'Botanical name', type: 'text' },
    { key: 'variety', label: 'Variety', type: 'text' },
    { key: 'locationType', label: 'Location type', type: 'text' },
    { key: 'locationLabel', label: 'Location label', type: 'text' },
    { key: 'plantedDate', label: 'Planted date', type: 'date' },
    { key: 'sunRequirement', label: 'Sun requirement', type: 'text' },
    { key: 'wateringFreqSummer', label: 'Watering frequency (summer)', type: 'number', unit: 'days' },
    { key: 'wateringFreqWinter', label: 'Watering frequency (winter)', type: 'number', unit: 'days' },
    { key: 'soilType', label: 'Soil type', type: 'text' },
    { key: 'fertilizerType', label: 'Fertilizer type', type: 'text' },
    { key: 'fertilizerFreqWeeks', label: 'Fertilizer frequency', type: 'number', unit: 'weeks' },
    { key: 'potSizeLiters', label: 'Pot size', type: 'number', unit: 'L' },
    { key: 'hardyZone', label: 'Hardiness zone', type: 'number' },
    {
      key: 'healthStatus',
      label: 'Health status',
      type: 'select',
      options: ['healthy', 'stressed', 'sick', 'dead'],
    },
    { key: 'lastWateredAt', label: 'Last watered', type: 'date' },
    { key: 'lastFertilizedAt', label: 'Last fertilized', type: 'date' },
  ],
  PRINTER_3D: [
    { key: 'brand', label: 'Brand', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'text', required: true },
    { key: 'buildVolumeX', label: 'Build volume X', type: 'number', unit: 'mm' },
    { key: 'buildVolumeY', label: 'Build volume Y', type: 'number', unit: 'mm' },
    { key: 'buildVolumeZ', label: 'Build volume Z', type: 'number', unit: 'mm' },
    { key: 'nozzleDiameter', label: 'Nozzle diameter', type: 'decimal', unit: 'mm' },
    { key: 'defaultNozzleMat', label: 'Default nozzle material', type: 'text' },
    { key: 'firmwareVersion', label: 'Firmware version', type: 'text' },
    { key: 'totalPrintHours', label: 'Total print hours', type: 'decimal', unit: 'h' },
    { key: 'totalPrints', label: 'Total prints', type: 'number' },
    { key: 'filamentConsumedG', label: 'Filament consumed', type: 'number', unit: 'g' },
  ],
  PET: [
    { key: 'petName', label: 'Pet name', type: 'text', required: true },
    { key: 'species', label: 'Species', type: 'text' },
    { key: 'breed', label: 'Breed', type: 'text' },
    { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'text' },
    { key: 'weightKg', label: 'Weight', type: 'decimal', unit: 'kg' },
    { key: 'microchipNumber', label: 'Microchip number', type: 'text' },
    { key: 'vetName', label: 'Vet name', type: 'text' },
    { key: 'vetPhone', label: 'Vet phone', type: 'text' },
  ],
  BICYCLE: [
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'frameSize', label: 'Frame size', type: 'text' },
    { key: 'groupset', label: 'Groupset', type: 'text' },
    { key: 'brakeType', label: 'Brake type', type: 'text' },
    { key: 'chainBrand', label: 'Chain brand', type: 'text' },
    { key: 'chainKm', label: 'Chain distance', type: 'number', unit: 'km' },
    { key: 'totalKm', label: 'Total distance', type: 'number', unit: 'km' },
  ],
  AQUARIUM: [
    { key: 'aquariumType', label: 'Aquarium type', type: 'text', required: true },
    { key: 'volumeLiters', label: 'Volume', type: 'number', unit: 'L' },
    { key: 'dimensions', label: 'Dimensions', type: 'text' },
    { key: 'setupDate', label: 'Setup date', type: 'date' },
    { key: 'substrate', label: 'Substrate', type: 'text' },
    { key: 'lighting', label: 'Lighting', type: 'text' },
    { key: 'filtration', label: 'Filtration', type: 'text' },
    { key: 'co2System', label: 'CO2 system', type: 'boolean' },
    { key: 'heaterBrand', label: 'Heater brand', type: 'text' },
    { key: 'targetTempC', label: 'Target temperature', type: 'decimal', unit: '°C' },
  ],
  POOL: [
    { key: 'poolType', label: 'Pool type', type: 'text', required: true },
    { key: 'volumeLiters', label: 'Volume', type: 'number', unit: 'L' },
    { key: 'filtrationKind', label: 'Filtration kind', type: 'text' },
    { key: 'pumpBrand', label: 'Pump brand', type: 'text' },
    { key: 'heaterType', label: 'Heater type', type: 'text' },
    { key: 'targetTempC', label: 'Target temperature', type: 'decimal', unit: '°C' },
    { key: 'saltSystem', label: 'Salt system', type: 'boolean' },
    { key: 'uvSystem', label: 'UV system', type: 'boolean' },
  ],
  BOAT: [
    { key: 'boatType', label: 'Boat type', type: 'text', required: true },
    { key: 'make', label: 'Make', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'hullMaterial', label: 'Hull material', type: 'text' },
    { key: 'lengthM', label: 'Length', type: 'decimal', unit: 'm' },
    { key: 'engineBrand', label: 'Engine brand', type: 'text' },
    { key: 'engineModel', label: 'Engine model', type: 'text' },
    { key: 'engineHours', label: 'Engine hours', type: 'decimal', unit: 'h' },
    { key: 'fuelType', label: 'Fuel type', type: 'text' },
    { key: 'fuelTankLiters', label: 'Fuel tank', type: 'number', unit: 'L' },
    { key: 'mooringLocation', label: 'Mooring location', type: 'text' },
    { key: 'registrationExpires', label: 'Registration expires', type: 'date' },
    { key: 'insuranceExpires', label: 'Insurance expires', type: 'date' },
  ],
  DRONE: [
    { key: 'droneType', label: 'Drone type', type: 'text', required: true },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'serialNumber', label: 'Serial number', type: 'text' },
    { key: 'totalFlightHours', label: 'Total flight hours', type: 'decimal', unit: 'h' },
    { key: 'totalFlights', label: 'Total flights', type: 'number' },
    { key: 'firmwareVersion', label: 'Firmware version', type: 'text' },
    { key: 'registrationNumber', label: 'Registration number', type: 'text' },
    { key: 'registrationExpires', label: 'Registration expires', type: 'date' },
  ],
  INSTRUMENT: [
    { key: 'instrumentType', label: 'Instrument type', type: 'text', required: true },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'serialNumber', label: 'Serial number', type: 'text' },
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'stringGauge', label: 'String gauge', type: 'text' },
    { key: 'stringBrand', label: 'String brand', type: 'text' },
    { key: 'tuning', label: 'Tuning', type: 'text' },
  ],
  SOLAR: [
    { key: 'solarType', label: 'System type', type: 'text', required: true },
    { key: 'installer', label: 'Installer', type: 'text' },
    { key: 'installationDate', label: 'Installation date', type: 'date' },
    { key: 'panelCount', label: 'Panel count', type: 'number' },
    { key: 'panelWattPeak', label: 'Panel Wp', type: 'number', unit: 'Wp' },
    { key: 'totalKwp', label: 'Total capacity', type: 'decimal', unit: 'kWp' },
    { key: 'inverterBrand', label: 'Inverter brand', type: 'text' },
    { key: 'inverterModel', label: 'Inverter model', type: 'text' },
    { key: 'batteryStorageKwh', label: 'Battery storage', type: 'decimal', unit: 'kWh' },
    { key: 'annualYieldEstimateKwh', label: 'Annual yield estimate', type: 'number', unit: 'kWh' },
    { key: 'monitoringUrl', label: 'Monitoring URL', type: 'text' },
  ],
}

export type ProfileItemType = keyof typeof PROFILE_FIELDS

export function getProfileFields(itemType: ItemType): ProfileFieldDef[] | null {
  return PROFILE_FIELDS[itemType] ?? null
}
