'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { formatCurrency, getProjectDocCompletionPercent } from '@/lib/mock-data'; // Keep the UI helper functions
import { PIPELINE_STAGES } from '@/lib/types';
import { Plus, Search, ExternalLink, Filter } from 'lucide-react';

function getInitials(n: string) { return n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'; }
function getGrad(name: string) {
  if (!name) return 'transparent';
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)', 'linear-gradient(135deg,#8B5CF6,#EC4899)'];
  return g[name.charCodeAt(0) % g.length];
}
function getStageLabel(s: string) {
  const m: Record<string,string> = {
    lead_received:'Lead',meeting_done:'Meeting',docs_requested:'Docs Requested',
    processing:'Processing',bank_connect:'Bank Connect',
    proposal_sent:'Proposal Sent',bank_docs:'Bank Docs',approved:'Approved',
  };
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
function getScore(s: number) {
  if (s >= 75) return '#4ADE80'; if (s >= 55) return '#FCD34D'; return '#F87171';
}

export default function ProjectsPage() {
  const { user } = useAuth();
  
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [type, setType] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.projects) {
          setAllProjects(data.projects);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = allProjects.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.client_name?.toLowerCase().includes(q) || String(p.id).includes(q);
    const matchS = stage === 'all' || p.stage === stage;
    const matchT = type === 'all' || p.loan_type === type;
    return matchQ && matchS && matchT;
  });

  const canSeeCommission = ['admin','accounts','relation_partner','relation_manager','engagement_partner','engagement_manager'].includes(user?.role || '');

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>Loading projects...</div>;
  }

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Projects</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>{filtered.length} of {allProjects.length} shown</div>
        </div>
        {['admin','relation_manager','relation_partner'].includes(user?.role || '') && (
          <Link
            href="/dashboard/projects/new"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '7px',
              background: 'linear-gradient(135deg,#C9960C,#F0B429)',
              color: '#05100C', fontSize: '0.78rem', fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 2px 12px rgba(201,150,12,0.3)',
            }}
          >
            <Plus size={14} /> New Project
          </Link>
        )}
      </div>

      {/* Stage tab bar */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button
          onClick={() => setStage('all')}
          style={{
            padding: '5px 12px', borderRadius: '99px', border: '1px solid',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            borderColor: stage === 'all' ? 'rgba(201,150,12,0.5)' : 'rgba(255,255,255,0.08)',
            background: stage === 'all' ? 'rgba(201,150,12,0.12)' : 'transparent',
            color: stage === 'all' ? '#F0B429' : 'var(--text-3)',
          }}
        >
          All ({allProjects.length})
        </button>
        {PIPELINE_STAGES.map((s) => {
          const count = allProjects.filter(p => p.stage === s.id).length;
          if (!count) return null;
          return (
            <button
              key={s.id}
              onClick={() => setStage(stage === s.id ? 'all' : s.id)}
              style={{
                padding: '5px 12px', borderRadius: '99px', border: '1px solid',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                borderColor: stage === s.id ? 'rgba(201,150,12,0.5)' : 'rgba(255,255,255,0.08)',
                background: stage === s.id ? 'rgba(201,150,12,0.12)' : 'transparent',
                color: stage === s.id ? '#F0B429' : 'var(--text-3)',
              }}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search client name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field"
            style={{ paddingLeft: '32px' }}
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Loan Types</option>
          <option value="working_capital">Working Capital</option>
          <option value="term_loan">Term Loan</option>
          <option value="od_cc">OD / CC</option>
          <option value="project_finance">Project Finance</option>
          <option value="equipment_finance">Equipment Finance</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Client Name</th>
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Stage</th>
                {canSeeCommission && <th>Commission</th>}
                <th>Branch</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const score = p.approval_score || 0;
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-4)', fontSize: '0.72rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
                          background: getGrad(p.client_name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                        }}>
                          {getInitials(p.client_name)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>{p.client_name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{p.company_type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{getLoanTypeLabel(p.loan_type || '')}</td>
                    <td style={{ color: '#F0B429', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatCurrency(p.loan_amount || 0)}</td>
                    <td><span className={`pill stage-${p.stage}`}>{getStageLabel(p.stage)}</span></td>
                    {canSeeCommission && (
                      <td>
                        {p.commission_percent ? (
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4ADE80' }}>{p.commission_percent}%</div>
                        ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                    )}
                    <td style={{ fontSize: '0.76rem', textTransform: 'capitalize' }}>{p.branch}</td>
                    <td>
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none',
                          padding: '4px 8px', borderRadius: '5px',
                          border: '1px solid var(--gold-border)',
                          background: 'var(--gold-dim)', whiteSpace: 'nowrap',
                        }}
                      >
                        Open <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
              No projects match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
