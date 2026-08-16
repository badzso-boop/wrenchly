import { TRPCError } from '@trpc/server'
import { FriendRequestStatus, type FriendRequest } from '@prisma/client'
import { type FriendRepository, type FriendRequestWithUsers } from './friend.repository'

export class FriendService {
  constructor(private friendRepo: FriendRepository) {}

  async areFriends(userIdA: string, userIdB: string): Promise<boolean> {
    const row = await this.friendRepo.findBetween(userIdA, userIdB)
    return row?.status === FriendRequestStatus.ACCEPTED
  }

  async sendRequest(requesterId: string, addresseeId: string): Promise<FriendRequest> {
    if (requesterId === addresseeId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.friend.cannot_request_self' })
    }

    const existing = await this.friendRepo.findBetween(requesterId, addresseeId)
    if (existing) {
      if (existing.status === FriendRequestStatus.ACCEPTED) {
        throw new TRPCError({ code: 'CONFLICT', message: 'errors.friend.already_friends' })
      }
      if (existing.status === FriendRequestStatus.PENDING) {
        throw new TRPCError({ code: 'CONFLICT', message: 'errors.friend.request_already_pending' })
      }
      // DECLINED is terminal for the row but not for the relationship — a
      // fresh request reopens the SAME row (reversed to the new requester)
      // rather than erroring or duplicating (@@unique only covers one
      // direction, so a duplicate row for the reverse direction IS possible
      // in the schema, but we deliberately avoid ever creating one).
      return this.friendRepo.reopenAsPending(existing.id, requesterId, addresseeId)
    }

    return this.friendRepo.create(requesterId, addresseeId)
  }

  async accept(requestId: string, actingUserId: string): Promise<FriendRequest> {
    const request = await this.friendRepo.findById(requestId)
    if (!request) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.friend.request_not_found' })
    if (request.addresseeId !== actingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.friend.not_addressee' })
    }
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.friend.request_not_pending' })
    }
    return this.friendRepo.updateStatus(requestId, FriendRequestStatus.ACCEPTED)
  }

  async decline(requestId: string, actingUserId: string): Promise<FriendRequest> {
    const request = await this.friendRepo.findById(requestId)
    if (!request) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.friend.request_not_found' })
    if (request.addresseeId !== actingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.friend.not_addressee' })
    }
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.friend.request_not_pending' })
    }
    return this.friendRepo.updateStatus(requestId, FriendRequestStatus.DECLINED)
  }

  /** Cancel a still-pending request you sent — same terminal effect as a decline, but by the requester. */
  async cancel(requestId: string, actingUserId: string): Promise<FriendRequest> {
    const request = await this.friendRepo.findById(requestId)
    if (!request) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.friend.request_not_found' })
    if (request.requesterId !== actingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.friend.not_requester' })
    }
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.friend.request_not_pending' })
    }
    await this.friendRepo.delete(requestId)
    return request
  }

  /** Unfriend by either side — deletes the row so a fresh request can be sent later. */
  async remove(actingUserId: string, friendUserId: string): Promise<void> {
    const row = await this.friendRepo.findBetween(actingUserId, friendUserId)
    if (!row || row.status !== FriendRequestStatus.ACCEPTED) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.friend.not_friends' })
    }
    await this.friendRepo.delete(row.id)
  }

  async listFriends(userId: string): Promise<FriendRequestWithUsers[]> {
    return this.friendRepo.listFriends(userId)
  }

  async listPendingReceived(userId: string): Promise<FriendRequestWithUsers[]> {
    return this.friendRepo.listPendingReceived(userId)
  }

  async listPendingSent(userId: string): Promise<FriendRequestWithUsers[]> {
    return this.friendRepo.listPendingSent(userId)
  }

  async search(query: string, userId: string) {
    const trimmed = query.trim()
    if (trimmed.length === 0) return []
    return this.friendRepo.searchByUsername(trimmed, userId)
  }
}
