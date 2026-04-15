'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/utils';
import { canViewFinanceData } from '@/lib/utils';

function getStageLabel(s: string) {
  const m: Record<string,string> = { lead_received:'Lead',meeting_done:'Meeting',documents_requested:'Docs Requested',internal_processing:'Processing',proposal_sent:'Proposal Sent',approved:'Approved' };
  return m[s] || s;
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

const COMMISSION_STATS = [
  { label: 'Total Commission (All Deals)', value: '₹21.13 L', color: '#F0B429', sub: 'Across 5 closed deals' },
  { label: 'Paid So Far', value: '₹3.00 L', color: '#4ADE80', sub: '1 deal fully paid' },
  { label: 'Pending Collection', value: '₹18.13 L', color: '#F87171', sub: '4 deals pending' },
  { label: 'Avg Commission %', value: '1.2%', color: '#60A5FA', sub: 'Across all deals' },
];

export default function CommissionPage() {
  const { user } = useAuth();
  const canSee = canViewFinanceData(user?.role);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => {
      if (d.projects) setProjects(d.projects);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (!canSee) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
        <div style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>Commission data is restricted to Admin only.</div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>Loading...</div>;

  // ONLY show finished deals (approved) that have a commission amount as requested
  const dealProjects = projects.filter(p => p.stage === 'approved' && p.commission_amount);

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Commission Tracker</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Deal-wise commission overview — Kolkata Branch</div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {COMMISSION_STATS.map(k => (
          <div key={k.label} className="stat-card">
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-2)' }}>{k.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Deal-wise commission table */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">Deal-wise Commission Breakdown</div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Company</th>
                <th>Loan Type</th>
                <th>Loan Amount</th>
                <th>Commission %</th>
                <th>Commission Amount</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Created</th>
                <th>Team Lead</th>
              </tr>
            </thead>
            <tbody>
              {dealProjects.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-4)', fontSize: '0.72rem' }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.8rem' }}>{p.company_name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{p.contact_person}</div>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {{ working_capital:'Working Capital', term_loan:'Term Loan', od_cc:'OD / CC', project_finance:'Project Finance', equipment_finance:'Equipment Finance', other:'Other' }[p.loan_type as string] || p.loan_type}
                  </td>
                  <td style={{ color: '#F0B429', fontWeight: 700 }}>{formatCurrency(p.loan_amount || 0)}</td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.commission_percentage}%</td>
                  <td style={{ color: '#4ADE80', fontWeight: 800, fontSize: '0.88rem' }}>{formatCurrency(p.commission_amount || 0)}</td>
                  <td><span className={`pill stage-${p.stage}`}>{getStageLabel(p.stage)}</span></td>
                  <td>
                    <span className={`pill ${p.commission_status === 'paid' ? 'pill-green' : p.commission_status === 'partial' ? 'pill-gold' : 'pill-red'}`}>
                      {p.commission_status === 'paid' ? '✓ Paid' : p.commission_status === 'partial' ? 'Partial' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{fmtDate(p.created_at)}</td>
                  <td style={{ fontSize: '0.72rem' }}>
                    {p.assigned_team[0]?.split('@')[0].split('.').map((s:string) => s.charAt(0).toUpperCase()+s.slice(1)).join(' ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div style={{
          padding: '14px 18px', borderTop: '1px solid var(--bg-border)',
          display: 'flex', gap: '32px', alignItems: 'center',
          background: 'rgba(201,150,12,0.03)',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600 }}>TOTALS</div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Total Loan Value: </span>
            <span style={{ fontWeight: 800, color: '#F0B429' }}>{formatCurrency(dealProjects.reduce((s, p) => s + (p.loan_amount || 0), 0))}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Total Commission: </span>
            <span style={{ fontWeight: 800, color: '#4ADE80' }}>{formatCurrency(dealProjects.reduce((s, p) => s + (p.commission_amount || 0), 0))}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Paid: </span>
            <span style={{ fontWeight: 700, color: '#4ADE80' }}>{formatCurrency(dealProjects.filter(p => p.commission_status === 'paid').reduce((s, p) => s + (p.commission_amount || 0), 0))}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Pending: </span>
            <span style={{ fontWeight: 700, color: '#F87171' }}>{formatCurrency(dealProjects.filter(p => p.commission_status !== 'paid').reduce((s, p) => s + (p.commission_amount || 0), 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
