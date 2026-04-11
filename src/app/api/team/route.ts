import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/team — List all users
export async function GET() {
  try {
    await requireAuth();

    // MOCK DATA FALLBACK
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const isMockMode = cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz' || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');
    
    if (isMockMode) {
      const { MOCK_USERS } = await import('@/lib/mock-data');
      return NextResponse.json({ members: MOCK_USERS });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role')
      .order('name');

    if (error) throw error;
    return NextResponse.json({ members: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/team — Add new team member (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(); void admin;
    const body = await request.json();
    const { email, name, role, employee_type, branch, is_admin } = body;

    if (!email || !name || !role || !employee_type || !branch) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!email.endsWith('@leverestfin.com')) {
      return NextResponse.json({ error: 'Email must be @leverestfin.com.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .insert({ email, name, role, employee_type, branch, is_admin: is_admin || false })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, member: data }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
