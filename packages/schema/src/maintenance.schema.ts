import { z } from 'zod'

export const CreatePartSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  partNumber: z.string().max(100).optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  unitPrice: z.number().nonnegative().optional(),
  supplier: z.string().max(100).optional(),
  url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
})

export const CreateMaintenanceRecordSchema = z.object({
  itemId: z.string().cuid(),
  performedAt: z.coerce.date(),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  costLabor: z.number().nonnegative().optional(),
  isDiy: z.boolean().default(true),
  timeSpentMin: z.number().int().positive().optional(),
  odometerValue: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
  parts: z.array(CreatePartSchema).default([]),
})

export const UpdateMaintenanceRecordSchema = z.object({
  id: z.string().cuid(),
  performedAt: z.coerce.date().optional(),
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().max(1000).optional(),
  costLabor: z.number().nonnegative().optional(),
  isDiy: z.boolean().optional(),
  timeSpentMin: z.number().int().positive().optional(),
  odometerValue: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
})

export const ListMaintenanceRecordsSchema = z.object({
  itemId: z.string().cuid(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().cuid().optional(),
})

export const GetMaintenanceRecordSchema = z.object({
  id: z.string().cuid(),
})

export const DeleteMaintenanceRecordSchema = z.object({
  id: z.string().cuid(),
})

export type CreateMaintenanceRecordInput = z.infer<typeof CreateMaintenanceRecordSchema>
export type UpdateMaintenanceRecordInput = z.infer<typeof UpdateMaintenanceRecordSchema>
export type ListMaintenanceRecordsInput = z.infer<typeof ListMaintenanceRecordsSchema>
