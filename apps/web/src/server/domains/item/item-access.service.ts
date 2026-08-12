import { type PrismaClient, type Item, ItemCollaboratorStatus } from '@prisma/client'

export type ItemAccessRole = 'owner' | 'collaborator'

export interface ItemAccess {
  item: Item
  role: ItemAccessRole
}

/**
 * The single authorization gate for every item-scoped domain (maintenance,
 * trip, fuel-up, reading, printjob, custom-domain, household-finance,
 * cooking, favorite-meal, reminder, inventory, and item itself). An item's
 * child records store their own `userId` too, but that column means "who
 * created this specific record" (attribution) — it must NEVER be used as an
 * access-control check once collaborators exist. Access is always: owner, OR
 * an ACCEPTED ItemCollaborator row. PENDING/DECLINED collaborators get
 * nothing.
 */
export async function resolveItemAccess(
  db: PrismaClient,
  itemId: string,
  userId: string
): Promise<ItemAccess | null> {
  const item = await db.item.findUnique({ where: { id: itemId } })
  if (!item) return null

  if (item.userId === userId) return { item, role: 'owner' }

  const collaborator = await db.itemCollaborator.findUnique({
    where: { itemId_userId: { itemId, userId } },
  })
  if (collaborator?.status === ItemCollaboratorStatus.ACCEPTED) {
    return { item, role: 'collaborator' }
  }

  return null
}

/** Owner's own item ids UNION item ids where userId has an ACCEPTED ItemCollaborator row. */
export async function getAccessibleItemIds(db: PrismaClient, userId: string): Promise<string[]> {
  const [owned, collaborations] = await Promise.all([
    db.item.findMany({ where: { userId }, select: { id: true } }),
    db.itemCollaborator.findMany({
      where: { userId, status: ItemCollaboratorStatus.ACCEPTED },
      select: { itemId: true },
    }),
  ])
  const ids = new Set<string>(owned.map((i) => i.id))
  for (const c of collaborations) ids.add(c.itemId)
  return Array.from(ids)
}
