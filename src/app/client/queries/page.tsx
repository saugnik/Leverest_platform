'use client';

import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { getDynamicSpocs } from '@/lib/dynamic';

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
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  const spoc = getDynamicSpocs().find(s => s.email === user?.email);

  useEffect(() => {
    async function loadQueries() {
      if (!spoc?.project_id) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/queries?project_id=${spoc.project_id}`);
        if (res.ok) {
          const data = await res.json();
          setQueries(data.queries || []);
        }
      } catch (err) {
        console.error('Failed to load queries:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (spoc) {
      loadQueries();
    } else {
      setLoading(false);
    }
  }, [spoc]);

  async function submitResponse(queryId: string) {
    const response = responses[queryId];
    if (!response?.trim()) return;
    
    setSubmitting(queryId);
    
    try {
      // For now, we'll add a note with the response
      // The API would need a response field added to queries table
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: spoc?.project_id,
          title: `Response to Query #${queryId}`,
          description: response,
          source: 'client_response',
        }),
      });
      
      if (res.ok) {
        // Clear the response field
        setResponses(prev => ({ ...prev, [queryId]: '' }));
        // Show success feedback (in real implementation, this would update the query)
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading queries...
      </div>
    );
  }

  const openQueries = queries.filter(q => q.status !== 'resolved');
  const resolvedQueries = queries.filter(q => q.status === 'resolved');

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '860px' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Bank Queries</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          {openQueries.length} open · {resolvedQueries.length} resolved
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {queries.map((q: any) => (
          <div key={q.id} className="card" style={{ padding: '18px', borderLeft: `3px solid ${q.status === 'resolved' ? '#4ADE80' : '#FCD34D'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>{q.title}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`pill ${q.status === 'resolved' ? 'pill-green' : 'pill-gold'}`}>
                    {q.status === 'resolved' ? 'Resolved' : 'Open'}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{timeAgo(q.created_at)}</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '12px' }}>{q.description}</p>

            {q.status !== 'resolved' && (
              <div>
                <textarea
                  placeholder="Type your response here and submit..."
                  value={responses[q.id] || ''}
                  onChange={e => setResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="field"
                  style={{ minHeight: '72px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }} 
                    disabled={!responses[q.id]?.trim() || submitting === q.id}
                    onClick={() => submitResponse(q.id)}
                  >
                    {submitting === q.id ? (
                      <>
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={12} /> Submit Response
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {queries.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '0.88rem', marginBottom: '4px' }}>No queries raised yet.</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Your Leverest team will update you here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
