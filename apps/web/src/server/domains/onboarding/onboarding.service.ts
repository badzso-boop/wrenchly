import { type OnboardingRepository } from './onboarding.repository'

export class OnboardingService {
  constructor(private repo: OnboardingRepository) {}

  getState(userId: string) {
    return this.repo.findByUserId(userId)
  }

  updateStep(
    userId: string,
    input: { currentStep: string; selectedHobbies: string[]; stepData?: Record<string, unknown> }
  ) {
    return this.repo.upsertStep(userId, input)
  }

  complete(userId: string, selectedHobbies: string[]) {
    return this.repo.complete(userId, selectedHobbies)
  }
}
