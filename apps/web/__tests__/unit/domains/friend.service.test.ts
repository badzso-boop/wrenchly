import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FriendService } from '@/server/domains/friend/friend.service'
import { FriendRequestStatus } from '@prisma/client'

const mockFriendRepo = {
  findById: vi.fn(),
  findBetween: vi.fn(),
  create: vi.fn(),
  reopenAsPending: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
  listFriends: vi.fn(),
  listPendingReceived: vi.fn(),
  listPendingSent: vi.fn(),
  searchByUsername: vi.fn(),
}

const service = new FriendService(mockFriendRepo as any)

beforeEach(() => vi.clearAllMocks())

describe('FriendService.sendRequest', () => {
  it('rejects a self-request', async () => {
    await expect(service.sendRequest('user-1', 'user-1')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'errors.friend.cannot_request_self',
    })
    expect(mockFriendRepo.findBetween).not.toHaveBeenCalled()
  })

  it('rejects when already friends', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.ACCEPTED })
    await expect(service.sendRequest('user-1', 'user-2')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'errors.friend.already_friends',
    })
  })

  it('rejects a duplicate pending request (requester side)', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.PENDING })
    await expect(service.sendRequest('user-1', 'user-2')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'errors.friend.request_already_pending',
    })
  })

  it('rejects a duplicate pending request found in the reverse direction', async () => {
    // findBetween already checks both directions internally; the service
    // just trusts whatever row it returns regardless of who requested whom.
    mockFriendRepo.findBetween.mockResolvedValue({
      id: 'r-1',
      requesterId: 'user-2',
      addresseeId: 'user-1',
      status: FriendRequestStatus.PENDING,
    })
    await expect(service.sendRequest('user-1', 'user-2')).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('reopens a DECLINED row as PENDING instead of creating a duplicate', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.DECLINED })
    mockFriendRepo.reopenAsPending.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.PENDING })

    const result = await service.sendRequest('user-1', 'user-2')

    expect(mockFriendRepo.reopenAsPending).toHaveBeenCalledWith('r-1', 'user-1', 'user-2')
    expect(mockFriendRepo.create).not.toHaveBeenCalled()
    expect(result.status).toBe(FriendRequestStatus.PENDING)
  })

  it('creates a fresh request when no row exists between the two users', async () => {
    mockFriendRepo.findBetween.mockResolvedValue(null)
    mockFriendRepo.create.mockResolvedValue({ id: 'r-2', status: FriendRequestStatus.PENDING })

    await service.sendRequest('user-1', 'user-2')

    expect(mockFriendRepo.create).toHaveBeenCalledWith('user-1', 'user-2')
  })
})

describe('FriendService.accept / decline', () => {
  it('accept: only the addressee can accept', async () => {
    mockFriendRepo.findById.mockResolvedValue({
      id: 'r-1', requesterId: 'user-1', addresseeId: 'user-2', status: FriendRequestStatus.PENDING,
    })
    await expect(service.accept('r-1', 'user-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'errors.friend.not_addressee',
    })
  })

  it('accept: succeeds for the addressee on a pending request', async () => {
    mockFriendRepo.findById.mockResolvedValue({
      id: 'r-1', requesterId: 'user-1', addresseeId: 'user-2', status: FriendRequestStatus.PENDING,
    })
    mockFriendRepo.updateStatus.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.ACCEPTED })

    const result = await service.accept('r-1', 'user-2')

    expect(mockFriendRepo.updateStatus).toHaveBeenCalledWith('r-1', FriendRequestStatus.ACCEPTED)
    expect(result.status).toBe(FriendRequestStatus.ACCEPTED)
  })

  it('accept: rejects a non-pending request', async () => {
    mockFriendRepo.findById.mockResolvedValue({
      id: 'r-1', requesterId: 'user-1', addresseeId: 'user-2', status: FriendRequestStatus.ACCEPTED,
    })
    await expect(service.accept('r-1', 'user-2')).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('decline: only the addressee can decline', async () => {
    mockFriendRepo.findById.mockResolvedValue({
      id: 'r-1', requesterId: 'user-1', addresseeId: 'user-2', status: FriendRequestStatus.PENDING,
    })
    await expect(service.decline('r-1', 'user-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'errors.friend.not_addressee',
    })
  })

  it('decline: succeeds for the addressee', async () => {
    mockFriendRepo.findById.mockResolvedValue({
      id: 'r-1', requesterId: 'user-1', addresseeId: 'user-2', status: FriendRequestStatus.PENDING,
    })
    mockFriendRepo.updateStatus.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.DECLINED })

    await service.decline('r-1', 'user-2')

    expect(mockFriendRepo.updateStatus).toHaveBeenCalledWith('r-1', FriendRequestStatus.DECLINED)
  })
})

describe('FriendService.remove (unfriend)', () => {
  it('deletes the row when accepted and involving the actor', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.ACCEPTED })

    await service.remove('user-1', 'user-2')

    expect(mockFriendRepo.delete).toHaveBeenCalledWith('r-1')
  })

  it('throws NOT_FOUND when not actually friends', async () => {
    mockFriendRepo.findBetween.mockResolvedValue(null)
    await expect(service.remove('user-1', 'user-2')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('throws NOT_FOUND when the row exists but is only PENDING', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ id: 'r-1', status: FriendRequestStatus.PENDING })
    await expect(service.remove('user-1', 'user-2')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('FriendService.areFriends', () => {
  it('true when an ACCEPTED row exists between the two users', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ status: FriendRequestStatus.ACCEPTED })
    expect(await service.areFriends('user-1', 'user-2')).toBe(true)
  })

  it('false when no row exists', async () => {
    mockFriendRepo.findBetween.mockResolvedValue(null)
    expect(await service.areFriends('user-1', 'user-2')).toBe(false)
  })

  it('false when the row is only PENDING', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ status: FriendRequestStatus.PENDING })
    expect(await service.areFriends('user-1', 'user-2')).toBe(false)
  })

  it('false when the row is DECLINED', async () => {
    mockFriendRepo.findBetween.mockResolvedValue({ status: FriendRequestStatus.DECLINED })
    expect(await service.areFriends('user-1', 'user-2')).toBe(false)
  })
})
