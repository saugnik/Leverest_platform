'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_ACTIVITY_LOGS, MOCK_PROJECTS, getProjectsByUser } from '@/lib/mock-data';
import { useState } from 'react';

function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}
function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day:'numeric',month:'short',hour:'2-digit',minute:'2-digit' }); }
function getActionPill(action: string) {
  const m: Record<string,{label:string;color:string}> = {
    stage_updated:    { label:'Stage Updated',    color:'pill-blue' },
    document_uploaded:{ label:'Doc Uploaded',     color:'pill-green' },
    bank_suggested:   { label:'Bank Suggested',   color:'pill-gold' },
    query_raised:     { label:'Query Raised',     color:'pill-red' },
    bank_selected:    { label:'Bank Selected',    color:'pill-cyan' },
    note_added:       { label:'Note Added',       color:'pill-slate' },
    query_resolved:   { label:'Query Resolved',   color:'pill-emerald' },
  };
  return m[action] || { label: action, color: 'pill-slate' };
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const projects = getProjectsByUser(user?.email || '', user?.role || '');
  const projectIds = projects.map(p => p.id);
  const allLogs = MOCK_ACTIVITY_LOGS.filter(l => projectIds.includes(l.project_id));
  const [filterProject, setFilterProject] = useState('all');

  const filtered = filterProject === 'all' ? allLogs : allLogs.filter(l => l.project_id === filterProject);

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
              {filtered.map((log, i) => {
                const proj = MOCK_PROJECTS.find(p => p.id === log.project_id);
                const pill = getActionPill(log.action);
                return (
                  <tr key={log.id}>
                    <td><span className={`pill ${pill.color}`}>{pill.label}</span></td>
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-1)', lineHeight: 1.5 }}>{log.description}</div>
                    </td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{proj?.company_name || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: getGrad(log.performed_by_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {getInitials(log.performed_by_name)}
                        </div>
                        <span style={{ fontSize: '0.74rem' }}>{log.performed_by_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDateTime(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>No activity logs found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
