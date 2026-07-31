import { z } from 'zod'
import { FieldType } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { CustomDomainRepository } from './custom-domain.repository'
import { CustomDomainLogService } from './custom-domain-log.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

const fieldConfigInput = z
  .object({
    minValue: z.number().optional().nullable(),
    maxValue: z.number().optional().nullable(),
    decimalPlaces: z.number().int().optional().nullable(),
    maxLength: z.number().int().optional().nullable(),
    helpText: z.string().max(500).optional().nullable(),
  })
  .optional()
  .nullable()

function makeService(db: import('@prisma/client').PrismaClient) {
  return new CustomDomainLogService(new CustomDomainRepository(db), new ItemRepository(db))
}

export const customDomainLogRouter = createTRPCRouter({
  addLoggableField: protectedProcedure
    .input(
      z.object({
        customDomainId: z.string(),
        name: z.string().min(1).max(100),
        fieldType: z.nativeEnum(FieldType),
        unit: z.string().max(20).optional().nullable(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        widthCols: z.union([z.literal(1), z.literal(2)]),
        config: fieldConfigInput,
      })
    )
    .mutation(({ ctx, input }) => {
      const { customDomainId, ...data } = input
      return makeService(ctx.db).addLoggableField(customDomainId, ctx.userId, data)
    }),

  updateLoggableField: protectedProcedure
    .input(
      z.object({
        fieldId: z.string(),
        name: z.string().min(1).max(100).optional(),
        unit: z.string().max(20).optional().nullable(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        widthCols: z.union([z.literal(1), z.literal(2)]).optional(),
        config: fieldConfigInput,
      })
    )
    .mutation(({ ctx, input }) => {
      const { fieldId, ...data } = input
      return makeService(ctx.db).updateLoggableField(fieldId, ctx.userId, data)
    }),

  archiveField: protectedProcedure
    .input(z.object({ fieldId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await makeService(ctx.db).archiveField(input.fieldId, ctx.userId)
      return { success: true }
    }),

  reorderFields: protectedProcedure
    .input(z.object({ customDomainId: z.string(), orderedFieldIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await makeService(ctx.db).reorderFields(input.customDomainId, ctx.userId, input.orderedFieldIds)
      return { success: true }
    }),

  publish: protectedProcedure
    .input(z.object({ customDomainId: z.string() }))
    .mutation(({ ctx, input }) => makeService(ctx.db).publish(input.customDomainId, ctx.userId)),

  listStore: protectedProcedure.query(({ ctx }) => makeService(ctx.db).listStore()),

  importDomain: protectedProcedure
    .input(z.object({ sourceDomainId: z.string() }))
    .mutation(({ ctx, input }) => makeService(ctx.db).importDomain(input.sourceDomainId, ctx.userId)),

  listEntries: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => makeService(ctx.db).listEntries(input.itemId, ctx.userId)),

  createEntry: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        recordedAt: z.coerce.date(),
        values: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(({ ctx, input }) =>
      makeService(ctx.db).createEntry(input.itemId, ctx.userId, {
        recordedAt: input.recordedAt,
        values: input.values,
      })
    ),

  updateEntry: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        recordedAt: z.coerce.date().optional(),
        values: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { entryId, ...data } = input
      return makeService(ctx.db).updateEntry(entryId, ctx.userId, data)
    }),

  deleteEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await makeService(ctx.db).deleteEntry(input.entryId, ctx.userId)
      return { success: true }
    }),
})
