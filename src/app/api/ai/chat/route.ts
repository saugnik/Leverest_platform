import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth, getSpoc } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { chatWithProject, ProjectContext } from '@/lib/ai/gemini';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { project_id, messages: [{role, content}], message }
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, messages = [], message } = body;

    if (!project_id || !message) {
      return NextResponse.json(
        { error: 'project_id and message are required.' },
        { status: 400 }
      );
    }

    // ── Auth: try internal user, then SPOC ──
    let userName = 'User';
    const spoc = await getSpoc();
    if (spoc) {
      userName = spoc.name;
    } else {
      try {
        const user = await requireAuth();
        userName = user.name || user.email;
      } catch {
        // In mock/dev mode, skip auth gracefully
      }
    }

    // ── Fetch project data for AI context ──
    let projectContext: ProjectContext;

    const cookieStore = await cookies();
    const isMockMode =
      cookieStore.get('sb-auth-token')?.value === 'mock-token-xyz' ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMockMode) {
      const {
        MOCK_PROJECTS,
        MOCK_DOCUMENTS,
        MOCK_QUERIES,
        MOCK_NOTES,
        MOCK_ACTIVITY_LOGS,
      } = await import('@/lib/mock-data');

      const project = MOCK_PROJECTS.find((p) => p.id === project_id);

      // If no project found in mock data, create a minimal context
      projectContext = {
        project: project || { id: project_id, client_name: 'Project', stage: 'lead_received', company_type: 'mfg_service' },
        documents: MOCK_DOCUMENTS.filter((d) => d.project_id === project_id),
        queries: MOCK_QUERIES.filter((q) => q.project_id === project_id),
        notes: MOCK_NOTES.filter((n) => n.project_id === project_id),
        activity: MOCK_ACTIVITY_LOGS.filter((a) => a.project_id === project_id),
        members: [],
        spocs: [],
      };
    } else {
      const supabase = await createClient();

      const [
        projectRes,
        docsRes,
        queriesRes,
        notesRes,
        activityRes,
        membersRes,
        spocsRes,
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', project_id).single(),
        supabase.from('documents').select('*').eq('project_id', project_id),
        supabase.from('queries').select('*').eq('project_id', project_id),
        supabase
          .from('internal_notes')
          .select('*')
          .eq('project_id', project_id),
        supabase
          .from('activity_log')
          .select('*')
          .eq('project_id', project_id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('project_members')
          .select('user_email')
          .eq('project_id', project_id),
        supabase
          .from('client_spocs')
          .select('name, email')
          .eq('project_id', project_id),
      ]);

      if (projectRes.error || !projectRes.data) {
        return NextResponse.json(
          { error: 'Project not found.' },
          { status: 404 }
        );
      }

      projectContext = {
        project: projectRes.data,
        documents: docsRes.data || [],
        queries: queriesRes.data || [],
        notes: notesRes.data || [],
        activity: activityRes.data || [],
        members: membersRes.data || [],
        spocs: spocsRes.data || [],
      };
    }

    // ── Chat with Gemini ──
    const chatHistory = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      content: m.content,
    }));

    const response = await chatWithProject(
      projectContext,
      chatHistory,
      message
    );

    return NextResponse.json({
      success: true,
      response,
      user: userName,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[POST /api/ai/chat]', err);
    return NextResponse.json(
      { error: error.message || 'AI service error. Please try again.' },
      { status: 500 }
    );
  }
}
