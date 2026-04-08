import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSpoc } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/banks?project_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    const supabase = await createClient();
    const spoc = await getSpoc();

    let query = supabase
      .from('bank_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (spoc) {
      query = query.eq('project_id', spoc.project_id);
    } else {
      await requireAuth();
      if (projectId) query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ banks: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/banks — Suggest a bank (internal only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { project_id, bank_name, interest_rate, processing_days, commission_percent, notes } = body;

    if (!project_id || !bank_name) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bank_suggestions')
      .insert({
        project_id,
        bank_name,
        interest_rate,
        processing_days,
        commission_percent,
        notes,
        is_selected: false,
        suggested_by: user.email,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify SPOCs
    const { data: spocs } = await supabase
      .from('client_spocs')
      .select('email')
      .eq('project_id', project_id);

    if (spocs && spocs.length > 0) {
      await supabase.from('notifications').insert(
        spocs.map((s) => ({
          user_email: s.email,
          project_id,
          title: 'New Bank Suggestion',
          message: `${bank_name} has been suggested for your project.`,
          is_read: false,
        }))
      );
    }

    await supabase.from('activity_log').insert({
      project_id,
      action: 'bank_suggested',
      performed_by: user.email,
      details: { bank_name, interest_rate },
    });

    return NextResponse.json({ success: true, bank: data }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/banks — SPOC selects a bank
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bank_id, project_id } = body;

    if (!bank_id || !project_id) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Determine who is selecting
    let selectorEmail: string;
    const spoc = await getSpoc();
    if (spoc) {
      if (spoc.project_id !== project_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      selectorEmail = spoc.email;
    } else {
      const user = await requireAuth();
      selectorEmail = user.email;
    }

    // Deselect all banks for this project, then select the chosen one
    await supabase.from('bank_suggestions').update({ is_selected: false }).eq('project_id', project_id);
    const { data, error } = await supabase
      .from('bank_suggestions')
      .update({ is_selected: true })
      .eq('id', bank_id)
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) throw error;

    // Notify Leverest team members
    const { data: members } = await supabase
      .from('project_members')
      .select('user_email')
      .eq('project_id', project_id);

    if (members && members.length > 0) {
      await supabase.from('notifications').insert(
        members.map((m) => ({
          user_email: m.user_email,
          project_id,
          title: 'Bank Selected by Client',
          message: `Client selected ${data.bank_name} for project ${project_id}.`,
          is_read: false,
        }))
      );
    }

    await supabase.from('activity_log').insert({
      project_id,
      action: 'bank_selected',
      performed_by: selectorEmail,
      details: { bank_id, bank_name: data.bank_name },
    });

    return NextResponse.json({ success: true, bank: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
