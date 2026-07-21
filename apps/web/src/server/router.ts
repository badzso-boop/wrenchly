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
import { onboardingRouter } from '@/server/domains/onboarding/onboarding.handler'

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
  onboarding: onboardingRouter,
})

export type AppRouter = typeof appRouter
