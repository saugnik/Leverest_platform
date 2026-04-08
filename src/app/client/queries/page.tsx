'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_SPOCS, MOCK_QUERIES } from '@/lib/mock-data';
import { useState } from 'react';
import { Send } from 'lucide-react';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ClientQueriesPage() {
  const { user } = useAuth();
  const spoc = MOCK_SPOCS.find(s => s.email === user?.email);
  const queries = MOCK_QUERIES.filter(q => q.project_id === spoc?.project_id);
  const [responses, setResponses] = useState<Record<string, string>>({});

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '860px' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Bank Queries</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          {queries.filter(q => q.status !== 'resolved').length} open · {queries.filter(q => q.status === 'resolved').length} resolved
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {queries.map(q => (
          <div key={q.id} className="card" style={{ padding: '18px', borderLeft: `3px solid ${q.status === 'resolved' ? '#4ADE80' : q.priority === 'high' ? '#F87171' : '#FCD34D'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>{q.title}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`pill ${q.priority === 'high' ? 'pill-red' : q.priority === 'medium' ? 'pill-gold' : 'pill-slate'}`}>{q.priority} priority</span>
                  <span className={`pill ${q.status === 'resolved' ? 'pill-green' : q.status === 'in_progress' ? 'pill-gold' : 'pill-red'}`}>
                    {q.status === 'in_progress' ? 'In Progress' : q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                  </span>
                  <span className="pill pill-slate">{q.query_type}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{timeAgo(q.created_at)}</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '12px' }}>{q.description}</p>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: '14px' }}>
              Raised by <span style={{ color: 'var(--text-2)' }}>{q.raised_by_name}</span>
            </div>

            {q.response && (
              <div style={{ padding: '12px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '7px', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#4ADE80', fontWeight: 700, marginBottom: '5px' }}>YOUR RESPONSE</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-1)' }}>{q.response}</p>
              </div>
            )}

            {q.status !== 'resolved' && (
              <div>
                <textarea
                  placeholder="Type your response here…"
                  value={responses[q.id] || ''}
                  onChange={e => setResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="field"
                  style={{ minHeight: '72px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    disabled={!responses[q.id]?.trim()}
                  >
                    <Send size={12} /> Submit Response
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {queries.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
            No queries raised yet. Your Leverest team will update you here.
          </div>
        )}
      </div>
    </div>
  );
}
