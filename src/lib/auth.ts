import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeverestUser {
  email: string;
  name: string;
  role: string;
  employee_type: string;
  branch: string;
  is_admin: boolean;
}

export interface SpocSession {
  id: string;
  email: string;
  name: string;
  project_id: string;
  designation: string | null;
}

// ─── Internal (Leverest team) auth ───────────────────────────────────────────

/**
 * Returns the currently authenticated Leverest user.
 * Validates Supabase session AND verifies @leverestfin.com domain.
 * Returns null if unauthenticated or wrong domain.
 */
export async function getUser(): Promise<LeverestUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) return null;
    if (!authUser.email?.endsWith('@leverestfin.com')) return null;

    const { data: userRow, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (dbError || !userRow) return null;

    return userRow as LeverestUser;
  } catch {
    return null;
  }
}

/**
 * Like getUser() but throws a 401-like error if not authenticated.
 */
export async function requireAuth(): Promise<LeverestUser> {
  const user = await getUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

/**
 * Like requireAuth() but additionally verifies is_admin = true.
 */
export async function requireAdmin(): Promise<LeverestUser> {
  const user = await requireAuth();
  if (!user.is_admin) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/**
 * Verifies the current user has access to a project via project_members.
 * Admin bypasses this check.
 */
export async function requireProjectAccess(projectId: string): Promise<LeverestUser> {
  const user = await requireAuth();

  if (user.is_admin) return user;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_email', user.email)
    .single();

  if (error || !data) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

// ─── SPOC auth ────────────────────────────────────────────────────────────────

const SPOC_COOKIE = 'lv_spoc_session';

/**
 * Reads the SPOC session cookie and returns the parsed session.
 * Returns null if no valid SPOC session.
 */
export async function getSpoc(): Promise<SpocSession | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SPOC_COOKIE)?.value;
    if (!raw) return null;

    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SpocSession;

    // Basic validation
    if (!session.id || !session.email || !session.project_id) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Encodes and sets the SPOC session cookie.
 * Called after successful SPOC login.
 */
export function buildSpocCookieValue(session: SpocSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export { SPOC_COOKIE };

// ─── Request-level helpers (for middleware / Route Handlers) ──────────────────

/**
 * Extracts the SPOC session from a NextRequest (for use in middleware).
 */
export function getSpocFromRequest(request: NextRequest): SpocSession | null {
  try {
    const raw = request.cookies.get(SPOC_COOKIE)?.value;
    if (!raw) return null;
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SpocSession;
    if (!session.id || !session.email || !session.project_id) return null;
    return session;
  } catch {
    return null;
  }
}
