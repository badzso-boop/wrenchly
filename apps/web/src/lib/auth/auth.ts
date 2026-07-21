import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { bearer } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/server/db'
import { env } from '@/env'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    // Reuse the existing `avatarUrl` column instead of adding a new `image` column.
    fields: { image: 'avatarUrl' },
  },
  // `bearer` lets the mobile app authenticate via `Authorization: Bearer <session token>`
  // instead of cookies. `nextCookies` must stay last — it makes sign-in/sign-up route
  // handlers set the session cookie automatically on the Next.js response.
  plugins: [bearer(), nextCookies()],
})
