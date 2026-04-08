import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/notes?project_id=xxx (internal only — never visible to clients)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(); void user;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    const supabase = await createClient();
    let query = supabase.from('internal_notes').select('*').order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ notes: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/notes — Add internal note
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { project_id, note } = body;

    if (!project_id || !note) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('internal_notes')
      .insert({ project_id, note, created_by: user.email })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, note: data }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
