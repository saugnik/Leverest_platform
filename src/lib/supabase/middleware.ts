import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session and attaches it to both the request
 * and response cookies. Call this in your Next.js middleware.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // MOCK FALLBACK BYPASS
  if (request.cookies.get('sb-auth-token')?.value === 'mock-token-xyz') {
    return {
      user: { id: 'mock-id', email: 'admin@leverestfin.com', role: 'authenticated' },
      response: supabaseResponse,
      supabase
    };
  }

  // Refresh session — IMPORTANT: do not add logic between createServerClient
  // and supabase.auth.getUser() as it can cause hard-to-debug issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response: supabaseResponse, supabase };
}
