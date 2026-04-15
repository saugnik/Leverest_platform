import { NextRequest, NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

function canApprove(role: string, isAdmin: boolean) {
  if (isAdmin) return true;
  return role === 'manager' || role === 'relation_manager' || role === 'engagement_manager';
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireProjectAccess(id);

    if (!canApprove(user.role, user.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { listAccessRequests } = await import('@/lib/dynamic');
      const requests = listAccessRequests(id);
      return NextResponse.json({ requests });
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { data, error } = await adminClient
      .from('client_access_requests')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[GET /api/projects/[id]/requests]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireProjectAccess(id);

    if (!canApprove(user.role, user.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { request_id, status } = body as { request_id?: string; status?: 'approved' | 'rejected' | 'pending' };

    if (!request_id || !status) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { updateAccessRequest } = await import('@/lib/dynamic');
      const updated = updateAccessRequest(request_id, {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email,
      });
      if (!updated) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
      return NextResponse.json({ success: true, request: updated });
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { data, error } = await adminClient
      .from('client_access_requests')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email,
      })
      .eq('id', request_id)
      .eq('project_id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, request: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[PATCH /api/projects/[id]/requests]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
