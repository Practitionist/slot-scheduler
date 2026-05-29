import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Public: the landing page (exact '/') and everything under /auth and /api/auth.
const PUBLIC_PREFIXES = ['/auth', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  const session = getSessionCookie(request);
  if (!session) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
