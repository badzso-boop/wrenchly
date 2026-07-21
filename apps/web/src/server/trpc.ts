import { initTRPC, TRPCError } from '@trpc/server'
import { type NextRequest } from 'next/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { auth } from '@/lib/auth/auth'
import { db } from '@/server/db'

export async function createTRPCContext(opts: { req: NextRequest }) {
  const { req } = opts

  // Handles both web (session cookie) and mobile (Authorization: Bearer <token>,
  // via the `bearer` plugin) the same way.
  const session = await auth.api.getSession({ headers: req.headers })

  return { db, userId: session?.user.id ?? null, req }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'errors.unauthorized' })
  }

  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

export const protectedProcedure = t.procedure.use(enforceAuth)
