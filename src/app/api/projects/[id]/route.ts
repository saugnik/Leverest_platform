import { NextRequest, NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/projects/[id]
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireProjectAccess(id);

    const supabase = await createClient();

    const [projectRes, membersRes, spocsRes, docsRes, queriesRes, banksRes, notesRes, activityRes] =
      await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('project_members').select('user_email, assigned_at, assigned_by').eq('project_id', id),
        supabase.from('client_spocs').select('id, name, email, phone, designation, created_at').eq('project_id', id),
        supabase.from('documents').select('*').eq('project_id', id).order('category'),
        supabase.from('queries').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('bank_suggestions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('internal_notes').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(20),
      ]);

    if (projectRes.error || !projectRes.data) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({
      project: projectRes.data,
      members: membersRes.data || [],
      spocs: spocsRes.data || [],
      documents: docsRes.data || [],
      queries: queriesRes.data || [],
      banks: banksRes.data || [],
      notes: notesRes.data || [],
      activity: activityRes.data || [],
    });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[GET /api/projects/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/[id]
// Update stage, bank, commission_percent, etc.
// ──────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireProjectAccess(id);

    const body = await request.json();
    const allowedFields = ['stage', 'bank', 'commission_percent', 'loan_amount', 'loan_type', 'client_name'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await supabase.from('activity_log').insert({
      project_id: id,
      action: 'project_updated',
      performed_by: user.email,
      details: updates,
    });

    return NextResponse.json({ success: true, project: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[PATCH /api/projects/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
