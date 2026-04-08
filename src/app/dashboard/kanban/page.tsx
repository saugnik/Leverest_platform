'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { MOCK_PROJECTS, getProjectsByUser, formatCurrency, getProjectDocCompletionPercent } from '@/lib/mock-data';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';

function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}
function getScore(s: number) {
  if (s >= 75) return '#4ADE80'; if (s >= 55) return '#FCD34D'; return '#F87171';
}

export default function KanbanPage() {
  const { user } = useAuth();
  const allProjects = getProjectsByUser(user?.email || '', user?.role || '');
  const [projects, setProjects] = useState(allProjects);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  function onDragStart(projectId: string) { setDragging(projectId); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  function onDrop(stageId: string) {
    if (!dragging) return;
    setProjects(prev => prev.map(p => p.id === dragging ? { ...p, stage: stageId as any } : p));
    setDragging(null); setDragOver(null);
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
                const comp = getProjectDocCompletionPercent(p.id);
                const score = p.approval_score || 0;
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
                        {p.assigned_team.slice(0, 3).map(email => {
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
