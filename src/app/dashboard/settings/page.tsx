'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { MOCK_USERS } from '@/lib/mock-data';
import {
  Building2, Users, Lock, Bell, Database, Palette, Shield,
  ChevronRight, Check, AlertTriangle, Save, Plus, Trash2,
  Mail, Phone, MapPin, Globe, Eye, EyeOff, ToggleLeft, ToggleRight,
  Key, RefreshCw, Download, Upload,
} from 'lucide-react';

type SettingsTab =
  | 'company'
  | 'team'
  | 'roles'
  | 'notifications'
  | 'security'
  | 'data'
  | 'appearance';

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--bg-border)' }}>
      <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>{desc}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', paddingBottom: '18px', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: '200px', flexShrink: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <div style={{
        width: '38px', height: '22px', borderRadius: '11px',
        background: value ? '#C9960C' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s',
        border: `1px solid ${value ? 'rgba(201,150,12,0.5)' : 'rgba(255,255,255,0.15)'}`,
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '2px',
          left: value ? '18px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: value ? 'var(--text-1)' : 'var(--text-3)' }}>{label}</span>
    </button>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(to top, #03080F 80%, transparent)',
      padding: '16px 0 4px', marginTop: '24px',
      display: 'flex', justifyContent: 'flex-end',
    }}>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 20px', borderRadius: '8px',
          background: saving ? 'rgba(201,150,12,0.3)' : 'linear-gradient(135deg,#C9960C,#F0B429)',
          color: '#05100C', fontWeight: 700, fontSize: '0.82rem',
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 12px rgba(201,150,12,0.25)',
          fontFamily: 'inherit',
        }}
      >
        {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  relation_partner: 'Relation Partner',
  relation_manager: 'Relation Manager',
  engagement_partner: 'Engagement Partner',
  engagement_manager: 'Engagement Manager',
  executive: 'Executive',
  accounts: 'Accounts',
  mis: 'MIS',
  engagement_assistant: 'Engagement Assistant',
};

const ROLE_PERMISSIONS: Record<string, { label: string; roles: string[] }[]> = {
  'View Financial Data (Loan Amounts, Revenue)': [{ label: 'Admin only', roles: ['admin'] }],
  'View Commission Figures': [{ label: 'Admin only', roles: ['admin'] }],
  'Create / Edit Projects': [{ label: 'Admin, Relation Partner/Manager', roles: ['admin', 'relation_partner', 'relation_manager'] }],
  'Manage Team Members': [{ label: 'Admin only', roles: ['admin'] }],
  'Access Activity Logs': [{ label: 'Admin + Partners', roles: ['admin', 'relation_partner', 'engagement_partner'] }],
  'Upload Documents': [{ label: 'All internal roles', roles: ['admin', 'manager', 'relation_partner', 'relation_manager', 'engagement_partner', 'engagement_manager', 'executive', 'accounts', 'mis', 'engagement_assistant'] }],
  'View Settings': [{ label: 'Admin only', roles: ['admin'] }],
  'Manage Queries': [{ label: 'All internal roles', roles: ['admin', 'manager', 'relation_partner', 'relation_manager', 'engagement_partner', 'engagement_manager', 'executive'] }],
};

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Company settings state
  const [companyName, setCompanyName] = useState('Leverest Fintech Pvt. Ltd.');
  const [branch, setBranch] = useState('Kolkata');
  const [address, setAddress] = useState('6, Suren Sarkar Road, Kolkata – 700010');
  const [phone, setPhone] = useState('+91 33 XXXX XXXX');
  const [email, setOrgEmail] = useState('contact@leverestfin.com');
  const [website, setWebsite] = useState('www.leverestfin.com');
  const [gstin, setGstin] = useState('');
  const [cin, setCin] = useState('');

  // Security settings
  const [sessionTimeout, setSessionTimeout] = useState('8');
  const [enforceStrongPw, setEnforceStrongPw] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState('72');

  // Notification settings
  const [notifyNewProject, setNotifyNewProject] = useState(true);
  const [notifyStageChange, setNotifyStageChange] = useState(true);
  const [notifyDocUpload, setNotifyDocUpload] = useState(true);
  const [notifyQueryRaise, setNotifyQueryRaise] = useState(true);
  const [notifyApproval, setNotifyApproval] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);

  // Appearance
  const [accentColor, setAccentColor] = useState('#C9960C');
  const [densityMode, setDensityMode] = useState<'comfortable' | 'compact'>('comfortable');

  function handleSave() {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1200);
  }

  // Redirect non-admins
  if (!isAdmin) {
    return (
      <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px', textAlign: 'center' }}>
        <Shield size={36} color="#EF4444" style={{ opacity: 0.7 }} />
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)' }}>Access Restricted</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', maxWidth: '380px', lineHeight: 1.6 }}>
          Settings are only accessible to Administrators. Contact your admin to make changes to the platform.
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ marginTop: '8px', padding: '8px 20px', background: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)', borderRadius: '7px', color: '#F0B429', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'company',       label: 'Company',       icon: Building2 },
    { id: 'team',          label: 'Team Members',  icon: Users },
    { id: 'roles',         label: 'Role Permissions', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security',      label: 'Security',      icon: Lock },
    { id: 'data',          label: 'Data & Export',  icon: Database },
    { id: 'appearance',    label: 'Appearance',    icon: Palette },
  ];

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1100px' }} className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
          Settings
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          Platform configuration · Admin access only
        </div>
      </div>

      {saved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          color: '#4ADE80', fontSize: '0.8rem',
        }}>
          <Check size={15} /> Changes saved successfully
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar tabs */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '9px 11px', borderRadius: '7px', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    background: active ? 'rgba(201,150,12,0.12)' : 'transparent',
                    color: active ? '#F0B429' : 'var(--text-2)',
                    fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                    transition: 'all 0.15s',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {tab.label}
                  {active && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: '24px' }}>

            {/* ─── COMPANY ─── */}
            {activeTab === 'company' && (
              <>
                <SectionHeader title="Company Information" desc="Basic details about your organisation shown across the platform and client portal." />

                <FieldRow label="Company Name" hint="Legal entity name">
                  <input className="field" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </FieldRow>
                <FieldRow label="Branch" hint="Your active operating branch">
                  <select className="field" value={branch} onChange={e => setBranch(e.target.value)}>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </FieldRow>
                <FieldRow label="Registered Address">
                  <textarea className="field" value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                </FieldRow>
                <FieldRow label="Contact Phone">
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input className="field" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingLeft: '32px' }} />
                  </div>
                </FieldRow>
                <FieldRow label="Official Email">
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input className="field" type="email" value={email} onChange={e => setOrgEmail(e.target.value)} style={{ paddingLeft: '32px' }} />
                  </div>
                </FieldRow>
                <FieldRow label="Website">
                  <div style={{ position: 'relative' }}>
                    <Globe size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input className="field" value={website} onChange={e => setWebsite(e.target.value)} style={{ paddingLeft: '32px' }} />
                  </div>
                </FieldRow>

                <div style={{ marginTop: '8px', paddingTop: '18px', borderTop: '1px solid var(--bg-border)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '14px' }}>Compliance & Legal</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="field-label">GSTIN</label>
                      <input className="field" placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">CIN</label>
                      <input className="field" placeholder="U65999WB2024PTC000000" value={cin} onChange={e => setCin(e.target.value)} />
                    </div>
                  </div>
                </div>

                <SaveBar onSave={handleSave} saving={saving} />
              </>
            )}

            {/* ─── TEAM MEMBERS ─── */}
            {activeTab === 'team' && (
              <>
                <SectionHeader title="Team Members" desc="All registered internal users. Only admins can manage team access." />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                    background: 'linear-gradient(135deg,#C9960C,#F0B429)', color: '#05100C',
                    fontWeight: 700, fontSize: '0.78rem', borderRadius: '7px', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <Plus size={13} /> Add Member
                  </button>
                </div>

                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Designation</th>
                        <th>Branch</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_USERS.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                background: `hsl(${u.name.charCodeAt(0) * 20 % 360}, 60%, 45%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                              }}>
                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.73rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>{u.email}</td>
                          <td>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                              background: u.role === 'admin' ? 'rgba(201,150,12,0.15)' : 'rgba(96,165,250,0.1)',
                              color: u.role === 'admin' ? '#F0B429' : '#60A5FA',
                              border: `1px solid ${u.role === 'admin' ? 'rgba(201,150,12,0.3)' : 'rgba(96,165,250,0.2)'}`,
                            }}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{u.designation || '—'}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-2)', textTransform: 'capitalize' }}>{u.branch}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                              background: u.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: u.is_active ? '#4ADE80' : '#F87171',
                            }}>
                              {u.is_active ? '● Active' : '○ Inactive'}
                            </span>
                          </td>
                          <td>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '4px' }}
                              title="Edit member">
                              <Key size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(201,150,12,0.05)', border: '1px solid rgba(201,150,12,0.15)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                  <strong style={{ color: '#F0B429' }}>Note:</strong> To fully activate a member, they must be added to Supabase Auth. The list above reflects registered accounts in the platform database.
                </div>
              </>
            )}

            {/* ─── ROLE PERMISSIONS ─── */}
            {activeTab === 'roles' && (
              <>
                <SectionHeader title="Role & Permission Matrix" desc="Defines what each role can see and do across the platform. Contact your developer to modify these rules." />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(ROLE_PERMISSIONS).map(([permission, access]) => (
                    <div key={permission} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{permission}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px' }}>{access[0].label}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '280px' }}>
                        {access[0].roles.map(role => (
                          <span key={role} style={{
                            fontSize: '0.6rem', fontWeight: 600, padding: '2px 7px', borderRadius: '99px',
                            background: role === 'admin' ? 'rgba(201,150,12,0.15)' : 'rgba(96,165,250,0.08)',
                            color: role === 'admin' ? '#F0B429' : '#60A5FA',
                            border: `1px solid ${role === 'admin' ? 'rgba(201,150,12,0.2)' : 'rgba(96,165,250,0.15)'}`,
                          }}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', padding: '13px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-3)', display: 'flex', gap: '10px' }}>
                  <AlertTriangle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>Permissions are hard-coded at the platform level for security. To adjust any rule, contact your development team.</span>
                </div>
              </>
            )}

            {/* ─── NOTIFICATIONS ─── */}
            {activeTab === 'notifications' && (
              <>
                <SectionHeader title="Notification Preferences" desc="Control which events trigger platform alerts and whether email notifications are sent." />

                <FieldRow label="Email Notifications" hint="Send email alerts for platform events (requires SMTP configuration)">
                  <Toggle value={emailNotifs} onChange={setEmailNotifs} label="Enable email delivery" />
                  {emailNotifs && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(201,150,12,0.05)', border: '1px solid rgba(201,150,12,0.2)', borderRadius: '7px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      SMTP is not yet configured. Add <code style={{ color: '#F0B429', fontFamily: 'monospace' }}>SMTP_HOST</code>, <code style={{ color: '#F0B429', fontFamily: 'monospace' }}>SMTP_USER</code>, and <code style={{ color: '#F0B429', fontFamily: 'monospace' }}>SMTP_PASS</code> to your environment variables.
                    </div>
                  )}
                </FieldRow>

                <div style={{ marginBottom: '14px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  In-App Alert Triggers
                </div>

                {[
                  { label: 'New project created', value: notifyNewProject, onChange: setNotifyNewProject },
                  { label: 'Project stage changed', value: notifyStageChange, onChange: setNotifyStageChange },
                  { label: 'Document uploaded by client', value: notifyDocUpload, onChange: setNotifyDocUpload },
                  { label: 'New query raised', value: notifyQueryRaise, onChange: setNotifyQueryRaise },
                  { label: 'Deal approved', value: notifyApproval, onChange: setNotifyApproval },
                ].map(({ label, value, onChange }) => (
                  <div key={label} style={{ marginBottom: '14px' }}>
                    <Toggle value={value} onChange={onChange} label={label} />
                  </div>
                ))}

                <SaveBar onSave={handleSave} saving={saving} />
              </>
            )}

            {/* ─── SECURITY ─── */}
            {activeTab === 'security' && (
              <>
                <SectionHeader title="Security Settings" desc="Control session behaviour, password policies, and client access expiry." />

                <FieldRow label="Session Timeout" hint="Hours before an inactive session is automatically logged out">
                  <select className="field" style={{ width: '160px' }} value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                  </select>
                </FieldRow>

                <FieldRow label="Password Policy" hint="Require complex passwords for all internal accounts">
                  <Toggle value={enforceStrongPw} onChange={setEnforceStrongPw} label="Enforce strong passwords (min 8 chars, numbers, symbols)" />
                </FieldRow>

                <FieldRow label="Two-Factor Authentication" hint="Require 2FA for all admin accounts (requires Supabase Auth setup)">
                  <Toggle value={twoFactor} onChange={setTwoFactor} label="Enable 2FA for admins" />
                  {twoFactor && (
                    <div style={{ marginTop: '8px', padding: '10px 12px', background: 'rgba(201,150,12,0.05)', border: '1px solid rgba(201,150,12,0.2)', borderRadius: '7px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      2FA requires Supabase Auth to be connected. Configure in your Supabase project settings.
                    </div>
                  )}
                </FieldRow>

                <FieldRow label="Client Invite Expiry" hint="How long a client SPOC invite link remains valid before it expires">
                  <select className="field" style={{ width: '160px' }} value={inviteExpiry} onChange={e => setInviteExpiry(e.target.value)}>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="72">72 hours (default)</option>
                    <option value="168">7 days</option>
                  </select>
                </FieldRow>

                <div style={{ marginTop: '8px', paddingTop: '18px', borderTop: '1px solid var(--bg-border)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '14px' }}>Danger Zone</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>Revoke all client sessions</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>Forces all Client SPOCs to log in again immediately</div>
                      </div>
                      <button style={{ padding: '6px 13px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>

                <SaveBar onSave={handleSave} saving={saving} />
              </>
            )}

            {/* ─── DATA & EXPORT ─── */}
            {activeTab === 'data' && (
              <>
                <SectionHeader title="Data & Export" desc="Export platform data and manage database integration settings." />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Export All Projects', desc: 'Download complete project data as CSV', icon: Download },
                    { label: 'Export Team Members', desc: 'Download team roster with roles', icon: Download },
                    { label: 'Export Activity Log', desc: 'Full audit trail as CSV', icon: Download },
                    { label: 'Export Commission Report', desc: 'Commission figures across all deals', icon: Download },
                  ].map(({ label, desc, icon: Icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{desc}</div>
                      </div>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 13px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Icon size={13} /> Export
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: '18px', borderTop: '1px solid var(--bg-border)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '14px' }}>🔗 Database Integration</div>

                  <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>Supabase</div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(239,68,68,0.1)', color: '#F87171' }}>Not Connected</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                      The platform is currently running on in-memory mock data. To persist data across sessions, add your <code style={{ color: '#F0B429', fontFamily: 'monospace' }}>NEXT_PUBLIC_SUPABASE_URL</code> and <code style={{ color: '#F0B429', fontFamily: 'monospace' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code style={{ color: '#F0B429', fontFamily: 'monospace' }}>.env.local</code>.
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <input className="field" placeholder="https://xxxx.supabase.co" style={{ flex: 1, fontSize: '0.75rem' }} />
                      <button style={{ padding: '6px 13px', borderRadius: '6px', background: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)', color: '#F0B429', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Test Connection
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── APPEARANCE ─── */}
            {activeTab === 'appearance' && (
              <>
                <SectionHeader title="Appearance" desc="Customise how the platform looks. Settings apply platform-wide for all users." />

                <FieldRow label="Accent Colour" hint="Primary brand colour used on buttons and highlights">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer' }} />
                    <input className="field" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '120px', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['#C9960C', '#3B82F6', '#8B5CF6', '#22C55E', '#EF4444'].map(c => (
                        <button key={c} onClick={() => setAccentColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: accentColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>
                </FieldRow>

                <FieldRow label="Table Density" hint="How tightly packed data tables appear">
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['comfortable', 'compact'] as const).map(d => (
                      <button key={d} onClick={() => setDensityMode(d)} style={{
                        padding: '7px 16px', borderRadius: '7px', fontFamily: 'inherit',
                        fontSize: '0.78rem', cursor: 'pointer', fontWeight: densityMode === d ? 600 : 400,
                        background: densityMode === d ? 'rgba(201,150,12,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${densityMode === d ? 'rgba(201,150,12,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: densityMode === d ? '#F0B429' : 'var(--text-2)',
                        textTransform: 'capitalize',
                      }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Dark Mode" hint="The platform currently uses a fixed dark theme">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: '99px', background: 'rgba(201,150,12,0.1)', border: '1px solid rgba(201,150,12,0.25)', color: '#F0B429', fontWeight: 600 }}>
                      ● Dark Mode Active
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Light mode coming soon</span>
                  </div>
                </FieldRow>

                <SaveBar onSave={handleSave} saving={saving} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
