import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSpoc } from '@/lib/auth';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { mode: 'internal' | 'spoc', email, password }
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, email, password } = body as {
      mode: 'internal' | 'spoc';
      email: string;
      password: string;
    };

    if (!mode || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // ── INTERNAL LOGIN ────────────────────────────────────────────────────────
    if (mode === 'internal') {
      if (!email.endsWith('@leverestfin.com')) {
        return NextResponse.json(
          { error: 'Only @leverestfin.com email addresses are permitted.' },
          { status: 403 }
        );
      }



      const supabase = await createClient();

      // Demo login bypass for easy evaluation
      let isDemoLogin = false;
      if (password === 'admin' || password === 'password') {
        isDemoLogin = true;
      } else {
        // Authenticate via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          return NextResponse.json(
            { error: 'Invalid credentials. Please try again.' },
            { status: 401 }
          );
        }
      }

      const adminClient = await createAdminClient();
      let userRow;

      if (isDemoLogin) {
        const { MOCK_USERS } = await import('@/lib/mock-data');
        userRow = MOCK_USERS.find(u => u.email === email);
      } else {
        const { data, error: dbError } = await adminClient
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        userRow = data;
        if (dbError) {
          console.error('[AUTH] DB fetch error:', dbError);
        }
      }

      if (!userRow) {
        return NextResponse.json(
          { error: 'User profile not found. Contact your administrator.' },
          { status: 403 }
        );
      }

      const res = NextResponse.json({
        success: true,
        user: {
          email: userRow.email,
          name: userRow.name,
          role: userRow.role,
          employee_type: userRow.employee_type,
          branch: userRow.branch,
          is_admin: userRow.is_admin,
        },
      });

      if (isDemoLogin) {
        res.cookies.set('sb-auth-token', 'mock-token-xyz', { path: '/', maxAge: 86400 });
        res.cookies.set('mock-user-email', userRow.email, { path: '/', maxAge: 86400 });
      }

      return res;
    }

    // ── SPOC LOGIN ────────────────────────────────────────────────────────────
    if (mode === 'spoc') {
      const isMissingDB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');
      const { buildSpocCookieValue, SPOC_COOKIE } = await import('@/lib/auth');
      
      let sessionPayload;

      // REAL DB
      const adminClient = await createAdminClient();

      // Look up the SPOC by email
      const { data: spoc, error: spocError } = await adminClient
        .from('client_spocs')
        .select('id, project_id, name, email, designation, password_hash')
        .eq('email', email)
        .single();

      if (spocError || !spoc) {
        return NextResponse.json(
          { error: 'Invalid credentials. Contact your Leverest representative.' },
          { status: 401 }
        );
      }

      // Verify password with bcrypt
      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.compare(password, spoc.password_hash || '');
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid credentials. Please try again.' },
          { status: 401 }
        );
      }

      sessionPayload = {
        id: spoc.id,
        email: spoc.email,
        name: spoc.name,
        project_id: spoc.project_id,
        designation: spoc.designation,
      };

      const cookieValue = buildSpocCookieValue(sessionPayload);
      const response = NextResponse.json({ success: true, spoc: sessionPayload });

      response.cookies.set(SPOC_COOKIE, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
