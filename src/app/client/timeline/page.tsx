'use client';

import { useAuth } from '@/context/auth-context';
import { PIPELINE_STAGES } from '@/lib/types';
import { getDynamicSpocs, getDynamicProjects } from '@/lib/dynamic';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const ACTION_ICONS: Record<string, string> = {
  stage_updated: '🔄', document_uploaded: '📄', bank_suggested: '🏦',
  query_raised: '❓', bank_selected: '✅', note_added: '📝',
  project_created: '✨', query_resolved: '✅',
};

export default function ClientTimelinePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const spoc = getDynamicSpocs().find(s => s.email === user?.email);
  const project = spoc ? (getDynamicProjects() as any[]).find(p => p.id === spoc.project_id) : null;

  useEffect(() => {
    async function loadActivity() {
      if (!spoc?.project_id) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/projects/activity?ids=${spoc.project_id}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (spoc) {
      loadActivity();
    } else {
      setLoading(false);
    }
  }, [spoc]);

  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === project?.stage);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading timeline...
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
        No project assigned.
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '860px' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Deal Timeline</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Full progress of your application</div>
      </div>

      {/* Pipeline card */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>8-STAGE DEAL PIPELINE</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const done = idx < currentStageIdx;
            const current = idx === currentStageIdx;
            return (
              <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: done ? '#C9960C' : current ? 'rgba(201,150,12,0.15)' : 'var(--bg-hover)',
                    border: `2px solid ${done ? '#C9960C' : current ? '#C9960C' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '0.7rem' : '0.62rem', fontWeight: 800,
                    color: done ? '#000' : current ? '#F0B429' : 'var(--text-4)',
                    boxShadow: current ? '0 0 0 4px rgba(201,150,12,0.15)' : 'none',
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div style={{ fontSize: '0.55rem', textAlign: 'center', width: '54px', color: current ? '#F0B429' : done ? 'var(--text-2)' : 'var(--text-4)', fontWeight: current ? 700 : 400 }}>
                    {stage.label}
                  </div>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: idx < currentStageIdx ? '#C9960C' : 'rgba(255,255,255,0.07)', margin: '0 2px', marginBottom: '20px' }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(201,150,12,0.08)', border: '1px solid rgba(201,150,12,0.2)', borderRadius: '7px' }}>
          <span style={{ fontSize: '0.74rem', color: '#F0B429' }}>
            ★ You are currently at Stage {currentStageIdx + 1}: <strong>{PIPELINE_STAGES[currentStageIdx]?.label}</strong>
          </span>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="card" style={{ padding: '18px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div className="card-header-title">Activity Log</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{logs.length} events</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {logs.map((log: any, i: number) => {
            const isLast = i === logs.length - 1;
            const performer = log.performed_by || 'System';
            return (
              <div key={log.id} style={{ display: 'flex', gap: '14px', paddingBottom: isLast ? 0 : '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--bg-card-2)', border: '1px solid var(--bg-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.88rem',
                  }}>
                    {ACTION_ICONS[log.action] || '📋'}
                  </div>
                  {!isLast && <div style={{ flex: 1, width: '1px', background: 'var(--bg-border)', marginTop: '4px' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : '2px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-1)', fontWeight: 500, lineHeight: 1.5 }}>{log.description || log.action?.replace(/_/g, ' ')}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{performer}</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-4)' }}>·</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-4)' }}>{fmtDateTime(log.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '0.88rem', marginBottom: '4px' }}>No activity yet.</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Activity will appear here as your deal progresses.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
