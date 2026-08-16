import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveItemAccess, getAccessibleItemIds } from '@/server/domains/item/item-access.service'
import { ItemCollaboratorStatus } from '@prisma/client'

const mockDb = {
  item: { findUnique: vi.fn(), findMany: vi.fn() },
  itemCollaborator: { findUnique: vi.fn(), findMany: vi.fn() },
}

beforeEach(() => vi.clearAllMocks())

describe('resolveItemAccess', () => {
  it('returns null when the item does not exist', async () => {
    mockDb.item.findUnique.mockResolvedValue(null)
    const result = await resolveItemAccess(mockDb as any, 'item-1', 'user-1')
    expect(result).toBeNull()
    expect(mockDb.itemCollaborator.findUnique).not.toHaveBeenCalled()
  })

  it('grants "owner" when userId matches the item owner', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    const result = await resolveItemAccess(mockDb as any, 'item-1', 'owner-1')
    expect(result).toEqual({ item: { id: 'item-1', userId: 'owner-1' }, role: 'owner' })
    expect(mockDb.itemCollaborator.findUnique).not.toHaveBeenCalled()
  })

  it('grants "collaborator" for an ACCEPTED ItemCollaborator row', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue({
      itemId: 'item-1', userId: 'collab-1', status: ItemCollaboratorStatus.ACCEPTED,
    })
    const result = await resolveItemAccess(mockDb as any, 'item-1', 'collab-1')
    expect(result?.role).toBe('collaborator')
  })

  it('denies a PENDING collaborator', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue({
      itemId: 'item-1', userId: 'collab-1', status: ItemCollaboratorStatus.PENDING,
    })
    const result = await resolveItemAccess(mockDb as any, 'item-1', 'collab-1')
    expect(result).toBeNull()
  })

  it('denies a DECLINED collaborator', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue({
      itemId: 'item-1', userId: 'collab-1', status: ItemCollaboratorStatus.DECLINED,
    })
    const result = await resolveItemAccess(mockDb as any, 'item-1', 'collab-1')
    expect(result).toBeNull()
  })

  it('denies a completely unrelated user', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue(null)
    const result = await resolveItemAccess(mockDb as any, 'item-1', 'stranger-1')
    expect(result).toBeNull()
  })
})

describe('getAccessibleItemIds', () => {
  it('unions owned items with ACCEPTED collaboration item ids, de-duplicated', async () => {
    mockDb.item.findMany.mockResolvedValue([{ id: 'item-1' }, { id: 'item-2' }])
    mockDb.itemCollaborator.findMany.mockResolvedValue([{ itemId: 'item-2' }, { itemId: 'item-3' }])

    const ids = await getAccessibleItemIds(mockDb as any, 'user-1')

    expect(new Set(ids)).toEqual(new Set(['item-1', 'item-2', 'item-3']))
    expect(mockDb.itemCollaborator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: ItemCollaboratorStatus.ACCEPTED }) })
    )
  })

  it('returns only owned items when there are no collaborations', async () => {
    mockDb.item.findMany.mockResolvedValue([{ id: 'item-1' }])
    mockDb.itemCollaborator.findMany.mockResolvedValue([])

    const ids = await getAccessibleItemIds(mockDb as any, 'user-1')

    expect(ids).toEqual(['item-1'])
  })
})
