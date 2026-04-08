import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSpoc } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/queries?project_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    const supabase = await createClient();
    const spoc = await getSpoc();

    let query = supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (spoc) {
      // SPOC only sees their project's queries
      query = query.eq('project_id', spoc.project_id);
    } else {
      await requireAuth();
      if (projectId) query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ queries: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/queries — Raise a query
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { project_id, title, description, source } = body;

    if (!project_id || !title || !description || !source) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('queries')
      .insert({ project_id, title, description, source, raised_by: user.email, status: 'open' })
      .select()
      .single();

    if (error) throw error;

    // Notify SPOCs of this project
    const { data: spocs } = await supabase
      .from('client_spocs')
      .select('email, name')
      .eq('project_id', project_id);

    if (spocs && spocs.length > 0) {
      const notifInserts = spocs.map((s) => ({
        user_email: s.email,
        project_id,
        title: 'New Query from Leverest',
        message: title,
        is_read: false,
      }));
      await supabase.from('notifications').insert(notifInserts);
    }

    await supabase.from('activity_log').insert({
      project_id,
      action: 'query_raised',
      performed_by: user.email,
      details: { title, source },
    });

    return NextResponse.json({ success: true, query: data }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/queries — Resolve a query
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { query_id, project_id } = body;

    if (!query_id) return NextResponse.json({ error: 'Missing query_id.' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('queries')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', query_id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_log').insert({
      project_id: project_id || data.project_id,
      action: 'query_resolved',
      performed_by: user.email,
      details: { query_id },
    });

    return NextResponse.json({ success: true, query: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
