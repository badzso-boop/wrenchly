import { initTRPC, TRPCError } from '@trpc/server'
import { type NextRequest } from 'next/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/server/db'

let ratelimit: Ratelimit | null = null

function getRatelimit() {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, '1 m'),
    })
  }
  return ratelimit
}

export async function createTRPCContext(opts: { req: NextRequest }) {
  const { req } = opts

  let userId: string | null = null

  // Mobile: Bearer token in Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser(token)
    userId = data.user?.id ?? null
  } else {
    // Web: cookie-based session — always use getUser() not getSession()
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? null
  }

  return { db, userId, req }
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

  // Rate limiting per user
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const { success } = await getRatelimit().limit(ctx.userId)
    if (!success) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'errors.rate_limit_exceeded' })
    }
  }

  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

export const protectedProcedure = t.procedure.use(enforceAuth)
