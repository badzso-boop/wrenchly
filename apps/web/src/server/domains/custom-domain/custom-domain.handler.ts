import { z } from 'zod'
import { FieldType } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { CustomDomainRepository } from './custom-domain.repository'
import { CustomDomainService } from './custom-domain.service'
import { ItemRepository } from '@/server/domains/item/item.repository'

export const customDomainRouter = createTRPCRouter({
  listMine: protectedProcedure.query(({ ctx }) => {
    const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
    return service.listMine(ctx.userId)
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100), icon: z.string().max(10).optional() }))
    .mutation(({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      return service.create(ctx.userId, input)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      await service.delete(input.id, ctx.userId)
      return { success: true }
    }),

  setMaintenanceLogEnabled: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      await service.setMaintenanceLogEnabled(input.id, ctx.userId, input.enabled)
      return { success: true }
    }),

  addField: protectedProcedure
    .input(
      z.object({
        customDomainId: z.string(),
        name: z.string().min(1).max(100),
        fieldType: z.nativeEnum(FieldType),
        unit: z.string().max(20).optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { customDomainId, ...data } = input
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      return service.addField(customDomainId, ctx.userId, data)
    }),

  removeField: protectedProcedure
    .input(z.object({ fieldId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      await service.removeField(input.fieldId, ctx.userId)
      return { success: true }
    }),

  getItemData: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      return service.getItemData(input.itemId, ctx.userId)
    }),

  attachItem: protectedProcedure
    .input(z.object({ itemId: z.string(), customDomainId: z.string() }))
    .mutation(({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      return service.attachItem(input.itemId, ctx.userId, input.customDomainId)
    }),

  upsertItemData: protectedProcedure
    .input(z.object({ itemId: z.string(), data: z.record(z.string(), z.unknown()) }))
    .mutation(({ ctx, input }) => {
      const service = new CustomDomainService(new CustomDomainRepository(ctx.db), new ItemRepository(ctx.db))
      return service.upsertItemData(input.itemId, ctx.userId, input.data)
    }),
})
