import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomDomainLogService } from '@/server/domains/custom-domain/custom-domain-log.service'

const mockDomainRepo = {
  findById: vi.fn(),
  listLoggableFields: vi.fn(),
  findFieldWithConfig: vi.fn(),
  addLoggableField: vi.fn(),
  updateLoggableField: vi.fn(),
  archiveField: vi.fn(),
  reorderFields: vi.fn(),
  findEntryById: vi.fn(),
  findEntryByIdAndUserId: vi.fn(),
  listEntriesByItemId: vi.fn(),
  createEntry: vi.fn(),
  updateEntryRecordedAt: vi.fn(),
  applyEntryValueOps: vi.fn(),
  deleteEntry: vi.fn(),
  publishDomain: vi.fn(),
  listPublished: vi.fn(),
  cloneDomain: vi.fn(),
  findItemData: vi.fn(),
  listCharts: vi.fn(),
  findChartById: vi.fn(),
  createChart: vi.fn(),
  deleteChart: vi.fn(),
  reorderCharts: vi.fn(),
  listAllEntriesByItemId: vi.fn(),
}

const mockItemRepo = {
  findByIdAndUserId: vi.fn(),
}

const service = new CustomDomainLogService(mockDomainRepo as any, mockItemRepo as any)

beforeEach(() => vi.clearAllMocks())

const numberField = (overrides: Partial<any> = {}) => ({
  id: 'field-a',
  customDomainId: 'domain-1',
  key: 'weight',
  fieldType: 'NUMBER',
  options: [],
  required: false,
  fieldConfig: null,
  archivedAt: null,
  ...overrides,
})

describe('CustomDomainLogService: publish-lock', () => {
  it('rejects a field-structure mutation on a published domain', async () => {
    mockDomainRepo.findFieldWithConfig.mockResolvedValue(numberField())
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', isPublished: true, fields: [] })

    await expect(service.updateLoggableField('field-a', 'user-1', { name: 'Weight' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('allows a field-structure mutation on an unpublished domain', async () => {
    mockDomainRepo.findFieldWithConfig.mockResolvedValue(numberField())
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', isPublished: false, fields: [] })
    mockDomainRepo.updateLoggableField.mockResolvedValue({ id: 'field-a' })

    await service.updateLoggableField('field-a', 'user-1', { name: 'Weight' })
    expect(mockDomainRepo.updateLoggableField).toHaveBeenCalled()
  })

  it('does not block entry mutations on a published domain (sample-data editing must still work)', async () => {
    mockDomainRepo.findEntryByIdAndUserId.mockResolvedValue({
      id: 'entry-1',
      customDomainId: 'domain-1',
      values: [],
    })
    mockDomainRepo.listLoggableFields.mockResolvedValue([])
    mockDomainRepo.findEntryById.mockResolvedValue({ id: 'entry-1', values: [] })

    await service.updateEntry('entry-1', 'user-1', { recordedAt: new Date('2026-07-01') })
    expect(mockDomainRepo.updateEntryRecordedAt).toHaveBeenCalled()
  })
})

describe('CustomDomainLogService: publish', () => {
  it('rejects publishing a domain with zero loggable fields', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', fields: [] })
    mockDomainRepo.listLoggableFields.mockResolvedValue([])

    await expect(service.publish('domain-1', 'user-1')).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockDomainRepo.publishDomain).not.toHaveBeenCalled()
  })

  it('publishes a domain with at least one loggable field', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', fields: [] })
    mockDomainRepo.listLoggableFields.mockResolvedValue([numberField()])
    mockDomainRepo.publishDomain.mockResolvedValue({ id: 'domain-1', isPublished: true })

    await service.publish('domain-1', 'user-1')
    expect(mockDomainRepo.publishDomain).toHaveBeenCalledWith('domain-1')
  })
})

describe('CustomDomainLogService: import/clone', () => {
  it('rejects importing a domain that is not published+public', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', isPublished: false, isPublic: true })

    await expect(service.importDomain('domain-1', 'user-2')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockDomainRepo.cloneDomain).not.toHaveBeenCalled()
  })

  it('clones a published+public domain for the importer', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', isPublished: true, isPublic: true })
    mockDomainRepo.cloneDomain.mockResolvedValue({ id: 'domain-2', userId: 'user-2', sourceDomainId: 'domain-1' })

    const result = await service.importDomain('domain-1', 'user-2')
    expect(mockDomainRepo.cloneDomain).toHaveBeenCalledWith('domain-1', 'user-2')
    expect(result.sourceDomainId).toBe('domain-1')
  })
})

describe('CustomDomainLogService.createEntry', () => {
  it('throws NOT_FOUND when the item is not attached to a custom domain', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockDomainRepo.findItemData.mockResolvedValue(null)

    await expect(
      service.createEntry('item-1', 'user-1', { recordedAt: new Date(), values: {} })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'errors.custom_domain.not_attached' })
  })

  it('rejects the whole submission (writes nothing) when one field value is invalid', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockDomainRepo.findItemData.mockResolvedValue({ itemId: 'item-1', customDomainId: 'domain-1' })
    mockDomainRepo.listLoggableFields.mockResolvedValue([
      numberField({ id: 'field-a', key: 'weight', required: true }),
    ])

    await expect(
      service.createEntry('item-1', 'user-1', { recordedAt: new Date(), values: {} })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockDomainRepo.createEntry).not.toHaveBeenCalled()
  })

  it('only creates value rows for fields with a submitted value, skipping optional omitted ones', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockDomainRepo.findItemData.mockResolvedValue({ itemId: 'item-1', customDomainId: 'domain-1' })
    mockDomainRepo.listLoggableFields.mockResolvedValue([
      numberField({ id: 'field-a', key: 'weight', required: true }),
      numberField({ id: 'field-b', key: 'notes', fieldType: 'TEXT', required: false }),
    ])
    mockDomainRepo.createEntry.mockResolvedValue({ id: 'entry-1', values: [] })

    await service.createEntry('item-1', 'user-1', {
      recordedAt: new Date('2026-07-01'),
      values: { weight: 12 },
    })

    expect(mockDomainRepo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        values: [{ fieldId: 'field-a', valueNumber: 12 }],
      })
    )
  })
})

describe('CustomDomainLogService.updateEntry: sparse historical data', () => {
  it('fetching an old entry with fields A+B only shows no value for a field C added afterward, without erroring', async () => {
    mockDomainRepo.findEntryByIdAndUserId.mockResolvedValue({
      id: 'entry-1',
      customDomainId: 'domain-1',
      values: [
        { fieldId: 'field-a', field: { id: 'field-a', key: 'a', archivedAt: null } },
        { fieldId: 'field-b', field: { id: 'field-b', key: 'b', archivedAt: null } },
      ],
    })

    const entry = await mockDomainRepo.findEntryByIdAndUserId('entry-1', 'user-1')
    expect(entry.values.map((v: any) => v.fieldId)).toEqual(['field-a', 'field-b'])
    expect(entry.values.find((v: any) => v.fieldId === 'field-c')).toBeUndefined()
  })

  it('submitting a value for the newly added field C on that old entry creates a row for it, leaving A/B untouched', async () => {
    mockDomainRepo.findEntryByIdAndUserId.mockResolvedValue({
      id: 'entry-1',
      customDomainId: 'domain-1',
      values: [],
    })
    mockDomainRepo.listLoggableFields.mockResolvedValue([
      numberField({ id: 'field-c', key: 'c', required: false }),
    ])
    mockDomainRepo.findEntryById.mockResolvedValue({ id: 'entry-1', values: [] })

    await service.updateEntry('entry-1', 'user-1', { values: { c: 42 } })

    expect(mockDomainRepo.applyEntryValueOps).toHaveBeenCalledWith('entry-1', [
      { fieldId: 'field-c', action: 'set', value: { valueNumber: 42 } },
    ])
  })

  it('does not touch a value for a field absent from the submitted values object (e.g. an archived field)', async () => {
    mockDomainRepo.findEntryByIdAndUserId.mockResolvedValue({
      id: 'entry-1',
      customDomainId: 'domain-1',
      values: [],
    })
    // Only field-c is currently active/loggable -- field for an archived key would not appear here.
    mockDomainRepo.listLoggableFields.mockResolvedValue([numberField({ id: 'field-c', key: 'c' })])
    mockDomainRepo.findEntryById.mockResolvedValue({ id: 'entry-1', values: [] })

    // Submission doesn't mention "c" at all.
    await service.updateEntry('entry-1', 'user-1', { values: {} })

    expect(mockDomainRepo.applyEntryValueOps).toHaveBeenCalledWith('entry-1', [])
  })

  it('clears a value when its key is submitted but empty on a non-required field', async () => {
    mockDomainRepo.findEntryByIdAndUserId.mockResolvedValue({
      id: 'entry-1',
      customDomainId: 'domain-1',
      values: [],
    })
    mockDomainRepo.listLoggableFields.mockResolvedValue([
      numberField({ id: 'field-c', key: 'c', required: false }),
    ])
    mockDomainRepo.findEntryById.mockResolvedValue({ id: 'entry-1', values: [] })

    await service.updateEntry('entry-1', 'user-1', { values: { c: '' } })

    expect(mockDomainRepo.applyEntryValueOps).toHaveBeenCalledWith('entry-1', [
      { fieldId: 'field-c', action: 'clear' },
    ])
  })
})

describe('CustomDomainLogService.createChart', () => {
  it('rejects charting a non-numeric field', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', fields: [] })
    mockDomainRepo.findFieldWithConfig.mockResolvedValue(
      numberField({ id: 'field-a', fieldType: 'TEXT', loggable: true })
    )

    await expect(
      service.createChart('domain-1', 'user-1', { fieldId: 'field-a', name: 'X', chartType: 'LINE', aggregation: 'LATEST' })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'errors.custom_domain.chart_field_not_numeric' })
    expect(mockDomainRepo.createChart).not.toHaveBeenCalled()
  })

  it('rejects charting a non-loggable (Profile-only) field', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', fields: [] })
    mockDomainRepo.findFieldWithConfig.mockResolvedValue(
      numberField({ id: 'field-a', fieldType: 'NUMBER', loggable: false })
    )

    await expect(
      service.createChart('domain-1', 'user-1', { fieldId: 'field-a', name: 'X', chartType: 'LINE', aggregation: 'LATEST' })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'errors.custom_domain.chart_field_not_loggable' })
    expect(mockDomainRepo.createChart).not.toHaveBeenCalled()
  })

  it('creates a chart for a loggable numeric field, ordered after existing charts', async () => {
    mockDomainRepo.findById.mockResolvedValue({ id: 'domain-1', userId: 'user-1', fields: [] })
    mockDomainRepo.findFieldWithConfig.mockResolvedValue(
      numberField({ id: 'field-a', fieldType: 'NUMBER', loggable: true, archivedAt: null })
    )
    mockDomainRepo.listCharts.mockResolvedValue([{ id: 'chart-existing' }])
    mockDomainRepo.createChart.mockResolvedValue({ id: 'chart-1' })

    await service.createChart('domain-1', 'user-1', {
      fieldId: 'field-a',
      name: 'Distance over time',
      chartType: 'LINE',
      aggregation: 'LATEST',
    })

    expect(mockDomainRepo.createChart).toHaveBeenCalledWith('domain-1', {
      fieldId: 'field-a',
      name: 'Distance over time',
      chartType: 'LINE',
      aggregation: 'LATEST',
      order: 1,
    })
  })
})

describe('CustomDomainLogService.getStatistics', () => {
  it('computes trend/monthly/total/latest per chart from the item\'s logged entries', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockDomainRepo.findItemData.mockResolvedValue({ itemId: 'item-1', customDomainId: 'domain-1' })
    mockDomainRepo.listCharts.mockResolvedValue([
      {
        id: 'chart-1',
        fieldId: 'field-a',
        name: 'Distance',
        chartType: 'LINE',
        aggregation: 'SUM',
        field: { unit: 'km' },
      },
    ])
    mockDomainRepo.listAllEntriesByItemId.mockResolvedValue([
      { recordedAt: new Date('2026-07-01'), values: [{ fieldId: 'field-a', valueNumber: 5 }] },
      { recordedAt: new Date('2026-08-02'), values: [{ fieldId: 'field-a', valueNumber: 7 }] },
      { recordedAt: new Date('2026-08-10'), values: [{ fieldId: 'other-field', valueNumber: 99 }] },
    ])

    const result = await service.getStatistics('item-1', 'user-1')

    expect(result.entryCount).toBe(3)
    expect(result.charts).toHaveLength(1)
    const chart = result.charts[0]!
    expect(chart.total).toBe(12)
    expect(chart.latest).toBe(7)
    expect(chart.trend).toHaveLength(2)
    expect(chart.monthly).toEqual([
      { month: '2026-07', total: 5 },
      { month: '2026-08', total: 7 },
    ])
  })
})

describe('CustomDomainLogService: archived-field historical display', () => {
  it('listEntries returns archived fields too (includeArchived), so historical values for them remain visible', async () => {
    mockItemRepo.findByIdAndUserId.mockResolvedValue({ id: 'item-1' })
    mockDomainRepo.findItemData.mockResolvedValue({ itemId: 'item-1', customDomainId: 'domain-1' })
    mockDomainRepo.listLoggableFields.mockResolvedValue([
      numberField({ id: 'field-a', archivedAt: null }),
      numberField({ id: 'field-b', archivedAt: new Date('2026-01-01') }),
    ])
    mockDomainRepo.listEntriesByItemId.mockResolvedValue([])

    const result = await service.listEntries('item-1', 'user-1')

    expect(mockDomainRepo.listLoggableFields).toHaveBeenCalledWith('domain-1', true)
    expect(result.fields.some((f) => f.archivedAt !== null)).toBe(true)
  })
})
