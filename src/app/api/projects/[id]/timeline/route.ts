import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/projects/[id]/timeline
// Returns all FMS timeline steps and checkins for a project
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;

    const supabase = await createClient();

    // Fetch timeline steps
    const { data: steps, error: stepsError } = await supabase
      .from('fms_timeline_steps')
      .select('*')
      .eq('project_id', projectId);

    if (stepsError) throw stepsError;

    // Fetch checkins
    const { data: checkins, error: checkinsError } = await supabase
      .from('fms_timeline_checkins')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (checkinsError) throw checkinsError;

    return NextResponse.json({ steps, checkins });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GET /api/projects/[id]/timeline]', err);
    return NextResponse.json({ error: 'Failed to fetch timeline.' }, { status: 500 });
  }
}
