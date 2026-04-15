import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/[id]/timeline/[stepId]
// Updates a FMS timeline step status and logs activity
// ──────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: projectId, stepId } = await params;
    const { status } = await request.json();

    if (!status || !['not_started', 'in_progress', 'completed', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Get or create the step
    let { data: step, error: fetchError } = await supabase
      .from('fms_timeline_steps')
      .select('*')
      .eq('project_id', projectId)
      .eq('step_id', stepId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const updateData: any = {
      status,
      updated_at: now,
      updated_by: user.email,
    };

    // Set started_at if transitioning to in_progress
    if (status === 'in_progress' && !step?.started_at) {
      updateData.started_at = now;
    }

    // Set completed_at if transitioning to completed
    if (status === 'completed' && !step?.completed_at) {
      updateData.completed_at = now;
    }

    // Clear times if going back to not_started
    if (status === 'not_started') {
      updateData.started_at = null;
      updateData.completed_at = null;
    }

    if (step) {
      // Update existing step
      const { error: updateError } = await supabase
        .from('fms_timeline_steps')
        .update(updateData)
        .eq('id', step.id);

      if (updateError) throw updateError;
    } else {
      // Create new step
      const { error: insertError } = await supabase
        .from('fms_timeline_steps')
        .insert({
          project_id: projectId,
          step_id: stepId,
          ...updateData,
        });

      if (insertError) throw insertError;
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert({
        project_id: projectId,
        action: `Timeline step updated: ${stepId}`,
        performed_by: user.email,
        details: {
          step_id: stepId,
          new_status: status,
          previous_status: step?.status,
          started_at: updateData.started_at,
          completed_at: updateData.completed_at,
        },
      });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[PATCH /api/projects/[id]/timeline/[stepId]]', err);
    return NextResponse.json({ error: 'Failed to update timeline step.' }, { status: 500 });
  }
}
