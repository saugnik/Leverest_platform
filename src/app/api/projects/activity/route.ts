import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/projects/activity?ids=id1,id2&limit=10
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!idsParam) {
      return NextResponse.json({ logs: [] });
    }

    const projectIds = idsParam.split(',').filter(Boolean);
    if (projectIds.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ logs: data || [] });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GET /api/projects/activity]', err);
    return NextResponse.json({ error: 'Failed to fetch activity logs.' }, { status: 500 });
  }
}
