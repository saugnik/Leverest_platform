import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSpoc } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/documents?project_id=xxx
// Works for both internal users and SPOCs
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    const supabase = await createClient();

    // Try internal user first
    let authorizedProjectId: string | null = null;

    const spoc = await getSpoc();
    if (spoc) {
      // SPOC can only access their own project
      if (projectId && projectId !== spoc.project_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      authorizedProjectId = spoc.project_id;
    } else {
      const user = await requireAuth();
      authorizedProjectId = projectId || null;
      // RLS handles the rest for internal users
      void user;
    }

    const query = supabase
      .from('documents')
      .select('*')
      .order('category')
      .order('document_name');

    if (authorizedProjectId) {
      query.eq('project_id', authorizedProjectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ documents: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[GET /api/documents]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/documents — Upload / register a document
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, project_id, file_url, file_source } = body;

    if (!document_id || !project_id) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Determine who is uploading
    let uploaderEmail: string;
    const spoc = await getSpoc();
    if (spoc) {
      if (spoc.project_id !== project_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      uploaderEmail = spoc.email;
    } else {
      const user = await requireAuth();
      uploaderEmail = user.email;
    }

    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'received',
        file_url,
        file_source: file_source || 'manual',
        uploaded_at: new Date().toISOString(),
        uploaded_by: uploaderEmail,
      })
      .eq('id', document_id)
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      project_id,
      action: 'document_uploaded',
      performed_by: uploaderEmail,
      details: { document_id, document_name: data.document_name },
    });

    return NextResponse.json({ success: true, document: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[POST /api/documents]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/documents — Update document status
// ──────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { document_id, project_id, status, expiry_date } = body;

    if (!document_id || !status) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('documents')
      .update({ status, expiry_date })
      .eq('id', document_id)
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_log').insert({
      project_id,
      action: 'document_status_updated',
      performed_by: user.email,
      details: { document_id, status },
    });

    return NextResponse.json({ success: true, document: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[PATCH /api/documents]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
