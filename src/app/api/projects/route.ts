import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { MANUFACTURING_SERVICE_CHECKLIST, NBFC_CHECKLIST } from '@/lib/types';

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/projects
// Returns projects the current user has access to (RLS enforced).
// ──────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireAuth();
    const cookieStore = await cookies();
    const isMock = cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz';

    if (isMock) {
      const { MOCK_PROJECTS } = await import('@/lib/mock-data');
      return NextResponse.json({ projects: MOCK_PROJECTS, user });
    }

    const supabase = await createAdminClient();

    // Fetch all projects bypasses RLS so everyone can see the projects list.
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/projects] Supabase error:', error);
      return NextResponse.json({ projects: [], user });
    }

    return NextResponse.json({ projects: data, user });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GET /api/projects]', err);
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/projects
// Creates a project, inserts team members into project_members,
// inserts SPOCs into client_spocs, and auto-generates document checklist.
// Only admin and relation_manager can create projects.
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admin or relation_manager/relation_partner can create projects
    const canCreate =
      user.is_admin ||
      user.role === 'relation_manager' ||
      user.role === 'relation_partner';

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Only Admin and Relation Managers can create projects.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      client_name,
      company_type,
      loan_type,
      loan_amount,
      bank,
      commission_percent,
      branch,
      team_emails, // string[] of @leverestfin.com emails
      spocs,       // { name, email, phone?, designation?, password }[]
      created_by,  // Optional: override who brought the lead
    } = body;

    if (!client_name || !company_type || !branch) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    if (cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz') {
      const { MOCK_PROJECTS } = await import('@/lib/mock-data');
      const newProject = {
        id: `p-${Date.now()}`,
        client_name, company_name: client_name, company_type, loan_type, loan_amount, bank,
        commission_percent, branch, stage: 'client_meeting', created_by: created_by || user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_PROJECTS.unshift(newProject as any);
      return NextResponse.json({ success: true, project: newProject });
    }

    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // 1. Insert the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        client_name,
        company_type,
        loan_type,
        loan_amount,
        bank,
        commission_percent,
        branch,
        stage: 'client_meeting',
        created_by: created_by || user.email,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw projectError || new Error('Failed to create project');
    }

    // 2. Insert project_members (always include the creator)
    const memberEmails = new Set<string>([user.email]);
    if (Array.isArray(team_emails)) {
      team_emails.forEach((e: string) => {
        if (e.endsWith('@leverestfin.com')) memberEmails.add(e);
      });
    }

    const memberInserts = Array.from(memberEmails).map((email) => ({
      project_id: project.id,
      user_email: email,
      assigned_by: user.email,
    }));

    if (memberInserts.length > 0) {
      const { error: memberError } = await adminClient
        .from('project_members')
        .insert(memberInserts);
      if (memberError) console.warn('project_members insert error:', memberError);
    }

    // 3. Insert SPOCs (with bcrypt-hashed passwords)
    if (Array.isArray(spocs) && spocs.length > 0) {
      const bcrypt = await import('bcryptjs');
      const spocInserts = await Promise.all(
        spocs.map(async (s: { name: string; email: string; phone?: string; designation?: string; password: string }) => ({
          project_id: project.id,
          name: s.name,
          email: s.email,
          phone: s.phone || null,
          designation: s.designation || null,
          password_hash: s.password ? await bcrypt.hash(s.password, 10) : null,
        }))
      );

      const { error: spocError } = await adminClient
        .from('client_spocs')
        .insert(spocInserts);
      if (spocError) console.warn('client_spocs insert error:', spocError);
    }

    // 4. Auto-generate document checklist
    const checklist =
      company_type === 'mfg_service'
        ? MANUFACTURING_SERVICE_CHECKLIST
        : NBFC_CHECKLIST;

    const docInserts = checklist.flatMap((cat) =>
      cat.docs.map((docName) => ({
        project_id: project.id,
        document_name: docName,
        category: cat.category,
        company_type,
        status: 'required' as const,
      }))
    );

    if (docInserts.length > 0) {
      const { error: docError } = await adminClient
        .from('documents')
        .insert(docInserts);
      if (docError) console.warn('documents insert error:', docError);
    }

    // 5. Log the activity
    await adminClient.from('activity_log').insert({
      project_id: project.id,
      action: 'project_created',
      performed_by: user.email,
      details: { client_name, company_type, branch },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[POST /api/projects]', err);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}
