'use client';

import { useAuth } from '@/context/auth-context';
import {
  MOCK_PROJECTS, MOCK_ACTIVITY_LOGS, getProjectsByUser,
  formatCurrency, getProjectDocCompletionPercent
} from '@/lib/mock-data';
import { canViewFinanceData } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, FolderKanban, CheckCircle2, DollarSign, AlertTriangle, ChevronRight, Clock, ExternalLink } from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}
function getPillClass(stage: string) {
  return `pill stage-${stage}`;
}
function getStageLabel(s: string) {
  const m: Record<string,string> = {
    lead_received:'Lead',meeting_done:'Meeting',documents_requested:'Docs Requested',
    internal_processing:'Processing',proposal_sent:'Proposal Sent',approved:'Approved',
  };
  return m[s] || s;
}
function getLoanTypeLabel(t: string) {
  const m: Record<string,string> = { working_capital:'Working Capital',term_loan:'Term Loan',od_cc:'OD / CC',project_finance:'Project Finance',equipment_finance:'Equipment Finance' };
  return m[t] || t;
}
function getScore(score: number) {
  if (score >= 75) return { cls: 'score-high', color: '#4ADE80' };
  if (score >= 55) return { cls: 'score-mid', color: '#FCD34D' };
  return { cls: 'score-low', color: '#F87171' };
}

const AREA_DATA = [
  { m: 'Oct', v: 0 }, { m: 'Nov', v: 0 }, { m: 'Dec', v: 0 },
  { m: 'Jan', v: 0 }, { m: 'Feb', v: 0 }, { m: 'Mar', v: 0 }, { m: 'Apr', v: 0 },
];


function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'accounts') {
      router.replace('/dashboard/commission');
    }
  }, [user, router]);

  const projects = getProjectsByUser(user?.email || '', user?.role || '');
  const canViewFinance = canViewFinanceData(user?.role);

  if (user?.role === 'accounts') {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>Redirecting to Finance view...</div>;
  }

  const totalLoan      = projects.reduce((s, p) => s + (p.loan_amount || 0), 0);
  const active         = projects.filter(p => !['approved','lead_received'].includes(p.stage)).length;
  const approved       = projects.filter(p => p.stage === 'approved').length;
  const totalComm      = projects.reduce((s, p) => s + (p.commission_amount || 0), 0);
  const needsAttention = projects.filter(p => (p.approval_score || 100) < 60);

  const pendingQueries = 0; // Will be populated from real data
  const docCompletion  = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + getProjectDocCompletionPercent(p.id), 0) / projects.length) : 0;

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
          {greeting()}, <span style={{ color: 'var(--gold-light)' }}>{user?.name?.split(' ')[0]}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          Leverest Kolkata Branch · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {(canViewFinance ? [
          {
            label: 'Total Loan Value', value: formatCurrency(totalLoan),
            icon: TrendingUp, bg: 'rgba(201,150,12,0.1)', color: '#F0B429',
            sub: `${projects.length} projects`, trend: '+18% MoM',
          },
          {
            label: 'Active Deals', value: active,
            icon: FolderKanban, bg: 'rgba(96,165,250,0.1)', color: '#60A5FA',
            sub: 'In pipeline',
          },
          {
            label: 'Approved', value: approved,
            icon: CheckCircle2, bg: 'rgba(34,197,94,0.1)', color: '#4ADE80',
            sub: 'This quarter',
          },
          {
            label: 'Commission', value: formatCurrency(totalComm),
            icon: DollarSign, bg: 'rgba(167,139,250,0.1)', color: '#A78BFA',
            sub: 'Across all deals',
          },
        ] : [
          {
            label: 'My Projects', value: projects.length,
            icon: FolderKanban, bg: 'rgba(96,165,250,0.1)', color: '#60A5FA',
            sub: 'Assigned to you',
          },
          {
            label: 'Active Deals', value: active,
            icon: TrendingUp, bg: 'rgba(201,150,12,0.1)', color: '#F0B429',
            sub: 'In pipeline',
          },
          {
            label: 'Pending Queries', value: pendingQueries,
            icon: AlertTriangle, bg: 'rgba(245,158,11,0.1)', color: '#F59E0B',
            sub: 'Needs response',
          },
          {
            label: 'Avg Doc Completion', value: `${docCompletion}%`,
            icon: CheckCircle2, bg: 'rgba(34,197,94,0.1)', color: '#4ADE80',
            sub: 'Across projects',
          },
        ]).map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="stat-card" key={kpi.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-icon" style={{ background: kpi.bg }}>
                  <Icon size={16} color={kpi.color} />
                </div>
                {kpi.trend && (
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#4ADE80', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: '99px' }}>
                    {kpi.trend}
                  </div>
                )}
              </div>
              <div className="stat-value">{kpi.value}</div>
              <div className="stat-label">{kpi.label} · {kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: canViewFinance ? '2fr 1fr' : '1fr', gap: '16px', marginBottom: '1.5rem' }}>
        {canViewFinance && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Deal Volume (₹ Cr)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Last 7 months</div>
            </div>
            <div style={{ padding: '16px', height: '190px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AREA_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9960C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C9960C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#4E647F' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#4E647F' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.76rem', color: '#EEF2FF' }} />
                  <Area type="monotone" dataKey="v" stroke="#C9960C" strokeWidth={2} fill="url(#gv)" dot={false} activeDot={{ r: 4, fill: '#F0B429' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div className="card-header-title">Pipeline Distribution</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{projects.length} total</div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              const stageData = [
                { id: 'lead_received',       label: 'Lead Received',   color: '#64748B', emoji: '📥' },
                { id: 'meeting_done',        label: 'Meeting Done',    color: '#3B82F6', emoji: '🤝' },
                { id: 'documents_requested', label: 'Docs Requested',  color: '#8B5CF6', emoji: '📋' },
                { id: 'internal_processing', label: 'Processing',      color: '#F59E0B', emoji: '⚙️' },
                { id: 'proposal_sent',       label: 'Proposal Sent',   color: '#06B6D4', emoji: '📤' },
                { id: 'approved',            label: 'Approved',        color: '#22C55E', emoji: '✅' },
              ];

              const counts = stageData.map((s) => ({
                ...s,
                count: projects.filter((p) => p.stage === s.id).length,
              }));
              const maxCount = Math.max(...counts.map((c) => c.count), 1);

              return counts.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '100px', fontSize: '0.7rem', color: 'var(--text-2)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    <span style={{ fontSize: '0.72rem' }}>{item.emoji}</span>
                    {item.label}
                  </div>
                  <div style={{ flex: 1, height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    {item.count > 0 && (
                      <div style={{
                        height: '100%',
                        width: `${(item.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                        minWidth: '12px',
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 700, color: item.count > 0 ? item.color : 'var(--text-4)',
                    width: '20px', textAlign: 'right', flexShrink: 0,
                  }}>
                    {item.count}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── Main: Active Projects Table + Needs Attention + Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        {/* Active Projects Table */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Active Projects</div>
              <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Loan Type</th>
                    {canViewFinance && <th>Amount</th>}
                    <th>Stage</th>
                    <th style={{ textAlign: 'center' }}>Docs %</th>
                    {canViewFinance && <th style={{ textAlign: 'center' }}>Score</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const comp = getProjectDocCompletionPercent(p.id);
                    const score = p.approval_score || 0;
                    const sc = getScore(score);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                              background: getGrad(p.company_name),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                            }}>
                              {getInitials(p.company_name)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>{p.company_name}</div>
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{p.contact_person}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{getLoanTypeLabel(p.loan_type || '')}</td>
                        {canViewFinance && <td className="td-gold">{formatCurrency(p.loan_amount || 0)}</td>}
                        <td><span className={getPillClass(p.stage)}>{getStageLabel(p.stage)}</span></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: comp >= 70 ? '#4ADE80' : comp >= 40 ? '#FCD34D' : '#F87171' }}>{comp}%</div>
                            <div className="progress-track" style={{ width: '52px' }}>
                              <div className="progress-fill" style={{ width: `${comp}%` }} />
                            </div>
                          </div>
                        </td>
                        {canViewFinance && (
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: sc.color }}>{score}</span>
                          </td>
                        )}
                        <td>
                          <Link href={`/dashboard/projects/${p.id}`} style={{ color: 'var(--text-3)', display: 'flex', justifyContent: 'center' }}>
                            <ExternalLink size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <AlertTriangle size={13} color="#F59E0B" />
                  <div className="card-header-title">Needs Attention</div>
                </div>
              </div>
              <div style={{ padding: '10px 0' }}>
                {needsAttention.map((p) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 16px',
                      borderBottom: '1px solid var(--bg-border)',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                        background: p.approval_score && p.approval_score < 50 ? '#EF4444' : '#F59E0B',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.company_name}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#F87171' }}>
                          Score: {p.approval_score}
                        </div>
                      </div>
                      <ChevronRight size={12} color="var(--text-4)" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-header-title">Recent Activity</div>
              <Link href="/dashboard/activity" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                Full log <ChevronRight size={12} />
              </Link>
            </div>
            <div>
              {MOCK_ACTIVITY_LOGS.slice(0, 5).map((log, i) => {
                const proj = MOCK_PROJECTS.find((p) => p.id === log.project_id);
                const isLast = i === MOCK_ACTIVITY_LOGS.slice(0, 5).length - 1;
                return (
                  <div key={log.id} style={{
                    display: 'flex', gap: '10px',
                    padding: '10px 16px',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: getGrad(log.performed_by_name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.58rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {getInitials(log.performed_by_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-1)', lineHeight: 1.4 }}>{log.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{log.performed_by_name}</span>
                        {proj && (
                          <>
                            <span style={{ color: 'var(--text-4)', fontSize: '0.65rem' }}>·</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>{proj.company_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
