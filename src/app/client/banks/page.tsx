'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_SPOCS, MOCK_BANK_SUGGESTIONS, MOCK_PROJECTS, formatCurrency } from '@/lib/mock-data';
import { CheckCircle2 } from 'lucide-react';

export default function ClientBanksPage() {
  const { user } = useAuth();
  const spoc = MOCK_SPOCS.find(s => s.email === user?.email);
  const banks = MOCK_BANK_SUGGESTIONS.filter(b => b.project_id === spoc?.project_id);
  const project = spoc ? MOCK_PROJECTS.find(p => p.id === spoc.project_id) : null;

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '860px' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Bank Options</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          {banks.length} banks suggested by Leverest for your loan requirement of {project ? formatCurrency(project.loan_amount || 0) : ''}
        </div>
      </div>

      {/* Comparison table */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><div className="card-header-title">Comparison Table</div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Bank</th>
                <th>Interest Rate</th>
                <th>Processing Time</th>
                <th>Est. EMI / month</th>
                <th>Our Commission</th>
                <th>Your Selection</th>
              </tr>
            </thead>
            <tbody>
              {banks.map(b => (
                <tr key={b.id} style={{ background: b.is_selected ? 'rgba(201,150,12,0.04)' : 'transparent' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>🏦</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.84rem' }}>{b.bank_name}</div>
                        {b.is_selected && <div style={{ fontSize: '0.6rem', color: '#F0B429', fontWeight: 700 }}>★ YOUR CHOICE</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#F0B429', fontWeight: 800, fontSize: '1rem' }}>{b.interest_rate}% p.a.</td>
                  <td style={{ fontSize: '0.8rem' }}>{b.processing_time}</td>
                  <td style={{ fontWeight: 700, fontSize: '0.84rem' }}>{b.emi_estimate ? formatCurrency(b.emi_estimate) : '—'}</td>
                  <td style={{ fontSize: '0.74rem', color: 'var(--text-3)' }}>{b.commission_percentage}%</td>
                  <td>
                    {b.is_selected
                      ? <span className="pill pill-gold">✓ Selected</span>
                      : <button className="btn btn-ghost btn-sm">Select This Bank</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {banks.map(b => (
          <div key={b.id} className="card" style={{ padding: '20px', border: b.is_selected ? '1px solid rgba(201,150,12,0.35)' : '1px solid var(--bg-border)', background: b.is_selected ? 'rgba(201,150,12,0.03)' : 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏦</span>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>{b.bank_name}</div>
                {b.is_selected && <div style={{ fontSize: '0.65rem', color: '#F0B429', fontWeight: 700 }}>★ SELECTED BY YOU</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '14px' }}>
              {[
                { label: 'Interest Rate', value: `${b.interest_rate}% p.a.`, color: '#F0B429' },
                { label: 'Processing Time', value: b.processing_time, color: 'var(--text-1)' },
                { label: 'Commission', value: `${b.commission_percentage}%`, color: '#4ADE80' },
                { label: 'Est. EMI / mo', value: b.emi_estimate ? formatCurrency(b.emi_estimate) : '—', color: 'var(--text-1)' },
              ].map(m => (
                <div key={m.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {b.pros && b.pros.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '6px' }}>PROS</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {b.pros.map((p: string) => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#4ADE80', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '5px', padding: '3px 8px' }}>
                      <CheckCircle2 size={10} /> {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!b.is_selected && (
              <button className="btn btn-secondary btn-sm">Select {b.bank_name} →</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
