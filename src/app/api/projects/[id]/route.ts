import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // MOCK DATA FALLBACK
    const cookieStore = await cookies();
    const isMockMode = cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz' || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');
    if (isMockMode) {
      const { MOCK_PROJECTS, MOCK_DOCUMENTS, MOCK_QUERIES, MOCK_NOTES, MOCK_ACTIVITY_LOGS } = await import('@/lib/mock-data');
      const project = MOCK_PROJECTS.find(p => p.id === id);
      if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
      return NextResponse.json({
        project,
        members: project.assigned_team ? project.assigned_team.map(email => ({
          user_email: email,
          assigned_at: new Date().toISOString(),
          assigned_by: 'admin@leverestfin.com'
        })) : [{ user_email: 'admin@leverestfin.com', assigned_at: new Date().toISOString(), assigned_by: 'admin@leverestfin.com' }],
        spocs: [{ id: 'spoc-1', name: 'John Doe', email: 'spoc@client.com', phone: '', designation: '', created_at: new Date().toISOString() }],
        documents: MOCK_DOCUMENTS.filter(d => d.project_id === id),
        queries: MOCK_QUERIES.filter(q => q.project_id === id),

        notes: MOCK_NOTES.filter(n => n.project_id === id),
        activity: MOCK_ACTIVITY_LOGS.filter(a => a.project_id === id),
      });
    }

    const supabase = await createClient();

    const [projectRes, membersRes, spocsRes, docsRes, queriesRes, notesRes, activityRes] =
      await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('project_members').select('user_email, assigned_at, assigned_by').eq('project_id', id),
        supabase.from('client_spocs').select('id, name, email, phone, designation, created_at').eq('project_id', id),
        supabase.from('documents').select('*').eq('project_id', id).order('category'),
        supabase.from('queries').select('*').eq('project_id', id).order('created_at', { ascending: false }),
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
    const allowedFields = ['stage', 'commission_percent', 'loan_amount', 'loan_type', 'client_name'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0 && (!body.new_members || body.new_members.length === 0) && (!body.remove_members || body.remove_members.length === 0)) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    // MOCK DATA FALLBACK
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const isMockMode = cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz' || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');
    
    if (isMockMode) {
      // Mutate the mock data in memory so the new login session will see it
      const { MOCK_PROJECTS } = await import('@/lib/mock-data');
      const projectIdx = MOCK_PROJECTS.findIndex(p => p.id === id);
      if (projectIdx > -1) {
        if (!MOCK_PROJECTS[projectIdx].assigned_team) MOCK_PROJECTS[projectIdx].assigned_team = [];
        if (body.new_members && Array.isArray(body.new_members)) {
          MOCK_PROJECTS[projectIdx].assigned_team.push(...body.new_members);
        }
        if (body.remove_members && Array.isArray(body.remove_members)) {
          MOCK_PROJECTS[projectIdx].assigned_team = MOCK_PROJECTS[projectIdx].assigned_team.filter(email => !body.remove_members.includes(email));
        }
      }
      return NextResponse.json({ success: true, project: { id, ...updates } });
    }

    const supabase = await createClient();
    let data = null;

    if (Object.keys(updates).length > 0) {
      const { data: updateData, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      data = updateData;
    }

    // Add new members if provided
    if (body.new_members && Array.isArray(body.new_members) && body.new_members.length > 0) {
      for (const memberEmail of body.new_members) {
        await supabase.from('project_members').insert({
          project_id: id,
          user_email: memberEmail,
          assigned_by: user.email,
        });
      }
      
      await supabase.from('activity_log').insert({
        project_id: id,
        action: 'members_added',
        performed_by: user.email,
        details: { new_members: body.new_members },
      });
    }

    // Remove members if provided
    if (body.remove_members && Array.isArray(body.remove_members) && body.remove_members.length > 0) {
      for (const memberEmail of body.remove_members) {
        await supabase.from('project_members').delete().match({ project_id: id, user_email: memberEmail });
      }
      
      await supabase.from('activity_log').insert({
        project_id: id,
        action: 'members_removed',
        performed_by: user.email,
        details: { removed_members: body.remove_members },
      });
    }

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
