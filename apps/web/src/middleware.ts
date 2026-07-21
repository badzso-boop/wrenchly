import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const PROTECTED_PREFIXES = ['/dashboard', '/items', '/inventory', '/notifications', '/settings']
const AUTH_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  // E2E mock bypass — header is set by setupTrpcMocks() on every request
  if (request.headers.get('x-e2e-bypass') === 'wrenchly-e2e') {
    return NextResponse.next()
  }

  // Cheap cookie-presence check only — Edge middleware can't hit the DB. Pages
  // re-verify the real session server-side via getServerSession() (defense in depth).
  const hasSessionCookie = !!getSessionCookie(request)
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PATHS.includes(pathname)

  if (!hasSessionCookie && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
