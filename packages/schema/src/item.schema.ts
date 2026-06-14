import { z } from 'zod'

export const ItemTypeSchema = z.enum([
  'VEHICLE', 'PROPERTY', 'PLANT', 'MACHINE', 'TOOL', 'DEVICE',
  'PET', 'AQUARIUM', 'POOL', 'BOAT', 'DRONE', 'INSTRUMENT',
  'BICYCLE', 'SOLAR', 'CUSTOM',
])

export const ItemStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'SOLD'])

export const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  type: ItemTypeSchema,
  subtype: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  serialNumber: z.string().max(100).optional(),
  warrantyExpiresAt: z.coerce.date().optional(),
  coverPhotoUrl: z.string().url().optional(),
  parentItemId: z.string().cuid().optional(),
})

export const UpdateItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  subtype: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  status: ItemStatusSchema.optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  serialNumber: z.string().max(100).optional(),
  warrantyExpiresAt: z.coerce.date().optional(),
  coverPhotoUrl: z.string().url().optional(),
})

export const GetItemSchema = z.object({
  id: z.string().cuid(),
})

export const ListItemsSchema = z.object({
  status: ItemStatusSchema.optional().default('ACTIVE'),
  type: ItemTypeSchema.optional(),
})

export const DeleteItemSchema = z.object({
  id: z.string().cuid(),
})

export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>
export type ListItemsInput = z.infer<typeof ListItemsSchema>
