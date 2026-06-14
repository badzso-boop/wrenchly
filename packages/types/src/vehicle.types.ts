export interface VehicleProfile {
  itemId: string
  make: string
  model: string
  year: number | null
  variant: string | null
  vin: string | null
  licensePlate: string | null
  color: string | null
  fuelType: string | null
  engineDisplacement: number | null
  powerKw: number | null
  transmission: string | null
  driveType: string | null
  oilSpec: string | null
  coolantType: string | null
  brakeFluidType: string | null
  tireSizeFront: string | null
  tireSizeRear: string | null
  tirePressureFront: number | null
  tirePressureRear: number | null
  currentOdometer: number | null
  lastOdometerUpdate: Date | null
}

export interface CreateVehicleProfileInput {
  itemId: string
  make: string
  model: string
  year?: number
  variant?: string
  vin?: string
  licensePlate?: string
  color?: string
  fuelType?: string
  engineDisplacement?: number
  powerKw?: number
  transmission?: string
  driveType?: string
  oilSpec?: string
  coolantType?: string
  brakeFluidType?: string
  tireSizeFront?: string
  tireSizeRear?: string
  tirePressureFront?: number
  tirePressureRear?: number
  currentOdometer?: number
}

export interface UpdateVehicleProfileInput {
  make?: string
  model?: string
  year?: number
  variant?: string
  vin?: string
  licensePlate?: string
  color?: string
  fuelType?: string
  engineDisplacement?: number
  powerKw?: number
  transmission?: string
  driveType?: string
  oilSpec?: string
  coolantType?: string
  brakeFluidType?: string
  tireSizeFront?: string
  tireSizeRear?: string
  tirePressureFront?: number
  tirePressureRear?: number
}

export interface UpdateOdometerInput {
  itemId: string
  odometer: number
}
