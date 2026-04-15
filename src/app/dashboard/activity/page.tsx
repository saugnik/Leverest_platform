'use client';

import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function getInitials(n: string) { return n?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?'; }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name?.charCodeAt(0) % g.length] || g[0];
}
function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day:'numeric',month:'short',hour:'2-digit',minute:'2-digit' }); }
function getActionPill(action: string) {
  const m: Record<string,{label:string;color:string}> = {
    stage_updated:    { label:'Stage Updated',    color:'pill-blue' },
    document_uploaded:{ label:'Doc Uploaded',     color:'pill-green' },
    query_raised:     { label:'Query Raised',     color:'pill-red' },
    note_added:       { label:'Note Added',       color:'pill-slate' },
    query_resolved:   { label:'Query Resolved',   color:'pill-emerald' },
    project_created:  { label:'Project Created',  color:'pill-blue' },
    document_status_updated: { label:'Doc Status Updated', color:'pill-slate' },
  };
  return m[action] || { label: action?.replace(/_/g, ' '), color: 'pill-slate' };
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, logsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/projects/activity?limit=200'),
        ]);
        
        const projectsData = await projectsRes.json();
        const logsData = await logsRes.json();
        
        if (projectsData.projects) setProjects(projectsData.projects);
        if (logsData.logs) setAllLogs(logsData.logs);
      } catch (err) {
        console.error('Failed to load activity data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = filterProject === 'all' ? allLogs : allLogs.filter(l => l.project_id === filterProject);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading activity logs...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Activity Log</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Full audit trail — {filtered.length} entries</div>
        </div>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Action</th>
                <th>Description</th>
                <th>Project</th>
                <th>Performed By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: any) => {
                const proj = projects.find(p => p.id === log.project_id);
                const pill = getActionPill(log.action);
                const performer = log.performed_by || 'System';
                return (
                  <tr key={log.id}>
                    <td><span className={`pill ${pill.color}`}>{pill.label}</span></td>
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-1)', lineHeight: 1.5 }}>{log.description || log.action?.replace(/_/g, ' ')}</div>
                    </td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{proj?.company_name || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: getGrad(performer), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {getInitials(performer)}
                        </div>
                        <span style={{ fontSize: '0.74rem' }}>{performer}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDateTime(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>No activity logs found.</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Activity will appear here as you work on projects.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
