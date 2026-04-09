'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_PROJECTS, MOCK_SPOCS, MOCK_QUERIES, getProjectDocCompletionPercent, formatCurrency, MOCK_DOCUMENTS } from '@/lib/mock-data';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';
import { Upload, MessageSquare, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getDynamicSpocs, getDynamicProjects } from '@/lib/dynamic';

export default function ClientDashboard() {
  const { user } = useAuth();
  const mergedSpocs = [...MOCK_SPOCS, ...getDynamicSpocs()];
  const spoc = mergedSpocs.find(s => s.email === user?.email);
  const mergedProjects = [...MOCK_PROJECTS, ...getDynamicProjects() as any];
  const project = spoc ? mergedProjects.find((p: any) => p.id === spoc.project_id) : null;

  if (!project || !spoc) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
        No project assigned. Please contact your Leverest relationship manager.
      </div>
    );
  }

  const docs = MOCK_DOCUMENTS.filter(d => d.project_id === project.id);
  const queries = MOCK_QUERIES.filter(q => q.project_id === project.id && q.status !== 'resolved');
  const completion = getProjectDocCompletionPercent(project.id);
  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === project.stage);

  const received = docs.filter(d => d.status === 'received').length;
  const pending  = docs.filter(d => d.status === 'pending').length;
  const missing  = docs.filter(d => d.status === 'required').length;

  function getStageLabel(s: string) {
    const m: Record<string,string> = { lead_received:'Lead',meeting_done:'Meeting Done',documents_requested:'Docs Requested',internal_processing:'Processing',proposal_sent:'Proposal Sent',approved:'Approved' };
    return m[s] || s;
  }

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '900px' }} className="fade-up">
      {/* Deal banner */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '20px', background: 'linear-gradient(135deg, #0A1525 0%, #0D1B2E 100%)', border: '1px solid rgba(201,150,12,0.2)' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>YOUR DEAL</div>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '6px' }}>
          {project.company_name}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '16px' }}>{project.description}</div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loan Amount</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F0B429' }}>{formatCurrency(project.loan_amount || 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Stage</div>
            <span className={`pill stage-${project.stage}`} style={{ marginTop: '3px', display: 'inline-flex' }}>{getStageLabel(project.stage)}</span>
          </div>
          {project.selected_bank && (
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected Bank</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', marginTop: '2px' }}>{project.selected_bank}</div>
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        {[
          { label: 'Docs Received', value: received, color: '#4ADE80', link: '/client/documents' },
          { label: 'Docs Pending', value: pending, color: '#FCD34D', link: '/client/documents' },
          { label: 'Open Queries', value: queries.length, color: '#F87171', link: '/client/queries' },
        ].map(k => (
          <Link key={k.label} href={k.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{k.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Document progress */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>Document Checklist Progress</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{received} received · {pending} pending · {missing} missing</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F0B429' }}>{completion}%</div>
        </div>
        <div className="progress-track lg" style={{ marginBottom: '14px' }}>
          <div className="progress-fill" style={{ width: `${completion}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Received', value: received, color: '#4ADE80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)' },
            { label: 'Pending', value: pending, color: '#FCD34D', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
            { label: 'Missing', value: missing, color: '#F87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        {missing > 0 && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertCircle size={13} color="#F87171" />
            <span style={{ fontSize: '0.76rem', color: '#F87171' }}>{missing} documents are still required. Please upload them to keep your application on track.</span>
          </div>
        )}
        <Link href="/client/documents" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', textDecoration: 'none' }}>
          <Upload size={15} /> Upload Documents
        </Link>
      </div>

      {/* Pipeline */}
      <div className="card" style={{ padding: '18px', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Deal Progress</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const done = idx < currentStageIdx;
            const current = idx === currentStageIdx;
            return (
              <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: done ? '#C9960C' : current ? 'rgba(201,150,12,0.15)' : 'var(--bg-hover)',
                    border: `2px solid ${done ? '#C9960C' : current ? '#C9960C' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 800, color: done ? '#000' : current ? '#F0B429' : 'var(--text-4)',
                    boxShadow: current ? '0 0 0 3px rgba(201,150,12,0.15)' : 'none',
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div style={{
                    fontSize: '0.54rem', textAlign: 'center', width: '50px',
                    color: current ? '#F0B429' : done ? 'var(--text-2)' : 'var(--text-4)',
                    fontWeight: current ? 700 : 400,
                  }}>
                    {stage.label}
                  </div>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: idx < currentStageIdx ? '#C9960C' : 'rgba(255,255,255,0.07)', margin: '0 2px', marginBottom: '18px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Open queries */}
      {queries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <MessageSquare size={13} color="#F87171" />
              <div className="card-header-title">Action Required — Queries ({queries.length})</div>
            </div>
            <Link href="/client/queries" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Query</th><th>Priority</th><th>Raised By</th><th></th></tr></thead>
              <tbody>
                {queries.slice(0, 3).map(q => (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.8rem' }}>{q.title}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{q.description.slice(0, 70)}…</div>
                    </td>
                    <td>
                      <span className={`pill ${q.priority === 'high' ? 'pill-red' : 'pill-gold'}`}>{q.priority}</span>
                    </td>
                    <td style={{ fontSize: '0.73rem' }}>{q.raised_by_name}</td>
                    <td>
                      <Link href="/client/queries" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        Respond →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
