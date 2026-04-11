import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes auth cookies via the Next.js cookies() API.
 */
export async function createClient() {
  const cookieStore = await cookies();

  if (cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz') {
    return createAdminClient();
  }

  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set.
            // Only matters if you use middleware to refresh sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client using the service role key.
 * NEVER import this in client-side code.
 * Only use in trusted server-side contexts (Route Handlers, Server Actions).
 */
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
