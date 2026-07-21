import { type PrismaClient, type OnboardingState, Prisma } from '@prisma/client'

export class OnboardingRepository {
  constructor(private db: PrismaClient) {}

  async findByUserId(userId: string): Promise<OnboardingState | null> {
    return this.db.onboardingState.findUnique({ where: { userId } })
  }

  async upsertStep(
    userId: string,
    data: { currentStep: string; selectedHobbies: string[]; stepData?: Record<string, unknown> }
  ): Promise<OnboardingState> {
    return this.db.onboardingState.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: data.currentStep,
        selectedHobbies: data.selectedHobbies,
        stepData: (data.stepData ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        currentStep: data.currentStep,
        selectedHobbies: data.selectedHobbies,
        ...(data.stepData ? { stepData: data.stepData as Prisma.InputJsonValue } : {}),
      },
    })
  }

  async complete(userId: string, selectedHobbies: string[]): Promise<OnboardingState> {
    return this.db.onboardingState.upsert({
      where: { userId },
      create: { userId, selectedHobbies, completedAt: new Date() },
      update: { selectedHobbies, completedAt: new Date() },
    })
  }
}
