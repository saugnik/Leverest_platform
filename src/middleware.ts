import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getSpocFromRequest } from '@/lib/auth';

/**
 * Route classification:
 * - Public:   / (login page)
 * - Internal: /dashboard/**, /api/** (team only, @leverestfin.com)
 * - Client:   /client/** (SPOC only, cookie session)
 */

const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/auth/logout'];
const CLIENT_PATHS = ['/client'];
const INTERNAL_PATHS = ['/dashboard', '/api/projects', '/api/documents', '/api/queries', '/api/banks', '/api/notes', '/api/team', '/api/notifications'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isClientPath(pathname: string) {
  return CLIENT_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isInternalPath(pathname: string) {
  return INTERNAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and static files
  if (
    isPublic(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Client (SPOC) routes ──────────────────────────────────────────────────
  if (isClientPath(pathname)) {
    const spoc = getSpocFromRequest(request);
    if (!spoc) {
      return NextResponse.redirect(new URL('/?mode=client', request.url));
    }
    return NextResponse.next();
  }

  // ── Internal (Leverest team) routes ───────────────────────────────────────
  if (isInternalPath(pathname)) {
    // updateSession refreshes the Supabase token and returns the user
    const { user, response } = await updateSession(request);

    if (!user) {
      return NextResponse.redirect(new URL('/?mode=team', request.url));
    }

    // Enforce @leverestfin.com domain at the edge
    if (!user.email?.endsWith('@leverestfin.com')) {
      const redirectResponse = NextResponse.redirect(new URL('/?mode=team&error=domain', request.url));
      // Clear invalid session
      redirectResponse.cookies.delete('sb-access-token');
      redirectResponse.cookies.delete('sb-refresh-token');
      return redirectResponse;
    }

    return response;
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
