export interface MaintenanceRecord {
  id: string
  itemId: string
  userId: string
  performedAt: Date
  title: string
  description: string | null
  category: string
  costTotal: number | null
  costLabor: number | null
  isDiy: boolean
  timeSpentMin: number | null
  odometerValue: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  parts?: Part[]
}

export interface Part {
  id: string
  maintenanceRecordId: string
  name: string
  category: string | null
  brand: string | null
  partNumber: string | null
  quantity: number
  unit: string
  unitPrice: number | null
  totalPrice: number | null
  supplier: string | null
  url: string | null
  notes: string | null
}

export interface CreateMaintenanceRecordInput {
  itemId: string
  performedAt: Date
  title: string
  category: string
  description?: string
  costLabor?: number
  isDiy?: boolean
  timeSpentMin?: number
  odometerValue?: number
  notes?: string
  parts?: CreatePartInput[]
}

export interface CreatePartInput {
  name: string
  category?: string
  brand?: string
  partNumber?: string
  quantity: number
  unit: string
  unitPrice?: number
  supplier?: string
  url?: string
  notes?: string
}

export interface UpdateMaintenanceRecordInput {
  performedAt?: Date
  title?: string
  category?: string
  description?: string
  costLabor?: number
  isDiy?: boolean
  timeSpentMin?: number
  odometerValue?: number
  notes?: string
}
