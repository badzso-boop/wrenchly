import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ItemCollaboratorService } from '@/server/domains/item/item-collaborator.service'
import { ItemCollaboratorStatus } from '@prisma/client'

const mockDb = {
  item: { findUnique: vi.fn() },
  itemCollaborator: { findUnique: vi.fn() },
}

const mockRepo = {
  findById: vi.fn(),
  findByItemAndUser: vi.fn(),
  create: vi.fn(),
  reopenAsPending: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
  listForItem: vi.fn(),
}

const mockFriendService = {
  areFriends: vi.fn(),
}

const service = new ItemCollaboratorService(mockDb as any, mockRepo as any, mockFriendService as any)

beforeEach(() => vi.clearAllMocks())

describe('ItemCollaboratorService.inviteCollaborator', () => {
  it('rejects when the inviter has no access to the item', async () => {
    mockDb.item.findUnique.mockResolvedValue(null)
    await expect(service.inviteCollaborator('item-1', 'inviter-1', 'target-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('rejects inviting the item owner themselves', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'inviter-1' })
    await expect(service.inviteCollaborator('item-1', 'inviter-1', 'inviter-1')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'errors.item_collaborator.already_owner',
    })
  })

  it('rejects when the target is not an accepted friend of the inviter', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'inviter-1' })
    mockFriendService.areFriends.mockResolvedValue(false)
    await expect(service.inviteCollaborator('item-1', 'inviter-1', 'target-1')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'errors.item_collaborator.not_a_friend',
    })
  })

  it('rejects when the target is already an ACCEPTED collaborator', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'inviter-1' })
    mockFriendService.areFriends.mockResolvedValue(true)
    mockRepo.findByItemAndUser.mockResolvedValue({ id: 'ic-1', status: ItemCollaboratorStatus.ACCEPTED })
    await expect(service.inviteCollaborator('item-1', 'inviter-1', 'target-1')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'errors.item_collaborator.already_collaborator',
    })
  })

  it('rejects a duplicate PENDING invite', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'inviter-1' })
    mockFriendService.areFriends.mockResolvedValue(true)
    mockRepo.findByItemAndUser.mockResolvedValue({ id: 'ic-1', status: ItemCollaboratorStatus.PENDING })
    await expect(service.inviteCollaborator('item-1', 'inviter-1', 'target-1')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'errors.item_collaborator.invite_already_pending',
    })
  })

  it('reopens a DECLINED invite instead of creating a duplicate', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'inviter-1' })
    mockFriendService.areFriends.mockResolvedValue(true)
    mockRepo.findByItemAndUser.mockResolvedValue({ id: 'ic-1', status: ItemCollaboratorStatus.DECLINED })
    mockRepo.reopenAsPending.mockResolvedValue({ id: 'ic-1', status: ItemCollaboratorStatus.PENDING })

    await service.inviteCollaborator('item-1', 'inviter-1', 'target-1')

    expect(mockRepo.reopenAsPending).toHaveBeenCalledWith('ic-1', 'inviter-1')
    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('creates a fresh PENDING invite when everything checks out', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'inviter-1' })
    mockFriendService.areFriends.mockResolvedValue(true)
    mockRepo.findByItemAndUser.mockResolvedValue(null)
    mockRepo.create.mockResolvedValue({ id: 'ic-1', status: ItemCollaboratorStatus.PENDING })

    await service.inviteCollaborator('item-1', 'inviter-1', 'target-1')

    expect(mockRepo.create).toHaveBeenCalledWith('item-1', 'target-1', 'inviter-1')
  })

  it('allows an ACCEPTED collaborator (not just the owner) to invite further collaborators', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue({
      itemId: 'item-1', userId: 'collab-1', status: ItemCollaboratorStatus.ACCEPTED,
    })
    mockFriendService.areFriends.mockResolvedValue(true)
    mockRepo.findByItemAndUser.mockResolvedValue(null)
    mockRepo.create.mockResolvedValue({ id: 'ic-2', status: ItemCollaboratorStatus.PENDING })

    await service.inviteCollaborator('item-1', 'collab-1', 'target-1')

    expect(mockRepo.create).toHaveBeenCalledWith('item-1', 'target-1', 'collab-1')
  })
})

describe('ItemCollaboratorService.acceptInvite / declineInvite', () => {
  it('accept: only the invited user can accept', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'ic-1', userId: 'target-1', status: ItemCollaboratorStatus.PENDING })
    await expect(service.acceptInvite('ic-1', 'someone-else')).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('accept: succeeds for the invited user', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'ic-1', userId: 'target-1', status: ItemCollaboratorStatus.PENDING })
    mockRepo.updateStatus.mockResolvedValue({ id: 'ic-1', status: ItemCollaboratorStatus.ACCEPTED })
    await service.acceptInvite('ic-1', 'target-1')
    expect(mockRepo.updateStatus).toHaveBeenCalledWith('ic-1', ItemCollaboratorStatus.ACCEPTED)
  })

  it('decline: only the invited user can decline', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'ic-1', userId: 'target-1', status: ItemCollaboratorStatus.PENDING })
    await expect(service.declineInvite('ic-1', 'someone-else')).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('ItemCollaboratorService.removeCollaborator', () => {
  it('the owner can remove any collaborator', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockRepo.findByItemAndUser.mockResolvedValue({ id: 'ic-1' })

    await service.removeCollaborator('item-1', 'owner-1', 'collab-1')

    expect(mockRepo.delete).toHaveBeenCalledWith('ic-1')
  })

  it('a collaborator can remove (leave) only themselves', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue({
      itemId: 'item-1', userId: 'collab-1', status: ItemCollaboratorStatus.ACCEPTED,
    })
    mockRepo.findByItemAndUser.mockResolvedValue({ id: 'ic-1' })

    await service.removeCollaborator('item-1', 'collab-1', 'collab-1')

    expect(mockRepo.delete).toHaveBeenCalledWith('ic-1')
  })

  it('a collaborator cannot remove a DIFFERENT collaborator', async () => {
    mockDb.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'owner-1' })
    mockDb.itemCollaborator.findUnique.mockResolvedValue({
      itemId: 'item-1', userId: 'collab-1', status: ItemCollaboratorStatus.ACCEPTED,
    })

    await expect(service.removeCollaborator('item-1', 'collab-1', 'collab-2')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'errors.item_collaborator.not_owner',
    })
    expect(mockRepo.delete).not.toHaveBeenCalled()
  })
})
