import { TRPCError } from '@trpc/server'
import { format } from 'date-fns'
import { type ReadingRepository } from './reading.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { getReadingMetrics, type MetricOption } from './reading.fields'
import { type ItemReading, type ItemType } from '@prisma/client'

export interface MetricStats {
  key: string
  label: string
  unit: string
  healthyMin?: number
  healthyMax?: number
  aggregation: 'latest' | 'sum'
  chartType: 'line' | 'bar-monthly'
  options?: MetricOption[]
  showMonthToDate?: boolean
  latest: number | null
  total: number
  monthToDate: number | null
  trend: { date: Date; value: number }[]
  monthly: { month: string; total: number }[]
}

export class ReadingService {
  constructor(
    private readingRepo: ReadingRepository,
    private itemRepo: ItemRepository
  ) {}

  async getById(id: string, userId: string): Promise<ItemReading> {
    const reading = await this.readingRepo.findByIdAndUserId(id, userId)
    if (!reading) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.reading.not_found' })
    return reading
  }

  async listByItemId(
    itemId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<ItemReading[]> {
    return this.readingRepo.findByItemId(itemId, userId, cursor, limit)
  }

  async create(
    userId: string,
    input: {
      itemId: string
      recordedAt: Date
      metrics: Record<string, number>
      notes?: string | null
    }
  ): Promise<ItemReading> {
    const item = await this.itemRepo.findByIdAndUserId(input.itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    this.assertValidMetricKeys(item.type, input.metrics)

    return this.readingRepo.create({
      userId,
      itemId: input.itemId,
      recordedAt: input.recordedAt,
      metrics: input.metrics,
      notes: input.notes,
    })
  }

  async update(
    id: string,
    userId: string,
    input: {
      recordedAt?: Date
      metrics?: Record<string, number>
      notes?: string | null
    }
  ): Promise<ItemReading> {
    const existing = await this.readingRepo.findByIdAndUserId(id, userId)
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.reading.not_found' })

    if (input.metrics) {
      const item = await this.itemRepo.findById(existing.itemId)
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })
      this.assertValidMetricKeys(item.type, input.metrics)
    }

    return this.readingRepo.update(id, input)
  }

  async delete(id: string, userId: string): Promise<void> {
    const reading = await this.readingRepo.findByIdAndUserId(id, userId)
    if (!reading) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.reading.not_found' })
    await this.readingRepo.delete(id)
  }

  async getStatistics(itemId: string, userId: string): Promise<{ metrics: MetricStats[]; readingCount: number }> {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const metricDefs = getReadingMetrics(item.type) ?? []
    const readings = await this.readingRepo.findAllByItemId(itemId, userId)
    const currentMonthKey = format(new Date(), 'yyyy-MM')

    const metrics: MetricStats[] = metricDefs.map((def) => {
      const trend = readings
        .map((r) => ({ date: r.recordedAt, value: (r.metrics as Record<string, number>)[def.key] }))
        .filter((p): p is { date: Date; value: number } => typeof p.value === 'number')

      const monthlyMap = new Map<string, number>()
      for (const p of trend) {
        const key = format(p.date, 'yyyy-MM')
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.value)
      }
      const monthly = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total }))

      const total = trend.reduce((sum, p) => sum + p.value, 0)

      return {
        key: def.key,
        label: def.label,
        unit: def.unit,
        healthyMin: def.healthyMin,
        healthyMax: def.healthyMax,
        aggregation: def.aggregation ?? 'latest',
        chartType: def.chartType ?? 'line',
        options: def.options,
        showMonthToDate: def.showMonthToDate,
        latest: trend.length > 0 ? trend[trend.length - 1]!.value : null,
        total,
        monthToDate: monthlyMap.get(currentMonthKey) ?? null,
        trend,
        monthly,
      }
    })

    return { metrics, readingCount: readings.length }
  }

  /** Metric keys are user-input-adjacent (chosen client-side from a per-type list), so the
   * server re-validates them against the item's own type rather than trusting the payload — a
   * client bug or a stale form shouldn't be able to write metrics that don't belong to this item type. */
  private assertValidMetricKeys(itemType: ItemType, metrics: Record<string, number>): void {
    const allowedKeys = new Set((getReadingMetrics(itemType) ?? []).map((m) => m.key))
    const invalidKeys = Object.keys(metrics).filter((k) => !allowedKeys.has(k))
    if (invalidKeys.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `errors.reading.invalid_metric_keys:${invalidKeys.join(',')}`,
      })
    }
  }
}
