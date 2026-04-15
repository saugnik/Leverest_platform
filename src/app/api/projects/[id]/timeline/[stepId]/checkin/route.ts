import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/projects/[id]/timeline/[stepId]/checkin
// Adds a check-in note to a FMS timeline step and logs activity
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: projectId, stepId } = await params;
    const { note } = await request.json();

    if (!note || typeof note !== 'string' || !note.trim()) {
      return NextResponse.json({ error: 'Note is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Insert check-in
    const { data, error: insertError } = await supabase
      .from('fms_timeline_checkins')
      .insert({
        project_id: projectId,
        step_id: stepId,
        note: note.trim(),
        created_by: user.email,
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // Log activity
    await supabase
      .from('activity_log')
      .insert({
        project_id: projectId,
        action: `Check-in added to step: ${stepId}`,
        performed_by: user.email,
        details: {
          step_id: stepId,
          note: note.trim(),
        },
      });

    return NextResponse.json({ success: true, checkin: data }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[POST /api/projects/[id]/timeline/[stepId]/checkin]', err);
    return NextResponse.json({ error: 'Failed to add check-in.' }, { status: 500 });
  }
}
