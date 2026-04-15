import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';

type Params = { params: Promise<{ id: string }> };

function canApprove(role: string, isAdmin: boolean) {
  if (isAdmin) return true;
  return role === 'manager' || role === 'relation_manager' || role === 'engagement_manager';
}

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireProjectAccess(id);

    if (!canApprove(user.role, user.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ttlHours = 168; // 7 days
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString();

    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { createProjectInvite } = await import('@/lib/dynamic');
      const token = createProjectInvite(id, ttlHours);
      return NextResponse.json({ token, expires_at: expiresAt });
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();
    const token = generateToken();

    const { error } = await adminClient.from('project_invites').insert({
      project_id: id,
      token,
      expires_at: expiresAt,
      created_by: user.email,
    });

    if (error) throw error;

    return NextResponse.json({ token, expires_at: expiresAt });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[POST /api/projects/[id]/invite]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
