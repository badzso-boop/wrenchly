import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { FuelUpRepository } from './fuel-up.repository'
import { FuelUpService } from './fuel-up.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

function buildService(db: PrismaClient) {
  const repo = new FuelUpRepository(db)
  const itemRepo = new ItemRepository(db)
  return new FuelUpService(repo, itemRepo)
}

export const fuelUpRouter = createTRPCRouter({
  listByItemId: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => buildService(ctx.db).listByItemId(input.itemId, ctx.userId)),

  listAssignableTrips: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => buildService(ctx.db).listAssignableTrips(input.itemId, ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        occurredAt: z.coerce.date(),
        quantity: z.number().positive(),
        unit: z.string().min(1).max(20).default('liter'),
        isFullTank: z.boolean().default(true),
        pricePerUnit: z.number().positive(),
        currency: z.string().min(1).max(10).default('HUF'),
        fuelType: z.string().max(50).optional(),
        station: z.string().max(200).optional(),
        notes: z.string().max(1000).optional(),
        tripIds: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => buildService(ctx.db).create(ctx.userId, input)),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        occurredAt: z.coerce.date().optional(),
        quantity: z.number().positive().optional(),
        unit: z.string().min(1).max(20).optional(),
        isFullTank: z.boolean().optional(),
        pricePerUnit: z.number().positive().optional(),
        currency: z.string().min(1).max(10).optional(),
        fuelType: z.string().max(50).nullable().optional(),
        station: z.string().max(200).nullable().optional(),
        notes: z.string().max(1000).nullable().optional(),
        tripIds: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input
      return buildService(ctx.db).update(id, ctx.userId, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await buildService(ctx.db).delete(input.id, ctx.userId)
      return { success: true }
    }),
})
