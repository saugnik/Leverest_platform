import { NextRequest, NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';

type Params = { params: Promise<{ id: string }> };

function canApprove(role: string, isAdmin: boolean) {
  if (isAdmin) return true;
  return role === 'manager' || role === 'relation_manager' || role === 'engagement_manager';
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireProjectAccess(id);

    if (!canApprove(user.role, user.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { spocs, request_id } = body as {
      spocs?: Array<{ name: string; email: string; password: string; phone?: string; designation?: string }>;
      request_id?: string;
    };

    if (!spocs || !Array.isArray(spocs) || spocs.length === 0) {
      return NextResponse.json({ error: 'No SPOCs provided.' }, { status: 400 });
    }

    if (spocs.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 client emails are allowed per project.' }, { status: 400 });
    }

    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { getDynamicSpocs, addDynamicSpoc, createAccessToken, updateAccessRequest } = await import('@/lib/dynamic');
      const existingCount = getDynamicSpocs().filter(s => s.project_id === id).length;
      if (existingCount + spocs.length > 5) {
        return NextResponse.json({ error: 'Maximum 5 client emails are allowed per project.' }, { status: 400 });
      }

      const created = [];
      const accessLinks = [];

      for (const spoc of spocs) {
        const newId = `spoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        addDynamicSpoc({
          id: newId,
          project_id: id,
          name: spoc.name,
          email: spoc.email,
          phone: spoc.phone,
          designation: spoc.designation,
          password_hash: spoc.password,
          is_active: true,
          created_at: new Date().toISOString(),
        });
        const token = createAccessToken(newId, id, 72);
        accessLinks.push({ spoc_id: newId, token, expires_at: new Date(Date.now() + 72 * 3600_000).toISOString() });
        created.push({ id: newId, name: spoc.name, email: spoc.email, phone: spoc.phone, designation: spoc.designation });
      }

      if (request_id) {
        updateAccessRequest(request_id, { status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.email });
      }

      return NextResponse.json({ success: true, spocs: created, access_links: accessLinks });
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { count: existingCount } = await adminClient
      .from('client_spocs')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    if ((existingCount || 0) + spocs.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 client emails are allowed per project.' }, { status: 400 });
    }

    const bcrypt = await import('bcryptjs');
    const payload = await Promise.all(spocs.map(async (s) => ({
      project_id: id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      designation: s.designation,
      password_hash: await bcrypt.hash(s.password, 10),
      is_active: true,
    })));

    const { data: createdSpocs, error: insertError } = await adminClient
      .from('client_spocs')
      .insert(payload)
      .select('id, name, email, phone, designation, created_at');

    if (insertError) throw insertError;

    const accessLinks = (createdSpocs || []).map((spoc: { id: string }) => ({
      spoc_id: spoc.id,
      token: generateToken(),
      expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
    }));

    if (accessLinks.length) {
      const tokenRows = accessLinks.map((l) => ({
        spoc_id: l.spoc_id,
        token: l.token,
        expires_at: l.expires_at,
      }));
      const { error: tokenError } = await adminClient.from('client_access_tokens').insert(tokenRows);
      if (tokenError) throw tokenError;
    }

    if (request_id) {
      await adminClient
        .from('client_access_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.email })
        .eq('id', request_id)
        .eq('project_id', id);
    }

    return NextResponse.json({ success: true, spocs: createdSpocs || [], access_links: accessLinks });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (error.message === 'MAX_SPOCS_REACHED') {
      return NextResponse.json({ error: 'Maximum 5 client emails are allowed per project.' }, { status: 400 });
    }
    console.error('[POST /api/projects/[id]/spocs]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
