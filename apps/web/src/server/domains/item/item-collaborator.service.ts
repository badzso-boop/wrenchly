import { TRPCError } from '@trpc/server'
import { type PrismaClient, type ItemCollaborator, ItemCollaboratorStatus } from '@prisma/client'
import { type ItemCollaboratorRepository, type ItemCollaboratorWithUser } from './item-collaborator.repository'
import { resolveItemAccess, hasAnyCollaborationRelationship } from './item-access.service'
import { FriendRepository } from '@/server/domains/friend/friend.repository'
import { FriendService } from '@/server/domains/friend/friend.service'

export class ItemCollaboratorService {
  private friendService: FriendService

  constructor(
    private db: PrismaClient,
    private repo: ItemCollaboratorRepository,
    friendService?: FriendService
  ) {
    this.friendService = friendService ?? new FriendService(new FriendRepository(db))
  }

  async inviteCollaborator(
    itemId: string,
    invitedById: string,
    targetUserId: string
  ): Promise<ItemCollaborator> {
    const access = await resolveItemAccess(this.db, itemId, invitedById)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

    if (targetUserId === access.item.userId) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.item_collaborator.already_owner' })
    }

    const areFriends = await this.friendService.areFriends(invitedById, targetUserId)
    if (!areFriends) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.item_collaborator.not_a_friend' })
    }

    const existing = await this.repo.findByItemAndUser(itemId, targetUserId)
    if (existing) {
      if (existing.status === ItemCollaboratorStatus.ACCEPTED) {
        throw new TRPCError({ code: 'CONFLICT', message: 'errors.item_collaborator.already_collaborator' })
      }
      if (existing.status === ItemCollaboratorStatus.PENDING) {
        throw new TRPCError({ code: 'CONFLICT', message: 'errors.item_collaborator.invite_already_pending' })
      }
      // DECLINED — reopen the same row rather than duplicating.
      return this.repo.reopenAsPending(existing.id, invitedById)
    }

    return this.repo.create(itemId, targetUserId, invitedById)
  }

  async acceptInvite(id: string, actingUserId: string): Promise<ItemCollaborator> {
    const row = await this.repo.findById(id)
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item_collaborator.invite_not_found' })
    if (row.userId !== actingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item_collaborator.not_invitee' })
    }
    if (row.status !== ItemCollaboratorStatus.PENDING) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.item_collaborator.invite_not_pending' })
    }
    return this.repo.updateStatus(id, ItemCollaboratorStatus.ACCEPTED)
  }

  async declineInvite(id: string, actingUserId: string): Promise<ItemCollaborator> {
    const row = await this.repo.findById(id)
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item_collaborator.invite_not_found' })
    if (row.userId !== actingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item_collaborator.not_invitee' })
    }
    if (row.status !== ItemCollaboratorStatus.PENDING) {
      throw new TRPCError({ code: 'CONFLICT', message: 'errors.item_collaborator.invite_not_pending' })
    }
    return this.repo.updateStatus(id, ItemCollaboratorStatus.DECLINED)
  }

  /** Owner can remove any collaborator; a collaborator can only remove (leave) themselves. */
  async removeCollaborator(itemId: string, actingUserId: string, targetUserId: string): Promise<void> {
    const access = await resolveItemAccess(this.db, itemId, actingUserId)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

    const isSelfLeave = actingUserId === targetUserId
    if (access.role !== 'owner' && !isSelfLeave) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item_collaborator.not_owner' })
    }

    const row = await this.repo.findByItemAndUser(itemId, targetUserId)
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item_collaborator.invite_not_found' })
    await this.repo.delete(row.id)
  }

  /** Deliberately gated by hasAnyCollaborationRelationship, not
   * resolveItemAccess: a PENDING invitee must be able to see this list (it's
   * where they accept/decline their own invite) even though they don't have
   * real item access yet. See that helper's docstring for why. */
  async listForItem(itemId: string, requestingUserId: string): Promise<ItemCollaboratorWithUser[]> {
    const allowed = await hasAnyCollaborationRelationship(this.db, itemId, requestingUserId)
    if (!allowed) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })
    return this.repo.listForItem(itemId)
  }

  /** Minimal item info (id + name only) for the collaborators page header —
   * deliberately NOT full item detail (that stays behind resolveItemAccess
   * via item.getById), gated the same way as listForItem so a PENDING
   * invitee can see what item they were invited to before accepting. */
  async getItemSummary(
    itemId: string,
    requestingUserId: string
  ): Promise<{ id: string; name: string; userId: string }> {
    const allowed = await hasAnyCollaborationRelationship(this.db, itemId, requestingUserId)
    if (!allowed) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })
    const item = await this.db.item.findUniqueOrThrow({
      where: { id: itemId },
      select: { id: true, name: true, userId: true },
    })
    return item
  }

  /** Everyone eligible to be attributed as "who paid/earned" on this item: the
   * owner plus every ACCEPTED collaborator — used by household-finance's
   * paidByUserId picker. */
  async listPayers(itemId: string, requestingUserId: string): Promise<{ id: string; name: string }[]> {
    const access = await resolveItemAccess(this.db, itemId, requestingUserId)
    if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'errors.item.no_access' })

    const [owner, collaborators] = await Promise.all([
      this.db.user.findUniqueOrThrow({ where: { id: access.item.userId }, select: { id: true, name: true } }),
      this.repo.listForItem(itemId),
    ])
    const accepted = collaborators
      .filter((c) => c.status === ItemCollaboratorStatus.ACCEPTED)
      .map((c) => ({ id: c.user.id, name: c.user.name }))

    return [owner, ...accepted]
  }
}
