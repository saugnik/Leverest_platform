'use client';

import { useState, use, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  getProjectDocCompletionPercent, formatCurrency,
} from '@/lib/mock-data';
import { canViewFinanceData } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';
import {
  ArrowLeft, FileText, MessageSquare, StickyNote, Activity,
  CheckCircle2, Clock, AlertCircle, Upload, ExternalLink, Plus, Send,
  Phone, Mail, TrendingUp, Edit3, Check, MessageCircle, Lock,
} from 'lucide-react';

type Tab = 'overview' | 'documents' | 'queries' | 'notes' | 'activity';

function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}
function getStageLabel(s: string) {
  const m: Record<string,string> = { lead_received:'Lead',meeting_done:'Meeting',documents_requested:'Docs Requested',internal_processing:'Internal Processing',proposal_sent:'Proposal Sent',approved:'Approved' };
  return m[s] || s;
}
function getLoanTypeLabel(t: string) {
  const m: Record<string,string> = { working_capital:'Working Capital',term_loan:'Term Loan',od_cc:'OD / CC',project_finance:'Project Finance',equipment_finance:'Equipment Finance' };
  return m[t] || t;
}
function getLeadSourceLabel(l: string) {
  const m: Record<string,string> = { direct:'Direct',referral:'Referral',website:'Website',ca_referral:'CA Referral',bank_referral:'Bank Referral',broker:'Broker' };
  return m[l] || l;
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [newNote, setNewNote] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(console.error);
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>Loading...</div>;

  const { project, documents: docs = [], queries = [], notes = [], activity = [], spocs = [], members = [] } = data || {};

  if (!project) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
      Project not found. <Link href="/dashboard/projects" style={{ color: 'var(--gold)' }}>← Back</Link>
    </div>
  );

  const completion = getProjectDocCompletionPercent(project.id);
  const score = project.approval_score || 0;
  const scoreColor = score >= 75 ? '#4ADE80' : score >= 55 ? '#FCD34D' : '#F87171';

  const canSeeCommission = canViewFinanceData(user?.role);
  const canAddNotes = user?.role !== 'client_spoc';
  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === project.stage);

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview',       label: 'Overview',      icon: TrendingUp },
    { id: 'documents',      label: 'Documents',     icon: FileText,       count: docs.length },
    { id: 'queries',        label: 'Queries',       icon: MessageSquare,  count: queries.filter((q: any) => q.status !== 'resolved').length },
    { id: 'notes',          label: 'Internal Notes',icon: StickyNote,     count: notes.length },
    { id: 'activity',       label: 'Activity',      icon: Activity,       count: activity.length },
  ];

  return (
    <div style={{ padding: '1.5rem 2rem' }} className="fade-up">
      {/* Breadcrumb */}
      <Link href="/dashboard/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-3)', textDecoration: 'none', marginBottom: '14px' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ArrowLeft size={13} /> Back to Projects
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)' }}>
              {project.client_name}
            </div>
            <span className={`pill stage-${project.stage}`}>{getStageLabel(project.stage)}</span>
            <span className="pill pill-slate">{project.company_type === 'nbfc' ? 'NBFC' : 'Mfg / Service'}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '5px' }}>{project.description}</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Edit3 size={13} /> Edit
        </button>
      </div>

      {/* Pipeline */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
            DEAL PIPELINE
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Stage {currentStageIdx + 1} of {PIPELINE_STAGES.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const done = idx < currentStageIdx;
            const current = idx === currentStageIdx;
            return (
              <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 800, zIndex: 1, flexShrink: 0,
                    background: done ? '#C9960C' : current ? 'rgba(201,150,12,0.15)' : 'var(--bg-hover)',
                    border: `2px solid ${done ? '#C9960C' : current ? '#C9960C' : 'rgba(255,255,255,0.1)'}`,
                    color: done ? '#000' : current ? '#F0B429' : 'var(--text-4)',
                    boxShadow: current ? '0 0 0 3px rgba(201,150,12,0.15)' : 'none',
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div style={{
                    fontSize: '0.56rem', textAlign: 'center', lineHeight: 1.2, width: '55px',
                    color: current ? '#F0B429' : done ? 'var(--text-2)' : 'var(--text-4)',
                    fontWeight: current ? 700 : 400,
                    display: 'none', // hidden on mobile; shown via css
                  }} className="pip-lbl">
                    {stage.label}
                  </div>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: idx < currentStageIdx ? '#C9960C' : 'rgba(255,255,255,0.07)', margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>
        <style>{`.pip-lbl { display: block !important; }`}</style>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '18px' }}>
        {[
          { label: 'Loan Amount', value: canSeeCommission ? formatCurrency(project.loan_amount || 0) : '—', color: '#F0B429' },
          { label: 'Loan Type', value: getLoanTypeLabel(project.loan_type || ''), color: 'var(--text-1)' },
          { label: 'Lead Source', value: getLeadSourceLabel(project.lead_source || ''), color: 'var(--text-1)' },
          { label: 'Commission', value: canSeeCommission ? formatCurrency(project.commission_amount || 0) : '—', color: '#4ADE80' },
          { label: 'Approval Score', value: `${score}/100`, color: scoreColor },
        ].map((m) => (
          <div key={m.label} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: m.color, marginBottom: '4px' }}>{m.value}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: '18px' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={13} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 800,
                  padding: '1px 5px', borderRadius: '99px',
                  background: activeTab === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.07)',
                  color: activeTab === tab.id ? '#000' : 'var(--text-2)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="fade-up">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Contacts table */}
              <div className="card">
                <div className="card-header"><div className="card-header-title">Primary Contact</div></div>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: getGrad(project.contact_person || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {getInitials(project.contact_person || '?')}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-1)' }}>{project.contact_person}</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '5px' }}>
                      {project.contact_email && <a href={`mailto:${project.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-3)', textDecoration: 'none' }}><Mail size={11} /> {project.contact_email}</a>}
                      {project.contact_phone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-3)' }}><Phone size={11} /> {project.contact_phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* SPOCs table */}
              {spocs.length > 0 && (
                <div className="card">
                  <div className="card-header"><div className="card-header-title">Client SPOCs ({spocs.length})</div></div>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Name</th><th>Designation</th><th>Email</th><th>Phone</th><th></th></tr></thead>
                      <tbody>
                        {spocs.map((s: any) => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: getGrad(s.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: '#fff' }}>
                                  {getInitials(s.name)}
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.8rem' }}>{s.name}</span>
                              </div>
                            </td>
                            <td>{s.designation}</td>
                            <td>{s.email}</td>
                            <td>{s.phone}</td>
                            <td><a href={`mailto:${s.email}`} style={{ color: 'var(--gold)', display: 'flex' }}><Mail size={13} /></a></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Team table */}
              <div className="card">
                <div className="card-header"><div className="card-header-title">Assigned Leverest Team</div></div>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Name</th><th>Email</th></tr></thead>
                    <tbody>
                      {members.map((m: any) => {
                        const email = m.user_email;
                        const n = email.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                        return (
                          <tr key={email}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: getGrad(n), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: '#fff' }}>
                                  {getInitials(n)}
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.8rem' }}>{n}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.72rem' }}>{email}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Doc completion */}
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: '10px' }}>DOCUMENT COMPLETION</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F0B429', lineHeight: 1 }}>{completion}%</div>
                </div>
                <div className="progress-track lg"><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '7px', padding: '8px 4px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ADE80' }}>{docs.filter((d: any) => d.status==='received').length}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>Received</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '7px', padding: '8px 4px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FCD34D' }}>{docs.filter((d: any) => d.status==='pending').length}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>Pending</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '7px', padding: '8px 4px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F87171' }}>{docs.filter((d: any) => d.status==='required').length}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>Missing</div>
                  </div>
                </div>
              </div>

              {/* Approval Score */}
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: '12px' }}>APPROVAL SCORE</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, color: scoreColor }}>
                    {score}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Doc Completeness', v: completion },
                    { label: 'Financial Health', v: 75 },

                    { label: 'Credit Rating', v: 60 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-2)', fontWeight: 600 }}>{item.v}</span>
                      </div>
                      <div className="progress-track sm"><div className="progress-fill" style={{ width: `${item.v}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission */}
              {canSeeCommission && project.commission_percent && (
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: '10px' }}>COMMISSION</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ADE80' }}>{project.commission_percent}%</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>of {formatCurrency(project.loan_amount || 0)}</div>
                  <div style={{ marginTop: '10px' }}>
                    <span className={`pill ${project.commission_status === 'paid' ? 'pill-green' : 'pill-red'}`}>
                      {project.commission_status === 'paid' ? '✓ Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === 'documents' && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Document Checklist — {docs.length} Total</div>
              <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Upload size={12} /> Upload
              </button>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>File</th>
                    <th>Source</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc: any) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: doc.status === 'received' ? '#4ADE80' : doc.status === 'pending' ? '#FCD34D' : '#F87171' }} />
                          <span style={{ color: 'var(--text-1)', fontWeight: 500, fontSize: '0.8rem' }}>{doc.document_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.72rem' }}>{doc.category}</td>
                      <td>
                        <span className={`pill ${doc.status === 'received' ? 'pill-green' : doc.status === 'pending' ? 'pill-gold' : 'pill-red'}`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{doc.file_name || '—'}</td>
                      <td style={{ fontSize: '0.7rem' }}>{doc.file_source ? <span className="pill pill-slate">{doc.file_source}</span> : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}><ExternalLink size={13} /></a>}
                          {doc.status !== 'received' && (
                            <label style={{ cursor: 'pointer', color: 'var(--text-3)' }} title="Upload"><Upload size={13} /><input type="file" style={{ display: 'none' }} /></label>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Queries Tab ── */}
        {activeTab === 'queries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{queries.length} total · {queries.filter((q: any) => q.status === 'open').length} open</span>
              <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={12} /> Raise Query</button>
            </div>
            <div className="card">
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Query</th><th>Type</th><th>Priority</th><th>Status</th><th>Raised By</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {queries.map((q: any) => (
                      <tr key={q.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.8rem' }}>{q.title}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{q.description.slice(0, 60)}…</div>
                        </td>
                        <td><span className="pill pill-slate">{q.source}</span></td>
                        <td>
                          <span className="pill pill-slate">Normal</span>
                        </td>
                        <td>
                          <span className={`pill ${q.status === 'resolved' ? 'pill-green' : 'pill-red'}`}>
                            {q.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.72rem' }}>{q.raised_by}</td>
                        <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{fmtDate(q.created_at)}</td>
                        <td>
                          {q.status !== 'resolved' && (
                            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={11} /> Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* ── Internal Notes Tab ── */}
        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {canAddNotes && (
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Lock size={12} color="var(--gold)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)' }}>PRIVATE — NOT VISIBLE TO CLIENT</span>
                </div>
                <textarea placeholder="Add an internal note…" value={newNote} onChange={e => setNewNote(e.target.value)} className="field" style={{ minHeight: '72px', marginBottom: '10px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }} disabled={!newNote.trim()}>
                    <Send size={12} /> Add Note
                  </button>
                </div>
              </div>
            )}
            {notes.map((note: any) => (
              <div key={note.id} className="card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: 1.7, marginBottom: '12px' }}>{note.note}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--bg-border)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: getGrad(note.created_by), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                    {getInitials(note.created_by)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{note.created_by}</span>
                  <span style={{ color: 'var(--text-4)', fontSize: '0.7rem' }}>·</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{timeAgo(note.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
          <div className="card">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Action</th><th>Performed By</th><th>Time</th></tr></thead>
                <tbody>
                  {activity.map((log: any) => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F0B429', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-1)', fontSize: '0.8rem' }}>{log.action}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.72rem' }}>{log.performed_by}</td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDateTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
