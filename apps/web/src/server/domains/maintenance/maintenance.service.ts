import { TRPCError } from '@trpc/server'
import { type MaintenanceRepository } from './maintenance.repository'
import { type MaintenanceRecord, type Part } from '@prisma/client'

type MaintenanceRecordWithParts = MaintenanceRecord & { parts: Part[] }

function calculateCostTotal(parts: Array<{ quantity: number; unitPrice?: number | null }>): number {
  return parts.reduce((sum, p) => sum + p.quantity * (p.unitPrice ?? 0), 0)
}

export class MaintenanceService {
  constructor(private maintenanceRepo: MaintenanceRepository) {}

  async getById(id: string, userId: string): Promise<MaintenanceRecordWithParts> {
    const record = await this.maintenanceRepo.findByIdAndUserId(id, userId)
    if (!record) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.maintenance.not_found' })
    return record
  }

  async listByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<MaintenanceRecordWithParts[]> {
    return this.maintenanceRepo.findByItemId(itemId, userId, cursor, limit)
  }

  async create(
    userId: string,
    input: {
      itemId: string
      title: string
      category: string
      performedAt: Date
      odometerValue?: number | null
      notes?: string | null
      parts?: Array<{
        name: string
        category?: string | null
        quantity: number
        unit: string
        unitPrice?: number | null
      }>
    }
  ): Promise<MaintenanceRecordWithParts> {
    const parts = input.parts ?? []
    const costTotal = calculateCostTotal(parts)
    const partsWithTotal = parts.map((p) => ({
      ...p,
      totalPrice: p.quantity * (p.unitPrice ?? 0),
    }))
    return this.maintenanceRepo.create({
      userId,
      ...input,
      costTotal,
      parts: partsWithTotal,
    })
  }

  async update(
    id: string,
    userId: string,
    input: {
      title?: string
      category?: string
      performedAt?: Date
      odometerValue?: number | null
      notes?: string | null
      parts?: Array<{
        name: string
        category?: string | null
        quantity: number
        unit: string
        unitPrice?: number | null
      }>
    }
  ): Promise<MaintenanceRecordWithParts> {
    const record = await this.maintenanceRepo.findByIdAndUserId(id, userId)
    if (!record) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.maintenance.not_found' })

    const { parts, ...rest } = input
    if (!parts) return this.maintenanceRepo.update(id, rest)

    const costTotal = calculateCostTotal(parts)
    const partsWithTotal = parts.map((p) => ({
      ...p,
      totalPrice: p.quantity * (p.unitPrice ?? 0),
    }))
    return this.maintenanceRepo.update(id, { ...rest, costTotal, parts: partsWithTotal })
  }

  async delete(id: string, userId: string): Promise<void> {
    const record = await this.maintenanceRepo.findByIdAndUserId(id, userId)
    if (!record) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.maintenance.not_found' })
    await this.maintenanceRepo.delete(id)
  }

  async getTotalCost(itemId: string): Promise<number> {
    return this.maintenanceRepo.sumCostByItemId(itemId)
  }
}
