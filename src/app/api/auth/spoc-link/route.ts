import { NextRequest, NextResponse } from 'next/server';
import { buildSpocCookieValue, SPOC_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
    }

    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { readAccessToken, getDynamicSpocById } = await import('@/lib/dynamic');
      const access = readAccessToken(token);
      if (!access) {
        return NextResponse.json({ error: 'Invalid or expired access link.' }, { status: 400 });
      }
      const spoc = getDynamicSpocById(access.spoc_id);
      if (!spoc) {
        return NextResponse.json({ error: 'Access link is no longer valid.' }, { status: 400 });
      }
      const sessionPayload = {
        id: spoc.id,
        email: spoc.email,
        name: spoc.name,
        project_id: spoc.project_id,
        designation: spoc.designation,
      };
      const cookieValue = buildSpocCookieValue(sessionPayload);
      const response = NextResponse.json({ success: true, spoc: spoc });
      response.cookies.set(SPOC_COOKIE, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      });
      response.cookies.set('sb-auth-token', 'mock-token-xyz', { path: '/', maxAge: 60 * 60 * 8 });
      return response;
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { data, error } = await adminClient
      .from('client_access_tokens')
      .select('token, expires_at, client_spocs ( id, name, email, project_id, designation, created_at )')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid or expired access link.' }, { status: 400 });
    }

    if (new Date(data.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Access link has expired.' }, { status: 400 });
    }

    const spoc = (data as any).client_spocs;
    if (!spoc) {
      return NextResponse.json({ error: 'Access link is no longer valid.' }, { status: 400 });
    }

    const sessionPayload = {
      id: spoc.id,
      email: spoc.email,
      name: spoc.name,
      project_id: spoc.project_id,
      designation: spoc.designation,
    };

    const cookieValue = buildSpocCookieValue(sessionPayload);
    const response = NextResponse.json({ success: true, spoc });

    response.cookies.set(SPOC_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/spoc-link]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
