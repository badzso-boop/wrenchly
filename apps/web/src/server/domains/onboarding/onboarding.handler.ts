import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { OnboardingRepository } from './onboarding.repository'
import { OnboardingService } from './onboarding.service'

export const onboardingRouter = createTRPCRouter({
  getState: protectedProcedure.query(({ ctx }) => {
    const service = new OnboardingService(new OnboardingRepository(ctx.db))
    return service.getState(ctx.userId)
  }),

  updateStep: protectedProcedure
    .input(
      z.object({
        currentStep: z.string(),
        selectedHobbies: z.array(z.string()),
        stepData: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const service = new OnboardingService(new OnboardingRepository(ctx.db))
      return service.updateStep(ctx.userId, input)
    }),

  complete: protectedProcedure
    .input(z.object({ selectedHobbies: z.array(z.string()) }))
    .mutation(({ ctx, input }) => {
      const service = new OnboardingService(new OnboardingRepository(ctx.db))
      return service.complete(ctx.userId, input.selectedHobbies)
    }),
})
