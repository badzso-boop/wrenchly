import type { PrismaClient } from '@prisma/client'

export interface SimilarMealName {
  name: string
  similarity: number
}

// Similarity threshold for pg_trgm's similarity() (0-1 scale): 0.3 is the commonly-cited
// default in Postgres docs/practice — low enough to catch typo/accent variants ("Rantott hus"
// vs "Rántott hús") and plural/suffix drift ("Carbonara" vs "Carbonarát"), high enough to avoid
// flagging genuinely unrelated short names as false positives.
const SIMILARITY_THRESHOLD = 0.3
const MAX_CANDIDATES = 5

// Shared by both the cooking-log and favorite-meal domains — a new meal name is checked against
// the union of distinct names already used in EITHER table for this Home item, so "Rántott hús"
// saved as a favorite doesn't collide with a cooking-log entry of the same name (or vice versa).
export async function findSimilarMealNames(
  db: PrismaClient,
  itemId: string,
  name: string,
  limit = MAX_CANDIDATES
): Promise<SimilarMealName[]> {
  const rows = await db.$queryRaw<{ name: string; similarity: number }[]>`
    SELECT name, similarity(name, ${name}) AS similarity
    FROM (
      SELECT DISTINCT name FROM cooking_log_entries WHERE "itemId" = ${itemId}
      UNION
      SELECT DISTINCT name FROM favorite_meals WHERE "itemId" = ${itemId}
    ) AS existing_names
    WHERE similarity(name, ${name}) > ${SIMILARITY_THRESHOLD}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `
  return rows.map((r) => ({ name: r.name, similarity: Number(r.similarity) }))
}
