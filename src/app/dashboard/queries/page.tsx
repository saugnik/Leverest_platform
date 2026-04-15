'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Plus, MessageSquare, CheckCircle2, Clock, AlertCircle, Search, Loader2, X } from 'lucide-react';

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function QueriesPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [allQueries, setAllQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [raising, setRaising] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState({ project_id: '', title: '', description: '', priority: 'normal' });

  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [qRes, pRes] = await Promise.all([
          fetch('/api/queries'),
          fetch('/api/projects')
        ]);
        const qData = await qRes.json();
        const pData = await pRes.json();
        setAllQueries(qData.queries || []);
        setProjects(pData.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = allQueries.filter(q => {
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchType = filterType === 'all' || q.source === filterType;
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const open = allQueries.filter(q => q.status === 'open').length;
  const resolved = allQueries.filter(q => q.status === 'resolved').length;

  function getProject(pid: string) {
    return projects.find(p => p.id === pid);
  }

  async function handleRaiseQuery() {
    if (!newQuery.project_id || !newQuery.title || !newQuery.description) return;
    
    setRaising(true);
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: newQuery.project_id,
          title: newQuery.title,
          description: newQuery.description,
          source: 'internal',
          priority: newQuery.priority,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.query) {
          setAllQueries(prev => [data.query, ...prev]);
        }
        setShowRaiseModal(false);
        setNewQuery({ project_id: '', title: '', description: '', priority: 'normal' });
      }
    } catch (err) {
      console.error('Failed to raise query:', err);
    } finally {
      setRaising(false);
    }
  }

  async function handleResolve(queryId: string) {
    setResolving(queryId);
    try {
      const res = await fetch(`/api/queries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_id: queryId, status: 'resolved' }),
      });
      
      if (res.ok) {
        setAllQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: 'resolved' } : q));
      }
    } catch (err) {
      console.error('Failed to resolve query:', err);
    } finally {
      setResolving(null);
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

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* Raise Query Modal */}
      {showRaiseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Raise New Query</div>
              <button onClick={() => setShowRaiseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Project *</label>
                <select value={newQuery.project_id} onChange={e => setNewQuery(p => ({ ...p, project_id: e.target.value }))} className="field">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.company_name || p.client_name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Query Title *</label>
                <input type="text" value={newQuery.title} onChange={e => setNewQuery(p => ({ ...p, title: e.target.value }))} className="field" placeholder="Brief summary of the query" />
              </div>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Description *</label>
                <textarea value={newQuery.description} onChange={e => setNewQuery(p => ({ ...p, description: e.target.value }))} className="field" style={{ minHeight: '100px' }} placeholder="Detailed description of the query..." />
              </div>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Priority</label>
                <select value={newQuery.priority} onChange={e => setNewQuery(p => ({ ...p, priority: e.target.value }))} className="field" style={{ width: 'auto' }}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowRaiseModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newQuery.project_id || !newQuery.title || !newQuery.description || raising} onClick={handleRaiseQuery}>
                {raising ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Raising...</> : <><Plus size={14} /> Raise Query</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Queries</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>{filtered.length} of {allQueries.length} shown</div>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowRaiseModal(true)}>
          <Plus size={14} /> Raise Query
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total', value: allQueries.length, color: 'var(--text-1)', bg: 'rgba(255,255,255,0.04)' },
          { label: 'Open', value: open, color: '#F87171', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Resolved', value: resolved, color: '#4ADE80', bg: 'rgba(34,197,94,0.08)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{k.label} Queries</div>
          </div>
        ))}
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {([['all','All'], ['open','Open'], ['resolved','Resolved']] as [string,string][]).map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val as any)} style={{
            padding: '5px 12px', borderRadius: '99px', border: '1px solid',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            borderColor: filterStatus === val ? 'rgba(201,150,12,0.5)' : 'rgba(255,255,255,0.08)',
            background: filterStatus === val ? 'rgba(201,150,12,0.12)' : 'transparent',
            color: filterStatus === val ? '#F0B429' : 'var(--text-3)',
          }}>{label}</button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input type="text" placeholder="Search queries…" value={search} onChange={e => setSearch(e.target.value)} className="field" style={{ paddingLeft: '32px' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Sources</option>
          <option value="bank">Bank</option>
          <option value="internal">Internal</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Query</th>
                <th>Project</th>
                <th>Source</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Raised By</th>
                <th>Date</th>
                <th>Age</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q: any) => {
                const proj = getProject(q.project_id);
                return (
                  <tr key={q.id}>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.8rem' }}>{q.title}</div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                        {q.description}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {proj?.client_name || '—'}
                    </td>
                    <td><span className="pill pill-slate" style={{ textTransform: 'capitalize' }}>{q.source}</span></td>
                    <td>
                      <span className="pill pill-slate">Normal</span>
                    </td>
                    <td>
                      <span className={`pill ${q.status === 'resolved' ? 'pill-green' : 'pill-red'}`}>
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.73rem' }}>{q.raised_by}</td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDate(q.created_at)}</td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{timeAgo(q.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {q.status !== 'resolved' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            disabled={resolving === q.id}
                            onClick={() => handleResolve(q.id)}
                          >
                            {resolving === q.id ? (
                              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <CheckCircle2 size={11} />
                            )}
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>No queries match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
