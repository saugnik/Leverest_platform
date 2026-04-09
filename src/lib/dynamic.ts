export type DynProject = {
  id: string;
  name: string;
  company_name: string;
  company_type: string;
  branch: 'kolkata' | 'delhi';
  stage: string;
  lead_source: string;
  loan_type?: string;
  loan_amount?: number;
  assigned_team: string[];
  spoc_ids: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  deadline?: string;
};

export type DynSpoc = {
  id: string;
  project_id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  password_hash?: string;
  is_active: boolean;
  created_at: string;
};

type InvitePayload = {
  token: string;
  project_id: string;
  expires_at: number;
  used: boolean;
};

type OtpPayload = {
  email: string;
  code: string;
  expires_at: number;
};

type PasswordOverride = {
  email: string;
  password_hash: string;
};

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function createOtp(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const otps = lsGet<OtpPayload[]>('dyn_otps', []);
  // Remove existing OTPs for this email
  const filtered = otps.filter(o => o.email !== email);
  filtered.push({ email, code, expires_at: Date.now() + 10 * 60_000 }); // 10 min expiry
  lsSet('dyn_otps', filtered);
  console.log(`[DEMO] OTP for ${email}: ${code}`);
  return code;
}

export function verifyOtp(email: string, code: string): boolean {
  const otps = lsGet<OtpPayload[]>('dyn_otps', []);
  const found = otps.find(o => o.email === email && o.code === code && o.expires_at > Date.now());
  if (found) {
    // Consume OTP
    lsSet('dyn_otps', otps.filter(o => o !== found));
    return true;
  }
  return false;
}

export function savePasswordOverride(email: string, password_hash: string) {
  // If it's a dynamic SPOC, update them directly
  const spocs = getDynamicSpocs();
  const spocIdx = spocs.findIndex(s => s.email === email);
  if (spocIdx >= 0) {
    spocs[spocIdx].password_hash = password_hash;
    lsSet('dyn_spocs', spocs);
    return;
  }

  // Otherwise save as override for team members
  const overrides = lsGet<PasswordOverride[]>('dyn_pw_overrides', []);
  const idx = overrides.findIndex(o => o.email === email);
  if (idx >= 0) overrides[idx].password_hash = password_hash; else overrides.push({ email, password_hash });
  lsSet('dyn_pw_overrides', overrides);
}

export function getPasswordHash(email: string): string | undefined {
  // Check SPOCs first
  const spoc = getDynamicSpocs().find(s => s.email === email);
  if (spoc?.password_hash) return spoc.password_hash;

  // Check overrides
  const override = lsGet<PasswordOverride[]>('dyn_pw_overrides', []).find(o => o.email === email);
  return override?.password_hash;
}

export function getDynamicProjects(): DynProject[] {
  return lsGet<DynProject[]>('dyn_projects', []);
}

export function saveDynamicProject(p: DynProject) {
  const list = getDynamicProjects();
  const idx = list.findIndex(x => x.id === p.id);
  if (idx >= 0) list[idx] = p; else list.push(p);
  lsSet('dyn_projects', list);
}

export function getDynamicSpocs(): DynSpoc[] {
  return lsGet<DynSpoc[]>('dyn_spocs', []);
}

export function addDynamicSpoc(s: DynSpoc) {
  const list = getDynamicSpocs();
  list.push(s);
  lsSet('dyn_spocs', list);
}

export function createInviteToken(projectId: string, ttlHours = 48): string {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2, 6);
  const invites = lsGet<InvitePayload[]>('dyn_invites', []);
  invites.push({ token, project_id: projectId, expires_at: Date.now() + ttlHours * 3600_000, used: false });
  lsSet('dyn_invites', invites);
  return token;
}

export function readInvite(token: string): InvitePayload | undefined {
  const invites = lsGet<InvitePayload[]>('dyn_invites', []);
  return invites.find(i => i.token === token);
}

export function consumeInvite(token: string) {
  const invites = lsGet<InvitePayload[]>('dyn_invites', []);
  const idx = invites.findIndex(i => i.token === token);
  if (idx >= 0) {
    invites[idx].used = true;
    lsSet('dyn_invites', invites);
  }
}

export function getProjectByIdMerged(id: string): DynProject | undefined {
  return getDynamicProjects().find(p => p.id === id);
}
