'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_SPOCS, MOCK_ACTIVITY_LOGS, MOCK_PROJECTS } from '@/lib/mock-data';
import { PIPELINE_STAGES } from '@/lib/types';

function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTION_ICONS: Record<string, string> = {
  stage_updated: '🔄', document_uploaded: '📄', bank_suggested: '🏦',
  query_raised: '❓', bank_selected: '✅', note_added: '📝',
};

export default function ClientTimelinePage() {
  const { user } = useAuth();
  const spoc = MOCK_SPOCS.find(s => s.email === user?.email);
  const project = spoc ? MOCK_PROJECTS.find(p => p.id === spoc.project_id) : null;
  const logs = MOCK_ACTIVITY_LOGS.filter(l => l.project_id === spoc?.project_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === project?.stage);

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
          {logs.map((log, i) => {
            const isLast = i === logs.length - 1;
            return (
              <div key={log.id} style={{ display: 'flex', gap: '14px', paddingBottom: isLast ? 0 : '16px' }}>
                {/* Timeline line */}
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
                {/* Content */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : '2px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-1)', fontWeight: 500, lineHeight: 1.5 }}>{log.description}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{log.performed_by_name}</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-4)' }}>·</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-4)' }}>{fmtDateTime(log.created_at)}</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-4)' }}>·</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{timeAgo(log.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>No activity yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
