import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, email, message } = body as {
      token?: string;
      name?: string;
      email?: string;
      message?: string;
    };

    if (!token || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');

    if (isMock) {
      const { readInvite, addAccessRequest } = await import('@/lib/dynamic');
      const invite = readInvite(token);
      if (!invite) {
        return NextResponse.json({ error: 'Invalid or expired invite.' }, { status: 400 });
      }
      const created = addAccessRequest({
        project_id: invite.project_id,
        requester_name: name,
        requester_email: email,
        message,
      });
      return NextResponse.json({ success: true, request: created });
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { data: invite, error: inviteError } = await adminClient
      .from('project_invites')
      .select('project_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite.' }, { status: 400 });
    }

    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Invite has expired.' }, { status: 400 });
    }

    const { data: created, error: createError } = await adminClient
      .from('client_access_requests')
      .insert({
        project_id: invite.project_id,
        requester_name: name,
        requester_email: email,
        message,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ success: true, request: created });
  } catch (err) {
    console.error('[/api/client/requests]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
