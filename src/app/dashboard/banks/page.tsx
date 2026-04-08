'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { MOCK_BANK_SUGGESTIONS, MOCK_PROJECTS, getProjectsByUser, formatCurrency } from '@/lib/mock-data';
import { Plus } from 'lucide-react';

export default function BanksPage() {
  const { user } = useAuth();
  const projects = getProjectsByUser(user?.email || '', user?.role || '');
  const projectIds = projects.map(p => p.id);
  const allBanks = MOCK_BANK_SUGGESTIONS.filter(b => projectIds.includes(b.project_id));
  const [filterProject, setFilterProject] = useState('all');

  const filtered = filterProject === 'all' ? allBanks : allBanks.filter(b => b.project_id === filterProject);

  // Group by bank name for summary
  const bankNames = [...new Set(allBanks.map(b => b.bank_name))];

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Bank Connect</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
            {allBanks.length} bank suggestions across {projects.length} projects
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="field" style={{ width: 'auto' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
          </select>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Suggest Bank
          </button>
        </div>
      </div>

      {/* Bank summary cards */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {bankNames.map(bank => {
          const count = allBanks.filter(b => b.bank_name === bank).length;
          const selected = allBanks.filter(b => b.bank_name === bank && b.is_selected).length;
          return (
            <div key={bank} style={{
              padding: '10px 16px', borderRadius: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '1.3rem' }}>🏦</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{bank}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{count} suggestions · {selected} selected</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Bank</th>
                <th>Project</th>
                <th>Interest Rate</th>
                <th>Processing Time</th>
                <th>Commission %</th>
                <th>Est. EMI / mo</th>
                <th>Client Status</th>
                <th>Suggested By</th>
                <th>Pros</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const proj = projects.find(p => p.id === b.project_id);
                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🏦</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.82rem' }}>{b.bank_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--gold)' }}>{proj?.company_name || '—'}</td>
                    <td style={{ color: '#F0B429', fontWeight: 800, fontSize: '0.9rem' }}>{b.interest_rate}%</td>
                    <td style={{ fontSize: '0.75rem' }}>{b.processing_time}</td>
                    <td style={{ color: '#4ADE80', fontWeight: 700 }}>{b.commission_percentage}%</td>
                    <td style={{ fontSize: '0.78rem' }}>{b.emi_estimate ? formatCurrency(b.emi_estimate) : '—'}</td>
                    <td>
                      {b.is_selected
                        ? <span className="pill pill-gold">✓ Selected by Client</span>
                        : <span className="pill pill-slate">Not selected</span>}
                    </td>
                    <td style={{ fontSize: '0.72rem' }}>{b.suggested_by.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {b.pros?.slice(0, 2).map((p: string) => (
                          <span key={p} style={{ fontSize: '0.6rem', background: 'rgba(34,197,94,0.08)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '4px', padding: '1px 5px' }}>{p}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>No bank suggestions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
