import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SPOC_COOKIE } from '@/lib/auth';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Clears all sessions: Supabase auth + SPOC cookie
// ──────────────────────────────────────────────────────────────────────────────
export async function POST() {
  try {
    // Sign out from Supabase (internal users)
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });

    // Clear the SPOC session cookie
    response.cookies.delete(SPOC_COOKIE);

    return response;
  } catch (err) {
    console.error('[/api/auth/logout]', err);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
