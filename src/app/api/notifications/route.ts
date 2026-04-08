import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSpoc } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications — Get notifications for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const spoc = await getSpoc();

    let userEmail: string;
    if (spoc) {
      userEmail = spoc.email;
    } else {
      const user = await requireAuth();
      userEmail = user.email;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ notifications: data });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const spoc = await getSpoc();

    let userEmail: string;
    if (spoc) {
      userEmail = spoc.email;
    } else {
      const user = await requireAuth();
      userEmail = user.email;
    }

    const body = await request.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_email', userEmail)
        .eq('is_read', false);
    } else if (notification_id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_email', userEmail);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
