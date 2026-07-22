export type ItemType =
  | 'VEHICLE'
  | 'PROPERTY'
  | 'PLANT'
  | 'MACHINE'
  | 'TOOL'
  | 'DEVICE'
  | 'PRINTER_3D'
  | 'PET'
  | 'AQUARIUM'
  | 'POOL'
  | 'BOAT'
  | 'DRONE'
  | 'INSTRUMENT'
  | 'BICYCLE'
  | 'SOLAR'
  | 'CUSTOM'

export type ItemStatus = 'ACTIVE' | 'ARCHIVED' | 'SOLD'

export interface Item {
  id: string
  userId: string
  name: string
  type: ItemType
  subtype: string | null
  description: string | null
  location: string | null
  status: ItemStatus
  purchaseDate: Date | null
  purchasePrice: number | null
  serialNumber: string | null
  warrantyExpiresAt: Date | null
  coverPhotoUrl: string | null
  parentItemId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateItemInput {
  name: string
  type: ItemType
  subtype?: string
  description?: string
  location?: string
  purchaseDate?: Date
  purchasePrice?: number
  serialNumber?: string
  warrantyExpiresAt?: Date
  coverPhotoUrl?: string
  parentItemId?: string
}

export interface UpdateItemInput {
  name?: string
  subtype?: string
  description?: string
  location?: string
  status?: ItemStatus
  purchaseDate?: Date
  purchasePrice?: number
  serialNumber?: string
  warrantyExpiresAt?: Date
  coverPhotoUrl?: string
}
