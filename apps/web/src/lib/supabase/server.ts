import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createSupabaseServerClient() {
  // E2E mock bypass — fake Supabase URL set in playwright.mock.config.ts webServer env
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http://localhost:54321')) {
    return {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'mock-user', email: 'e2e@wrenchly.test' } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient
  }

  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Read-only in Server Components — handled by middleware
          }
        },
      },
    }
  )
}
