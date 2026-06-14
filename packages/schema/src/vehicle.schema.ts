import { z } from 'zod'

export const CreateVehicleProfileSchema = z.object({
  itemId: z.string().cuid(),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(2100).optional(),
  variant: z.string().max(100).optional(),
  vin: z.string().max(17).optional(),
  licensePlate: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'lpg', 'other']).optional(),
  engineDisplacement: z.number().int().positive().optional(),
  powerKw: z.number().int().positive().optional(),
  transmission: z.enum(['manual', 'automatic', 'cvt']).optional(),
  driveType: z.enum(['fwd', 'rwd', 'awd']).optional(),
  oilSpec: z.string().max(50).optional(),
  coolantType: z.string().max(50).optional(),
  brakeFluidType: z.string().max(20).optional(),
  tireSizeFront: z.string().max(30).optional(),
  tireSizeRear: z.string().max(30).optional(),
  tirePressureFront: z.number().positive().optional(),
  tirePressureRear: z.number().positive().optional(),
  currentOdometer: z.number().int().nonnegative().optional(),
})

export const UpdateVehicleProfileSchema = z.object({
  itemId: z.string().cuid(),
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  variant: z.string().max(100).optional(),
  vin: z.string().max(17).optional(),
  licensePlate: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'lpg', 'other']).optional(),
  engineDisplacement: z.number().int().positive().optional(),
  powerKw: z.number().int().positive().optional(),
  oilSpec: z.string().max(50).optional(),
  coolantType: z.string().max(50).optional(),
  brakeFluidType: z.string().max(20).optional(),
  tireSizeFront: z.string().max(30).optional(),
  tireSizeRear: z.string().max(30).optional(),
  tirePressureFront: z.number().positive().optional(),
  tirePressureRear: z.number().positive().optional(),
})

export const UpdateOdometerSchema = z.object({
  itemId: z.string().cuid(),
  odometer: z.number().int().nonnegative(),
})

export type CreateVehicleProfileInput = z.infer<typeof CreateVehicleProfileSchema>
export type UpdateVehicleProfileInput = z.infer<typeof UpdateVehicleProfileSchema>
export type UpdateOdometerInput = z.infer<typeof UpdateOdometerSchema>
