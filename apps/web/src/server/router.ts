import { createTRPCRouter } from '@/server/trpc'
import { itemRouter } from '@/server/domains/item/item.handler'
import { maintenanceRouter } from '@/server/domains/maintenance/maintenance.handler'
import { reminderRouter } from '@/server/domains/reminder/reminder.handler'
import { vehicleRouter } from '@/server/domains/vehicle/vehicle.handler'
import { notificationRouter } from '@/server/domains/notification/notification.handler'
import { userRouter } from '@/server/domains/user/user.handler'
import { inventoryRouter } from '@/server/domains/inventory/inventory.handler'
import { profileRouter } from '@/server/domains/profile/profile.handler'
import { customDomainRouter } from '@/server/domains/custom-domain/custom-domain.handler'
import { customDomainLogRouter } from '@/server/domains/custom-domain/custom-domain-log.handler'
import { onboardingRouter } from '@/server/domains/onboarding/onboarding.handler'
import { shareRouter } from '@/server/domains/share/share.handler'
import { tripRouter } from '@/server/domains/trip/trip.handler'
import { readingRouter } from '@/server/domains/reading/reading.handler'
import { printJobRouter } from '@/server/domains/printjob/printjob.handler'
import { householdFinanceRouter } from '@/server/domains/household-finance/household-finance.handler'
import { cookingRouter } from '@/server/domains/cooking/cooking.handler'
import { favoriteMealRouter } from '@/server/domains/favorite-meal/favorite-meal.handler'
import { fuelUpRouter } from '@/server/domains/fuel-up/fuel-up.handler'
import { friendRouter } from '@/server/domains/friend/friend.handler'
import { itemCollaboratorRouter } from '@/server/domains/item/item-collaborator.handler'

export const appRouter = createTRPCRouter({
  item: itemRouter,
  maintenance: maintenanceRouter,
  reminder: reminderRouter,
  vehicle: vehicleRouter,
  notification: notificationRouter,
  user: userRouter,
  inventory: inventoryRouter,
  profile: profileRouter,
  customDomain: customDomainRouter,
  customDomainLog: customDomainLogRouter,
  onboarding: onboardingRouter,
  share: shareRouter,
  trip: tripRouter,
  reading: readingRouter,
  printJob: printJobRouter,
  householdFinance: householdFinanceRouter,
  cooking: cookingRouter,
  favoriteMeal: favoriteMealRouter,
  fuelUp: fuelUpRouter,
  friend: friendRouter,
  itemCollaborator: itemCollaboratorRouter,
})

export type AppRouter = typeof appRouter
