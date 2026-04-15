'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function getInitials(n: string) { return n?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?'; }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name?.charCodeAt(0) % g.length] || g[0];
}
function getScore(s: number) {
  if (s >= 75) return '#4ADE80'; if (s >= 55) return '#FCD34D'; return '#F87171';
}

export default function KanbanPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, docsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/documents'),
        ]);
        
        const projectsData = await projectsRes.json();
        const docsData = await docsRes.json();
        
        if (projectsData.projects) setProjects(projectsData.projects);
        if (docsData.documents) setDocuments(docsData.documents);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading kanban...
      </div>
    );
  }

  function onDragStart(projectId: string) { setDragging(projectId); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  
  async function onDrop(stageId: string) {
    if (!dragging) return;
    
    const project = projects.find(p => p.id === dragging);
    if (project && project.stage !== stageId) {
      // Update locally first for immediate feedback
      setProjects(prev => prev.map(p => p.id === dragging ? { ...p, stage: stageId } : p));
      
      // Persist to API
      try {
        await fetch(`/api/projects/${dragging}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: stageId }),
        });
      } catch (err) {
        console.error('Failed to update project stage:', err);
        // Revert on error
        setProjects(prev => prev.map(p => p.id === dragging ? { ...p, stage: project.stage } : p));
      }
    }
    
    setDragging(null);
    setDragOver(null);
  }

  function getDocCompletion(projectId: string) {
    const projectDocs = documents.filter(d => d.project_id === projectId);
    if (projectDocs.length === 0) return 0;
    const received = projectDocs.filter(d => d.status === 'received').length;
    return Math.round((received / projectDocs.length) * 100);
  }

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Kanban Board</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          Drag & drop deals across pipeline stages · {projects.length} deals
        </div>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', minHeight: '500px' }}>
        {PIPELINE_STAGES.map(stage => {
          const stageProjects = projects.filter(p => p.stage === stage.id);
          const isOver = dragOver === stage.id;
          return (
            <div
              key={stage.id}
              style={{ minWidth: '220px', maxWidth: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
              onDrop={() => onDrop(stage.id)}
            >
              {/* Column header */}
              <div style={{
                padding: '10px 12px',
                background: 'var(--bg-card)',
                border: `1px solid ${isOver ? 'rgba(201,150,12,0.4)' : 'var(--bg-border)'}`,
                borderRadius: '8px',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)' }}>{stage.label}</div>
                  </div>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: stageProjects.length ? 'var(--gold-dim)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${stageProjects.length ? 'var(--gold-border)' : 'var(--bg-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.62rem', fontWeight: 800,
                    color: stageProjects.length ? '#F0B429' : 'var(--text-4)',
                  }}>
                    {stageProjects.length}
                  </div>
                </div>
                <div style={{ marginTop: '6px' }}>
                  <div className="progress-track sm">
                    <div className="progress-fill" style={{ width: `${(stageProjects.length / Math.max(projects.length, 1)) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Drop zone */}
              {isOver && dragging && (
                <div style={{
                  height: '60px', border: '2px dashed rgba(201,150,12,0.4)', borderRadius: '8px',
                  background: 'rgba(201,150,12,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', color: '#F0B429',
                }}>
                  Drop here
                </div>
              )}

              {/* Cards */}
              {stageProjects.map(p => {
                const comp = getDocCompletion(p.id);
                const score = p.approval_score || 0;
                const teamMembers = p.assigned_team || [];
                
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => onDragStart(p.id)}
                    onDragEnd={onDragEnd}
                    style={{
                      padding: '12px',
                      background: dragging === p.id ? 'var(--bg-hover)' : 'var(--bg-card)',
                      border: '1px solid var(--bg-border)',
                      borderRadius: '8px',
                      cursor: 'grab',
                      transition: 'all 0.15s',
                      opacity: dragging === p.id ? 0.5 : 1,
                    }}
                  >
                    {/* Company */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, background: getGrad(p.company_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: '#fff' }}>
                        {getInitials(p.company_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.company_name}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)' }}>{p.contact_person}</div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F0B429', marginBottom: '8px' }}>
                      {formatCurrency(p.loan_amount || 0)}
                    </div>

                    {/* Doc progress */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>Docs</span>
                        <span style={{ fontSize: '0.6rem', color: comp >= 70 ? '#4ADE80' : comp >= 40 ? '#FCD34D' : '#F87171', fontWeight: 700 }}>{comp}%</span>
                      </div>
                      <div className="progress-track sm"><div className="progress-fill" style={{ width: `${comp}%` }} /></div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--bg-border)' }}>
                      <div style={{ display: 'flex', gap: '-4px' }}>
                        {teamMembers.slice(0, 3).map((email: string) => {
                          const n = email.split('@')[0].replace('.', ' ');
                          return (
                            <div key={email} title={email} style={{ width: '18px', height: '18px', borderRadius: '50%', background: getGrad(email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.48rem', fontWeight: 700, color: '#fff', border: '1px solid var(--bg-card)', marginLeft: '-3px' }}>
                              {getInitials(n)}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: getScore(score) }}>{score}</span>
                        <Link href={`/dashboard/projects/${p.id}`} style={{ fontSize: '0.62rem', color: 'var(--gold)', textDecoration: 'none' }}>→</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
