import { NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/auth/spocs
// Returns all registered Client SPOCs (for the login name picker).
// In production, this would query the real DB. In dev, uses dynamic store.
// ──────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { getDynamicSpocs } = await import('@/lib/dynamic');
      const { getMergedProjects } = await import('@/lib/dynamic');

      const spocs = getDynamicSpocs().filter((s) => s.is_active);
      const projects = getMergedProjects();

      // Attach company name from the project
      const result = spocs.map((s) => {
        const proj = projects.find((p) => p.id === s.project_id);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          designation: s.designation || '',
          company_name: proj?.company_name || 'Unknown Company',
          project_id: s.project_id,
        };
      });

      return NextResponse.json({ spocs: result });
    }

    // Real DB path
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { data: spocs, error } = await adminClient
      .from('client_spocs')
      .select('id, name, email, designation, project_id, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Fetch project names
    const projectIds = [...new Set((spocs || []).map((s: { project_id: string }) => s.project_id))];
    const { data: projects } = await adminClient
      .from('projects')
      .select('id, company_name')
      .in('id', projectIds);

    const projectMap = new Map((projects || []).map((p: { id: string; company_name: string }) => [p.id, p.company_name]));

    const result = (spocs || []).map((s: { id: string; name: string; email: string; designation: string; project_id: string }) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      designation: s.designation || '',
      company_name: projectMap.get(s.project_id) || 'Unknown Company',
      project_id: s.project_id,
    }));

    return NextResponse.json({ spocs: result });
  } catch (err) {
    console.error('[/api/auth/spocs]', err);
    return NextResponse.json({ spocs: [] });
  }
}
