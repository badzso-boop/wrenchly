import { type PrismaClient, type FriendRequest, type User, FriendRequestStatus } from '@prisma/client'

type PublicUser = Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>

const PUBLIC_USER_SELECT = { id: true, name: true, username: true, avatarUrl: true } as const

export type FriendRequestWithUsers = FriendRequest & {
  requester: PublicUser
  addressee: PublicUser
}

export class FriendRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<FriendRequest | null> {
    return this.db.friendRequest.findUnique({ where: { id } })
  }

  /** The row between two users, in EITHER direction — friendship/pending state is undirected once it exists. */
  async findBetween(userIdA: string, userIdB: string): Promise<FriendRequest | null> {
    return this.db.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId: userIdA, addresseeId: userIdB },
          { requesterId: userIdB, addresseeId: userIdA },
        ],
      },
    })
  }

  async create(requesterId: string, addresseeId: string): Promise<FriendRequest> {
    return this.db.friendRequest.create({ data: { requesterId, addresseeId } })
  }

  /** Flips a DECLINED row back to PENDING for a fresh request, reversing direction to whoever is asking now. */
  async reopenAsPending(id: string, requesterId: string, addresseeId: string): Promise<FriendRequest> {
    return this.db.friendRequest.update({
      where: { id },
      data: { requesterId, addresseeId, status: FriendRequestStatus.PENDING, respondedAt: null },
    })
  }

  async updateStatus(id: string, status: FriendRequestStatus): Promise<FriendRequest> {
    return this.db.friendRequest.update({ where: { id }, data: { status, respondedAt: new Date() } })
  }

  async delete(id: string): Promise<void> {
    await this.db.friendRequest.delete({ where: { id } })
  }

  async listFriends(userId: string): Promise<FriendRequestWithUsers[]> {
    return this.db.friendRequest.findMany({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: { requester: { select: PUBLIC_USER_SELECT }, addressee: { select: PUBLIC_USER_SELECT } },
      orderBy: { respondedAt: 'desc' },
    })
  }

  async listPendingReceived(userId: string): Promise<FriendRequestWithUsers[]> {
    return this.db.friendRequest.findMany({
      where: { addresseeId: userId, status: FriendRequestStatus.PENDING },
      include: { requester: { select: PUBLIC_USER_SELECT }, addressee: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listPendingSent(userId: string): Promise<FriendRequestWithUsers[]> {
    return this.db.friendRequest.findMany({
      where: { requesterId: userId, status: FriendRequestStatus.PENDING },
      include: { requester: { select: PUBLIC_USER_SELECT }, addressee: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Case-insensitive username search, excluding the searcher and anyone already ACCEPTED/PENDING with them. */
  async searchByUsername(query: string, excludingUserId: string): Promise<PublicUser[]> {
    const related = await this.db.friendRequest.findMany({
      where: { OR: [{ requesterId: excludingUserId }, { addresseeId: excludingUserId }] },
      select: { requesterId: true, addresseeId: true },
    })
    const excludeIds = new Set<string>([excludingUserId])
    for (const r of related) {
      excludeIds.add(r.requesterId)
      excludeIds.add(r.addresseeId)
    }

    return this.db.user.findMany({
      where: {
        username: { contains: query.toLowerCase(), mode: 'insensitive' },
        id: { notIn: Array.from(excludeIds) },
      },
      select: PUBLIC_USER_SELECT,
      take: 20,
    })
  }
}
