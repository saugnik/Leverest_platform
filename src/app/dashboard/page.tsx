'use client';

import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/utils';
import { canViewFinanceData } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, FolderKanban, CheckCircle2, DollarSign, AlertTriangle, ChevronRight, Clock, ExternalLink, Calendar, Users, Plane, Briefcase, X, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}
function getPillClass(stage: string) {
  return `pill stage-${stage}`;
}
function getStageLabel(s: string) {
  const m: Record<string,string> = {
    lead_received:'Lead',meeting_done:'Meeting',documents_requested:'Docs Requested',
    internal_processing:'Processing',proposal_sent:'Proposal Sent',approved:'Approved',
  };
  return m[s] || s;
}
function getLoanTypeLabel(t: string) {
  const m: Record<string,string> = { working_capital:'Working Capital',term_loan:'Term Loan',od_cc:'OD / CC',project_finance:'Project Finance',equipment_finance:'Equipment Finance' };
  return m[t] || t;
}
function getScore(score: number) {
  if (score >= 75) return { cls: 'score-high', color: '#4ADE80' };
  if (score >= 55) return { cls: 'score-mid', color: '#FCD34D' };
  return { cls: 'score-low', color: '#F87171' };
}

const AREA_DATA = [
  { m: 'Oct', v: 0 }, { m: 'Nov', v: 0 }, { m: 'Dec', v: 0 },
  { m: 'Jan', v: 0 }, { m: 'Feb', v: 0 }, { m: 'Mar', v: 0 }, { m: 'Apr', v: 0 },
];


function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}


// ─── Modal Overlay ──────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
        borderRadius: '12px', width: '420px', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {children}
      </div>
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--bg-border)', borderRadius: '6px',
  color: 'var(--text-1)', fontSize: '0.8rem', outline: 'none',
};
const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px', display: 'block',
};
const STATUS_OPTIONS = ['Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected'] as const;
const STATUS_COLORS: Record<string, string> = {
  Screening: '#60A5FA', Interviewing: '#FCD34D', Offered: '#A78BFA', Hired: '#4ADE80', Rejected: '#F87171',
};

type Candidate = { id: string; name: string; role: string; status: string; addedAt: string };
type CalEvent = { id: string; title: string; start: string; end: string; backgroundColor: string };

// ─── EA Dashboard Component ─────────────────────────────────────────────────
function EADashboard({ user, projects, activityLogs, router }: { user: any; projects: any[]; activityLogs: any[]; router: any }) {
  const stuckProjects = projects.filter((p: any) => ['documents_requested', 'internal_processing'].includes(p.stage));

  // ── Candidates state ──
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ea_candidates');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', role: '', status: 'Screening' });

  // ── Calendar events state ──
  const [calEvents, setCalEvents] = useState<CalEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ea_cal_events');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', startTime: '10:00', endTime: '11:00', person: '' });

  // ── Notes state ──
  const [notes, setNotes] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ea_travel_notes') || '';
    }
    return '';
  });

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('ea_candidates', JSON.stringify(candidates)); }, [candidates]);
  useEffect(() => { localStorage.setItem('ea_cal_events', JSON.stringify(calEvents)); }, [calEvents]);

  function addCandidate() {
    if (!newCandidate.name || !newCandidate.role) return;
    setCandidates(prev => [...prev, {
      id: Date.now().toString(), name: newCandidate.name,
      role: newCandidate.role, status: newCandidate.status,
      addedAt: new Date().toISOString(),
    }]);
    setNewCandidate({ name: '', role: '', status: 'Screening' });
    setShowAddCandidate(false);
  }

  function removeCandidate(id: string) {
    setCandidates(prev => prev.filter(c => c.id !== id));
  }

  function cycleStatus(id: string) {
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = STATUS_OPTIONS.indexOf(c.status as any);
      const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
      return { ...c, status: next };
    }));
  }

  function addEvent() {
    if (!newEvent.title || !newEvent.date) return;
    const color = ['#3B82F6', '#F59E0B', '#8B5CF6', '#22C55E', '#EC4899'][calEvents.length % 5];
    setCalEvents(prev => [...prev, {
      id: Date.now().toString(),
      title: newEvent.person ? `${newEvent.title} - ${newEvent.person}` : newEvent.title,
      start: `${newEvent.date}T${newEvent.startTime}:00`,
      end: `${newEvent.date}T${newEvent.endTime}:00`,
      backgroundColor: color,
    }]);
    setNewEvent({ title: '', date: '', startTime: '10:00', endTime: '11:00', person: '' });
    setShowSchedule(false);
  }

  function removeEvent(id: string) {
    setCalEvents(prev => prev.filter(e => e.id !== id));
  }

  function saveNotes(val: string) {
    setNotes(val);
    localStorage.setItem('ea_travel_notes', val);
  }

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
          {greeting()}, <span style={{ color: 'var(--gold-light)' }}>{user?.name?.split(' ')[0]}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          Executive Assistant Dashboard · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        {/* Main Column: Calendar & Logistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--gold)" />
                <div className="card-header-title">Team Appointments & Schedule</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowSchedule(true)}
                  style={{
                    background: 'var(--gold)', color: '#000', border: 'none',
                    padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <Plus size={12} /> Schedule
                </button>
              </div>
            </div>
            <div style={{ padding: '16px', height: '380px' }}>
              <style>{`
                .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.1); }
                .fc { color: var(--text-2); font-size: 0.8rem; }
                .fc-toolbar-title { font-size: 1.1rem !important; color: var(--text-1); font-family: var(--font-playfair); }
                .fc-button-primary { background-color: var(--bg-card-hover) !important; border-color: var(--bg-border) !important; color: var(--text-1) !important; }
                .fc-button-active { background-color: var(--gold) !important; color: #000 !important; border-color: var(--gold) !important; }
              `}</style>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                height="100%"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                events={calEvents}
                eventClick={(info) => {
                  if (confirm(`Delete "${info.event.title}"?`)) {
                    const id = calEvents.find(e => e.title === info.event.title && e.start === info.event.startStr)?.id;
                    if (id) removeEvent(id);
                  }
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane size={16} color="var(--gold)" />
                <div className="card-header-title">Travel & Logistics Notes</div>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <textarea
                style={{
                  width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--bg-border)', borderRadius: '6px', padding: '10px',
                  color: 'var(--text-1)', fontSize: '0.8rem', resize: 'vertical', outline: 'none',
                }}
                placeholder="Log flights, hotel bookings, specific follow-up times here..."
                value={notes}
                onChange={(e) => saveNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Follow-ups + Hiring */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#F87171" />
                <div className="card-header-title">Requires Follow Up</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Stuck Projects</div>
            </div>
            <div style={{ padding: '0' }}>
              {stuckProjects.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                  No pending follow-ups.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {stuckProjects.map((p: any) => {
                    return (
                      <div key={p.id} style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--bg-border)',
                        display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '6px',
                          background: getGrad(p.company_name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0
                        }}>
                          {getInitials(p.company_name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.company_name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#F87171', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> Stuck in: {getStageLabel(p.stage)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#60A5FA" />
                <div className="card-header-title">Recent Client Activity</div>
              </div>
            </div>
            <div>
              {activityLogs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                  No recent activity.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activityLogs.slice(0, 4).map((log: any, i: number) => {
                    const isLast = i === 0;
                    return (
                      <div key={log.id} style={{
                        display: 'flex', gap: '10px', padding: '10px 16px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-1)', lineHeight: 1.4 }}>{log.description || log.action}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{log.performed_by}</span>
                            <span style={{ color: 'var(--text-4)', fontSize: '0.65rem' }}>·</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Hiring Pipeline ── */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="#A78BFA" />
                <div className="card-header-title">Hiring Pipeline</div>
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '99px' }}>
                {candidates.length}
              </div>
            </div>
            <div style={{ padding: '0' }}>
              {candidates.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                  No candidates currently in the pipeline.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {candidates.map((c) => (
                    <div key={c.id} style={{
                      padding: '10px 16px', borderBottom: '1px solid var(--bg-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{c.role}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => cycleStatus(c.id)}
                          title="Click to change status"
                          style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            color: STATUS_COLORS[c.status] || '#94A3B8',
                            background: `${STATUS_COLORS[c.status] || '#94A3B8'}15`,
                            padding: '3px 8px', borderRadius: '4px',
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          {c.status}
                        </button>
                        <button
                          onClick={() => removeCandidate(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '2px' }}
                          title="Remove candidate"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAddCandidate(true)}
                style={{
                  width: '100%', background: 'transparent', border: 'none', borderTop: '1px solid var(--bg-border)',
                  padding: '10px', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <Plus size={12} /> Add Candidate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Candidate Modal ── */}
      {showAddCandidate && (
        <ModalOverlay onClose={() => setShowAddCandidate(false)}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>
                Add Candidate
              </div>
              <button onClick={() => setShowAddCandidate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={LABEL_STYLE}>Candidate Name</label>
                <input style={INPUT_STYLE} placeholder="e.g. Anjali Mehra"
                  value={newCandidate.name} onChange={e => setNewCandidate(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Position / Role</label>
                <input style={INPUT_STYLE} placeholder="e.g. Credit Analyst"
                  value={newCandidate.role} onChange={e => setNewCandidate(p => ({ ...p, role: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Status</label>
                <select style={{ ...INPUT_STYLE }} value={newCandidate.status}
                  onChange={e => setNewCandidate(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={addCandidate}
                disabled={!newCandidate.name || !newCandidate.role}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                  background: (!newCandidate.name || !newCandidate.role) ? 'rgba(255,255,255,0.05)' : 'var(--gold)',
                  color: (!newCandidate.name || !newCandidate.role) ? 'var(--text-4)' : '#000',
                  fontWeight: 700, fontSize: '0.82rem', cursor: (!newCandidate.name || !newCandidate.role) ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                Add Candidate
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Schedule Meeting Modal ── */}
      {showSchedule && (
        <ModalOverlay onClose={() => setShowSchedule(false)}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>
                Schedule Meeting
              </div>
              <button onClick={() => setShowSchedule(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={LABEL_STYLE}>Meeting Title</label>
                <input style={INPUT_STYLE} placeholder="e.g. Client Meeting"
                  value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Person / Assignee</label>
                <input style={INPUT_STYLE} placeholder="e.g. Pawan Lohia"
                  value={newEvent.person} onChange={e => setNewEvent(p => ({ ...p, person: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Date</label>
                <input type="date" style={INPUT_STYLE}
                  value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL_STYLE}>Start Time</label>
                  <input type="time" style={INPUT_STYLE}
                    value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>End Time</label>
                  <input type="time" style={INPUT_STYLE}
                    value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <button
                onClick={addEvent}
                disabled={!newEvent.title || !newEvent.date}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                  background: (!newEvent.title || !newEvent.date) ? 'rgba(255,255,255,0.05)' : 'var(--gold)',
                  color: (!newEvent.title || !newEvent.date) ? 'var(--text-4)' : '#000',
                  fontWeight: 700, fontSize: '0.82rem', cursor: (!newEvent.title || !newEvent.date) ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [projectsRes, queriesRes, documentsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/queries'),
        fetch('/api/documents'),
      ]);
      
      const projectsData = await projectsRes.json();
      const queriesData = await queriesRes.json();
      const documentsData = await documentsRes.json();
      
      if (projectsData.projects) setProjects(projectsData.projects);
      if (queriesData.queries) setQueries(queriesData.queries);
      if (documentsData.documents) setDocuments(documentsData.documents);
      
      // Fetch activity logs from projects
      if (projectsData.projects && projectsData.projects.length > 0) {
        const projectIds = projectsData.projects.map((p: any) => p.id);
        const logsRes = await fetch(`/api/projects/activity?ids=${projectIds.join(',')}&limit=10`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (logsData.logs) setActivityLogs(logsData.logs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'accounts') {
      router.replace('/dashboard/commission');
    }
  }, [user, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const canViewFinance = canViewFinanceData(user?.role);

  if (user?.role === 'accounts') {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>Redirecting to Finance view...</div>;
  }

  if (user?.role === 'engagement_assistant') {
    return <EADashboard user={user} projects={projects} activityLogs={activityLogs} router={router} />;
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading dashboard...
      </div>
    );
  }

  const totalLoan      = projects.reduce((s, p) => s + (p.loan_amount || 0), 0);
  const active         = projects.filter(p => !['approved','lead_received'].includes(p.stage)).length;
  const approved       = projects.filter(p => p.stage === 'approved').length;
  const totalComm      = projects.reduce((s, p) => s + (p.commission_amount || 0), 0);
  const needsAttention = projects.filter(p => (p.approval_score || 100) < 60);

  // Calculate pending queries (open queries across all projects)
  const pendingQueries = queries.filter(q => q.status === 'open').length;
  
  // Calculate average document completion
  const projectIds = projects.map(p => p.id);
  const relevantDocs = documents.filter(d => projectIds.includes(d.project_id));
  const receivedDocs = relevantDocs.filter(d => d.status === 'received').length;
  const docCompletion = relevantDocs.length > 0 ? Math.round((receivedDocs / relevantDocs.length) * 100) : 0;

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
          {greeting()}, <span style={{ color: 'var(--gold-light)' }}>{user?.name?.split(' ')[0]}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          Leverest Kolkata Branch · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {(canViewFinance ? [
          {
            label: 'Total Loan Value', value: formatCurrency(totalLoan),
            icon: TrendingUp, bg: 'rgba(201,150,12,0.1)', color: '#F0B429',
            sub: `${projects.length} projects`, trend: '+18% MoM',
          },
          {
            label: 'Active Deals', value: active,
            icon: FolderKanban, bg: 'rgba(96,165,250,0.1)', color: '#60A5FA',
            sub: 'In pipeline',
          },
          {
            label: 'Approved', value: approved,
            icon: CheckCircle2, bg: 'rgba(34,197,94,0.1)', color: '#4ADE80',
            sub: 'This quarter',
          },
          {
            label: 'Commission', value: formatCurrency(totalComm),
            icon: DollarSign, bg: 'rgba(167,139,250,0.1)', color: '#A78BFA',
            sub: 'Across all deals',
          },
        ] : [
          {
            label: 'My Projects', value: projects.length,
            icon: FolderKanban, bg: 'rgba(96,165,250,0.1)', color: '#60A5FA',
            sub: 'Assigned to you',
          },
          {
            label: 'Active Deals', value: active,
            icon: TrendingUp, bg: 'rgba(201,150,12,0.1)', color: '#F0B429',
            sub: 'In pipeline',
          },
          {
            label: 'Pending Queries', value: pendingQueries,
            icon: AlertTriangle, bg: 'rgba(245,158,11,0.1)', color: '#F59E0B',
            sub: 'Needs response',
          },
          {
            label: 'Avg Doc Completion', value: `${docCompletion}%`,
            icon: CheckCircle2, bg: 'rgba(34,197,94,0.1)', color: '#4ADE80',
            sub: 'Across projects',
          },
        ]).map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="stat-card" key={kpi.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-icon" style={{ background: kpi.bg }}>
                  <Icon size={16} color={kpi.color} />
                </div>
                {kpi.trend && (
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#4ADE80', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: '99px' }}>
                    {kpi.trend}
                  </div>
                )}
              </div>
              <div className="stat-value">{kpi.value}</div>
              <div className="stat-label">{kpi.label} · {kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: canViewFinance ? '2fr 1fr' : '1fr', gap: '16px', marginBottom: '1.5rem' }}>
        {canViewFinance && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Deal Volume (₹ Cr)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Last 7 months</div>
            </div>
            <div style={{ padding: '16px', height: '190px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AREA_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9960C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C9960C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#4E647F' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#4E647F' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.76rem', color: '#EEF2FF' }} />
                  <Area type="monotone" dataKey="v" stroke="#C9960C" strokeWidth={2} fill="url(#gv)" dot={false} activeDot={{ r: 4, fill: '#F0B429' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div className="card-header-title">Pipeline Distribution</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{projects.length} global</div>
          </div>
          <div className="custom-scroll" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '190px', overflowY: 'auto' }}>
            {(() => {
              const allCompanyProjects = projects;

              const counts = PIPELINE_STAGES.map((s) => ({
                id: s.id,
                label: s.label,
                count: allCompanyProjects.filter((p) => p.stage === s.id).length,
                color: '#60A5FA', // Use uniform color for generic pipeline view
              }));
              const maxCount = Math.max(...counts.map((c) => c.count), 1);

              return counts.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '100px', fontSize: '0.7rem', color: 'var(--text-2)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    <span style={{ fontSize: '0.52rem', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', width: '20px' }}>{PIPELINE_STAGES.findIndex(x => x.id === item.id) + 1}</span>
                    {item.label}
                  </div>
                  <div style={{ flex: 1, height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    {item.count > 0 && (
                      <div style={{
                        height: '100%',
                        width: `${(item.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                        minWidth: '12px',
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 700, color: item.count > 0 ? item.color : 'var(--text-4)',
                    width: '20px', textAlign: 'right', flexShrink: 0,
                  }}>
                    {item.count}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── Main: Active Projects Table + Needs Attention + Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        {/* Active Projects Table */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Active Projects</div>
              <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Loan Type</th>
                    {canViewFinance && <th>Amount</th>}
                    <th>Stage</th>
                    <th style={{ textAlign: 'center' }}>Docs %</th>
                    {canViewFinance && <th style={{ textAlign: 'center' }}>Score</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const projectDocs = documents.filter(d => d.project_id === p.id);
                    const receivedDocs = projectDocs.filter(d => d.status === 'received').length;
                    const comp = projectDocs.length > 0 ? Math.round((receivedDocs / projectDocs.length) * 100) : 0;
                    const score = p.approval_score || 0;
                    const sc = getScore(score);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                              background: getGrad(p.company_name),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                            }}>
                              {getInitials(p.company_name)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>{p.company_name}</div>
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{p.contact_person}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{getLoanTypeLabel(p.loan_type || '')}</td>
                        {canViewFinance && <td className="td-gold">{formatCurrency(p.loan_amount || 0)}</td>}
                        <td><span className={getPillClass(p.stage)}>{getStageLabel(p.stage)}</span></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: comp >= 70 ? '#4ADE80' : comp >= 40 ? '#FCD34D' : '#F87171' }}>{comp}%</div>
                            <div className="progress-track" style={{ width: '52px' }}>
                              <div className="progress-fill" style={{ width: `${comp}%` }} />
                            </div>
                          </div>
                        </td>
                        {canViewFinance && (
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: sc.color }}>{score}</span>
                          </td>
                        )}
                        <td>
                          <Link href={`/dashboard/projects/${p.id}`} style={{ color: 'var(--text-3)', display: 'flex', justifyContent: 'center' }}>
                            <ExternalLink size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <AlertTriangle size={13} color="#F59E0B" />
                  <div className="card-header-title">Needs Attention</div>
                </div>
              </div>
              <div style={{ padding: '10px 0' }}>
                {needsAttention.map((p) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 16px',
                      borderBottom: '1px solid var(--bg-border)',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                        background: p.approval_score && p.approval_score < 50 ? '#EF4444' : '#F59E0B',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.company_name}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#F87171' }}>
                          Score: {p.approval_score}
                        </div>
                      </div>
                      <ChevronRight size={12} color="var(--text-4)" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-header-title">Recent Activity</div>
              <Link href="/dashboard/activity" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                Full log <ChevronRight size={12} />
              </Link>
            </div>
            <div>
              {activityLogs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                  No activity logs yet.
                </div>
              ) : (
                activityLogs.slice(0, 5).map((log: any, i: number) => {
                  const proj = projects.find((p) => p.id === log.project_id);
                  const isLast = i === 0;
                  return (
                    <div key={log.id} style={{
                      display: 'flex', gap: '10px',
                      padding: '10px 16px',
                      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: getGrad(log.performed_by || 'Unknown'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.58rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {getInitials(log.performed_by || 'Unknown')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-1)', lineHeight: 1.4 }}>{log.description || log.action}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{log.performed_by}</span>
                          {proj && (
                            <>
                              <span style={{ color: 'var(--text-4)', fontSize: '0.65rem' }}>·</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>{proj.company_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
