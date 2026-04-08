'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MOCK_USERS } from '@/lib/mock-data';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { saveDynamicProject, createInviteToken } from '@/lib/dynamic';

const LOAN_TYPES = [
  { value: 'working_capital', label: 'Working Capital' },
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'od_cc', label: 'OD / CC' },
  { value: 'project_finance', label: 'Project Finance' },
  { value: 'equipment_finance', label: 'Equipment Finance' },
];
const LEAD_SOURCES = [
  { value: 'direct', label: 'Direct' },
  { value: 'referral', label: 'Referral' },
  { value: 'ca_referral', label: 'CA Referral' },
  { value: 'website', label: 'Website' },
  { value: 'bank_referral', label: 'Bank Referral' },
  { value: 'broker', label: 'Broker' },
];
const COMPANY_TYPES = [
  { value: 'manufacturing_service', label: 'Manufacturing / Service' },
  { value: 'nbfc', label: 'NBFC' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'trading', label: 'Trading' },
];

function Label({ children }: { children: React.ReactNode }) {
  return <label className="field-label">{children}</label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="card-header"><div className="card-header-title">{title}</div></div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>;
}

const teamUsers = MOCK_USERS.filter(u => !['admin','accounts','mis'].includes(u.role));

export default function NewProjectPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !['admin', 'manager'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: '', company_type: '', loan_type: '', loan_amount: '',
    lead_source: '', contact_person: '', contact_email: '', contact_phone: '',
    description: '', deadline: '', stage: 'lead_received',
    commission_percentage: '1.5',
    team: [] as string[],
  });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function toggleTeam(email: string) {
    setForm(f => ({
      ...f,
      team: f.team.includes(email) ? f.team.filter(e => e !== email) : [...f.team, email],
    }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const id = `p-${Date.now()}`;
    const now = new Date().toISOString();
    const project = {
      id,
      name: `${form.company_name} — ${LOAN_TYPES.find(l => l.value === form.loan_type)?.label || 'Loan'}`,
      company_name: form.company_name,
      company_type: (form.company_type as any) || 'manufacturing_service',
      branch: 'kolkata' as const,
      stage: (form.stage as any) || 'lead_received',
      lead_source: (form.lead_source as any) || 'direct',
      loan_type: (form.loan_type as any) || 'working_capital',
      loan_amount: Number(form.loan_amount || 0),
      assigned_team: form.team.length ? form.team : [user?.email || ''],
      spoc_ids: [],
      created_at: now,
      updated_at: now,
      created_by: user?.email || '',
      contact_person: form.contact_person,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      description: form.description,
      deadline: form.deadline,
    };
    saveDynamicProject(project);
    const token = createInviteToken(id, 72);
    setSaving(false);
    alert(`Invite link created:\n${window.location.origin}/client/invite/${token}\n\nShare with client to add members.`);
    router.push('/dashboard/projects');
  }

  const isValid = form.company_name && form.loan_type && form.loan_amount && form.contact_person;

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '860px' }} className="fade-up">
      {/* Header */}
      <Link href="/dashboard/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-3)', textDecoration: 'none', marginBottom: '14px' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ArrowLeft size={13} /> Back to Projects
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>New Project</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Create a new deal — all fields with * are required</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save Project'}
        </button>
      </div>

      {/* Company Info */}
      <Section title="Company Information">
        <Row>
          <div>
            <Label>Company Name *</Label>
            <input className="field" placeholder="e.g. Bengal Steel Industries Pvt. Ltd." value={form.company_name} onChange={e => set('company_name', e.target.value)} />
          </div>
          <div>
            <Label>Company Type *</Label>
            <select className="field" value={form.company_type} onChange={e => set('company_type', e.target.value)}>
              <option value="">Select type…</option>
              {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </Row>
        <div>
          <Label>Description</Label>
          <textarea className="field" placeholder="Brief description of the deal / company background…" value={form.description} onChange={e => set('description', e.target.value)} style={{ minHeight: '72px' }} />
        </div>
      </Section>

      {/* Deal Details */}
      <Section title="Deal Details">
        <Row>
          <div>
            <Label>Loan Type *</Label>
            <select className="field" value={form.loan_type} onChange={e => set('loan_type', e.target.value)}>
              <option value="">Select loan type…</option>
              {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Loan Amount (₹) *</Label>
            <input className="field" type="number" placeholder="e.g. 25000000" value={form.loan_amount} onChange={e => set('loan_amount', e.target.value)} />
          </div>
        </Row>
        <Row>
          <div>
            <Label>Lead Source</Label>
            <select className="field" value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
              <option value="">Select source…</option>
              {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Commission % (Leverest)</Label>
            <input className="field" type="number" step="0.25" placeholder="1.5" value={form.commission_percentage} onChange={e => set('commission_percentage', e.target.value)} />
          </div>
        </Row>
        <Row>
          <div>
            <Label>Initial Pipeline Stage</Label>
            <select className="field" value={form.stage} onChange={e => set('stage', e.target.value)}>
              {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Target Deadline</Label>
            <input className="field" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>
        </Row>
      </Section>

      {/* Primary Contact */}
      <Section title="Primary Contact (Client)">
        <Row>
          <div>
            <Label>Contact Person Name *</Label>
            <input className="field" placeholder="CFO / Finance Head name" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
          </div>
          <div>
            <Label>Contact Email</Label>
            <input className="field" type="email" placeholder="contact@company.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
          </div>
        </Row>
        <div style={{ maxWidth: '300px' }}>
          <Label>Contact Phone</Label>
          <input className="field" placeholder="+91 98765 00000" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
        </div>
      </Section>

      {/* Team Assignment */}
      <Section title="Assign Leverest Team">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {teamUsers.map(u => {
            const selected = form.team.includes(u.email);
            return (
              <button
                key={u.id}
                onClick={() => toggleTeam(u.email)}
                style={{
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                  background: selected ? 'rgba(201,150,12,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected ? 'rgba(201,150,12,0.35)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selected ? '#F0B429' : 'var(--text-4)', flexShrink: 0, transition: 'background 0.15s' }} />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: selected ? '#F0B429' : 'var(--text-1)' }}>{u.name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-3)' }}>{u.designation}</div>
                </div>
              </button>
            );
          })}
        </div>
        {form.team.length > 0 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>
            {form.team.length} member{form.team.length > 1 ? 's' : ''} selected
          </div>
        )}
      </Section>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <Link href="/dashboard/projects" className="btn btn-ghost">Cancel</Link>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Create Project'}
        </button>
      </div>
    </div>
  );
}
