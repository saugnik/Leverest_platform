'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { PIPELINE_STAGES } from '@/lib/types';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

function getInitials(n: string) { return n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'; }
function getGrad(name: string) {
  if (!name) return 'transparent';
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)', 'linear-gradient(135deg,#8B5CF6,#EC4899)'];
  return g[name.charCodeAt(0) % g.length];
}
function getStageLabel(s: string) {
  const stg = PIPELINE_STAGES.find(x => x.id === s);
  return stg ? stg.label : s;
}

export default function PipelineAnalyticsPage() {
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.projects) setAllProjects(data.projects);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-3)' }}>Loading pipeline analytics...</div>;

  // 1. Overall Pipeline
  const overallStages: Record<string, number> = {};
  PIPELINE_STAGES.forEach(s => overallStages[s.id] = 0);
  allProjects.forEach(p => {
    if (overallStages[p.stage] !== undefined) {
      overallStages[p.stage] += 1;
    }
  });

  // 2. Individual Pipeline (by created_by or assigned_team)
  // To evaluate "who brought", we look at created_by usually, or contact person. Let's use created_by.
  const creatorStats: Record<string, { total: number, stages: Record<string, number> }> = {};
  
  allProjects.forEach(p => {
    const creator = p.created_by || 'Unknown';
    if (!creatorStats[creator]) {
      creatorStats[creator] = { total: 0, stages: {} };
      PIPELINE_STAGES.forEach(s => creatorStats[creator].stages[s.id] = 0);
    }
    creatorStats[creator].total += 1;
    if (creatorStats[creator].stages[p.stage] !== undefined) {
      creatorStats[creator].stages[p.stage] += 1;
    }
  });

  const creators = Object.keys(creatorStats).sort((a,b) => creatorStats[b].total - creatorStats[a].total);

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(201,150,12,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(201,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={20} color="#F0B429" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.1 }}>Pipeline Distribution</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '4px' }}>Track overall company pipeline and individual performance.</div>
        </div>
      </div>

      {/* OVERALL PIPELINE */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <TrendingUp size={16} color="var(--gold)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Overall Pipeline Breakdown</h2>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-3)' }}>{allProjects.length} Total Projects</span>
        </div>
        <div className="slider-container" style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px', scrollSnapType: 'x mandatory' }}>
          {PIPELINE_STAGES.map(stage => {
            const count = overallStages[stage.id] || 0;
            const pct = allProjects.length > 0 ? Math.round((count / allProjects.length) * 100) : 0;
            return (
              <div key={stage.id} style={{ minWidth: '180px', flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', padding: '16px', background: 'var(--bg-hover)', borderRadius: '8px', border: count > 0 ? '1px solid rgba(201,150,12,0.2)' : '1px solid transparent' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', minHeight: '30px' }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: count > 0 ? '#F0B429' : 'var(--text-4)', lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ marginTop: '12px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: count > 0 ? '#F0B429' : '#333' }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', marginTop: '6px' }}>{pct}% of pipeline</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INDIVIDUAL PIPELINE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginLeft: '4px' }}>
          <Users size={16} color="var(--text-2)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-2)' }}>Individual Sourcing & Distribution</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {creators.map(creator => {
            const cName = creator === 'Unknown' ? 'Unknown Tracker' : creator.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            const stats = creatorStats[creator];
            return (
              <div key={creator} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getGrad(cName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {getInitials(cName)}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>{cName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{creator}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Total Sourced</div>
                      <div style={{ padding: '4px 10px', background: 'rgba(201,150,12,0.1)', border: '1px solid rgba(201,150,12,0.2)', borderRadius: '6px', fontSize: '1rem', fontWeight: 800, color: '#F0B429' }}>
                        {stats.total} Projects
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage breakdown bar */}
                <div className="slider-container" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '12px', scrollSnapType: 'x mandatory' }}>
                  {PIPELINE_STAGES.map(stage => {
                    const count = stats.stages[stage.id] || 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={stage.id} style={{ minWidth: '130px', flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '32px', fontSize: '0.65rem', color: count > 0 ? 'var(--text-2)' : 'var(--text-4)', fontWeight: count > 0 ? 600 : 400, marginBottom: '6px', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={stage.label}>
                          {getStageLabel(stage.id)}
                        </div>
                        <div style={{ height: '36px', background: count > 0 ? 'rgba(59,130,246,0.08)' : 'var(--bg-hover)', border: count > 0 ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, bottom: 0, top: 0, background: 'rgba(59,130,246,0.15)', width: `${pct}%`, transition: 'width 0.4s ease' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: count > 0 ? '#3B82F6' : 'var(--text-4)', zIndex: 1 }}>{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {creators.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>No data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
