'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle2, Circle, PlayCircle, AlertTriangle,
  ChevronDown, ChevronRight, Timer, CalendarClock,
  Users, Building2, FileText, Send, Search, Gavel,
  ShieldCheck, Banknote, BarChart3, MessageSquare,
  Flag, Phone, Mail, Video, FormInput, PhoneCall,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
type Owner = 'EM' | 'EP' | 'EP/EM' | 'EP/BD';
type ActionMode = 'Google Form' | 'Mail' | 'Phone/Mail' | 'Phone' | 'Call' | 'Discussion' | 'Meeting' | 'Mail + Phone Call' | 'Disbursement';

export interface FMSStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  sla: string;          // T+1, T+2, Day 1, etc.
  owner: Owner;
  mode: ActionMode;
  checkins: { by: string; at: string; note: string }[];
}

// Icon map
const ICON_MAP: Record<string, LucideIcon> = {
  Users, Search, MessageSquare, Send, Gavel, ShieldCheck, FileText, Banknote, BarChart3,
};

const MODE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  'Mail':            { icon: Mail, color: '#60A5FA' },
  'Phone':           { icon: Phone, color: '#F59E0B' },
  'Phone/Mail':      { icon: PhoneCall, color: '#F97316' },
  'Call':            { icon: PhoneCall, color: '#F59E0B' },
  'Discussion':      { icon: MessageSquare, color: '#A78BFA' },
  'Meeting':         { icon: Video, color: '#EC4899' },
  'Google Form':     { icon: FormInput, color: '#4ADE80' },
  'Mail + Phone Call': { icon: PhoneCall, color: '#F97316' },
  'Disbursement':    { icon: Banknote, color: '#C9960C' },
};

const OWNER_COLORS: Record<string, { bg: string; text: string }> = {
  'EM':    { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA' },
  'EP':    { bg: 'rgba(236,72,153,0.1)', text: '#EC4899' },
  'EP/EM': { bg: 'rgba(139,92,246,0.1)', text: '#A78BFA' },
  'EP/BD': { bg: 'rgba(139,92,246,0.1)', text: '#A78BFA' },
};

interface PhaseDefinition {
  id: string;
  title: string;
  iconKey: string;
  color: string;
  steps: FMSStep[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FMS DATA — with SLA, Owner, Mode from Leverest FMS document
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_FMS_PHASES: PhaseDefinition[] = [
  {
    id: 'phase_1', title: 'Client Onboarding & Bank Identification', iconKey: 'Users', color: '#3B82F6',
    steps: [
      { id: 's1', title: 'Client Meeting & Assignment Created', description: 'Initial meeting with the client. Bank name can be unknown at this stage.', status: 'not_started', sla: 'Whenever Needed', owner: 'EP/BD', mode: 'Google Form', checkins: [] },
      { id: 's2', title: 'Document Request Email', description: 'Send an email to the client requesting basic required documents.', status: 'not_started', sla: 'Day 1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's3', title: 'Document Follow-up', description: 'Track and follow up for the receipt of the requested documents.', status: 'not_started', sla: 'T+2', owner: 'EM', mode: 'Phone/Mail', checkins: [] },
      { id: 's4', title: 'Executive Summary', description: 'Prepare a comprehensive Executive Summary once all documents are received.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's5', title: 'Bank Identification', description: 'Based on the Executive Summary, identify suitable banks for the proposal.', status: 'not_started', sla: 'T+1', owner: 'EP', mode: 'Discussion', checkins: [] },
      { id: 's6', title: 'Preliminary Meetings', description: 'Conduct meetings with banks to discuss the new proposal.', status: 'not_started', sla: 'T+2', owner: 'EP/EM', mode: 'Meeting', checkins: [] },
    ],
  },
  {
    id: 'phase_2', title: 'Shortlisting & Data Sharing', iconKey: 'Search', color: '#8B5CF6',
    steps: [
      { id: 's7', title: 'Bank Shortlisting', description: 'Create a list of banks that express interest/agreement in the proposal.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Google Form', checkins: [] },
      { id: 's8', title: 'Data Sharing', description: 'Send the basic document package to the interested banks.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail + Phone Call', checkins: [] },
      { id: 's9', title: 'Bank Revert & Feedback', description: 'Receive initial feedback from banks regarding sanction, assessments, and further steps.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Call', checkins: [] },
    ],
  },
  {
    id: 'phase_3', title: 'Query Handling & Resolution', iconKey: 'MessageSquare', color: '#F59E0B',
    steps: [
      { id: 's10', title: 'Query Handling', description: 'Collect specific queries from the banks.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Call', checkins: [] },
      { id: 's11', title: 'Resolution & Checklist', description: 'Sort out queries personally and prepare a checklist to send to the client for clarification.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's12', title: 'Client Follow-up', description: 'Ensure timely replies from the client regarding bank queries.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's13', title: 'Prepare Query Reply', description: 'Prepare Query Reply and get it Reviewed from EP.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's14', title: 'Review & Finalise Reply', description: 'Review and Finalise the Query Reply before submission.', status: 'not_started', sla: 'T+1', owner: 'EP', mode: 'Mail', checkins: [] },
    ],
  },
  {
    id: 'phase_4', title: 'Submission to Banks', iconKey: 'Send', color: '#06B6D4',
    steps: [
      { id: 's15', title: 'Submission', description: "Forward the client's replies/clarifications back to the banks.", status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
    ],
  },
  {
    id: 'phase_5', title: 'Legal, Valuation & Client-Bank Meeting', iconKey: 'Gavel', color: '#EC4899',
    steps: [
      { id: 's16', title: 'Legal & Valuation Initiation', description: 'Initiate Legal, Valuation with respective agencies and obtain draft report.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's17', title: 'Client-Bank Meeting', description: 'Arrange a meeting (or VC) between the bank and the client.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's18', title: 'Secondary Queries', description: 'Address any additional queries arising from the meeting.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
    ],
  },
  {
    id: 'phase_6', title: 'In-Principal Sanction', iconKey: 'ShieldCheck', color: '#22C55E',
    steps: [
      { id: 's19', title: 'Submit Final Note / NBG', description: 'Submit final Note / NBG / Query sheet to bank before Approval.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's20', title: 'In-Principal Sanction', description: 'Secure the "In-Principal" sanction letter from the bank at an expected Date.', status: 'not_started', sla: 'T+2', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's21', title: 'Follow-up with Bank (T+2)', description: 'Follow up with Bank if In-Principal Sanction not Received in T+2.', status: 'not_started', sla: 'T+1', owner: 'EP', mode: 'Phone', checkins: [] },
    ],
  },
  {
    id: 'phase_7', title: 'Terms & Final Sanction', iconKey: 'FileText', color: '#F97316',
    steps: [
      { id: 's22', title: 'Terms Discussion', description: 'Discuss pricing, security, and margin money with the client.', status: 'not_started', sla: 'T+1', owner: 'EP/EM', mode: 'Meeting', checkins: [] },
      { id: 's23', title: 'Bank Coordination', description: "Inform the bank of the client's requested pricing/terms and obtain the Draft Sanction.", status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Meeting', checkins: [] },
      { id: 's24', title: 'Sanction Approval', description: 'Review the draft and approach the bank for the final Sanction Letter.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Meeting', checkins: [] },
      { id: 's25', title: 'Condition Review (PDC)', description: 'Check and verify the pre-disbursement conditions (PDC).', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's26', title: 'Rectification', description: 'Address and rectify any outstanding PDC after internal discussion.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's27', title: 'Final Sanction', description: 'Secure the formal final sanction.', status: 'not_started', sla: 'T+2', owner: 'EM', mode: 'Mail', checkins: [] },
      { id: 's28', title: 'Follow-up with Bank (T+2)', description: 'Follow up with Bank if Final Sanction not received in T+2.', status: 'not_started', sla: 'T+1', owner: 'EP', mode: 'Phone', checkins: [] },
    ],
  },
  {
    id: 'phase_8', title: 'Compliance & Disbursement', iconKey: 'Banknote', color: '#C9960C',
    steps: [
      { id: 's29', title: 'Pre-Disbursement Compliance', description: 'Fulfill all pre-disbursement conditions, including the arrangement of margin money.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Meeting', checkins: [] },
      { id: 's30', title: 'Disbursement', description: 'Execute the loan disbursement process.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Disbursement', checkins: [] },
    ],
  },
  {
    id: 'phase_9', title: 'Post-Disbursement & Fee Realization', iconKey: 'BarChart3', color: '#4ADE80',
    steps: [
      { id: 's31', title: 'Post-Disbursement Compliance', description: 'Monitor and fulfill post-disbursement conditions.', status: 'not_started', sla: 'T+1', owner: 'EM', mode: 'Meeting', checkins: [] },
      { id: 's32', title: 'Future Planning', description: 'Initiate discussions for next facility requirements.', status: 'not_started', sla: 'T+1', owner: 'EP', mode: 'Meeting', checkins: [] },
      { id: 's33', title: 'Fee Realization', description: 'Ensure all professional fees are received.', status: 'not_started', sla: 'T+1', owner: 'EP', mode: 'Meeting', checkins: [] },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TIMER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getElapsedTime(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - start);
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 60000) % 60;
  const hours = Math.floor(diff / 3600000) % 24;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getDuration(startedAt: string, completedAt: string): string {
  const diff = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
  const minutes = Math.floor(diff / 60000) % 60;
  const hours = Math.floor(diff / 3600000) % 24;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Calculate SLA deadline from previousStep completedAt
function getSlaDeadline(sla: string, prevCompletedAt: string | null | undefined): Date | null {
  if (!prevCompletedAt) return null;
  const base = new Date(prevCompletedAt);
  const match = sla.match(/T\+(\d+)/i);
  if (match) {
    const days = parseInt(match[1]);
    return new Date(base.getTime() + days * 86400000);
  }
  if (sla === 'Day 1') return new Date(base.getTime() + 86400000);
  return null;
}

function isOverdue(deadline: Date): boolean {
  return Date.now() > deadline.getTime();
}

function timeToDeadline(deadline: Date): string {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) {
    const overMs = Math.abs(diff);
    const h = Math.floor(overMs / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d overdue`;
    return `${h}h overdue`;
  }
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  return `${h}h left`;
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function getIcon(key: string): LucideIcon {
  return ICON_MAP[key] || Flag;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface FMSTimelineProps {
  projectId: string;
  members?: { user_email: string }[];
  currentUserEmail?: string;
}

export default function FMSTimeline({ projectId, members = [], currentUserEmail = 'admin@leverestfin.com' }: FMSTimelineProps) {
  const [phases, setPhases] = useState<PhaseDefinition[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const [checkinNote, setCheckinNote] = useState<Record<string, string>>({});
  const [showCheckins, setShowCheckins] = useState<Set<string>>(new Set());

  // Load
  useEffect(() => {
    const saved = localStorage.getItem(`fms_timeline_${projectId}`);
    if (saved) {
      try {
        const parsed: PhaseDefinition[] = JSON.parse(saved);
        const merged = DEFAULT_FMS_PHASES.map(dp => {
          const sp = parsed.find(p => p.id === dp.id);
          if (!sp) return { ...dp };
          return {
            ...dp,
            steps: dp.steps.map(ds => {
              const ss = sp.steps.find(s => s.id === ds.id);
              if (!ss) return { ...ds };
              return { ...ds, status: ss.status, startedAt: ss.startedAt, completedAt: ss.completedAt, checkins: ss.checkins || [] };
            }),
          };
        });
        setPhases(merged);
        const autoExpand = new Set<string>();
        merged.forEach(p => { if (p.steps.some(s => s.status === 'in_progress')) autoExpand.add(p.id); });
        if (autoExpand.size === 0) {
          const first = merged.find(p => p.steps.some(s => s.status !== 'completed'));
          if (first) autoExpand.add(first.id);
        }
        setExpandedPhases(autoExpand);
      } catch {
        setPhases([...DEFAULT_FMS_PHASES]);
        setExpandedPhases(new Set(['phase_1']));
      }
    } else {
      setPhases([...DEFAULT_FMS_PHASES]);
      setExpandedPhases(new Set(['phase_1']));
    }
  }, [projectId]);

  // Save
  useEffect(() => {
    if (phases.length > 0) localStorage.setItem(`fms_timeline_${projectId}`, JSON.stringify(phases));
  }, [phases, projectId]);

  // Timer
  useEffect(() => {
    const hasRunning = phases.some(p => p.steps.some(s => s.status === 'in_progress'));
    if (!hasRunning) return;
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, [phases]);

  const togglePhase = useCallback((id: string) => {
    setExpandedPhases(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const updateStepStatus = useCallback((phaseId: string, stepId: string, newStatus: StepStatus) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      return { ...p, steps: p.steps.map(s => {
        if (s.id !== stepId) return s;
        const now = new Date().toISOString();
        return {
          ...s, status: newStatus,
          startedAt: newStatus === 'in_progress' ? (s.startedAt || now) : s.startedAt,
          completedAt: newStatus === 'completed' ? now : (newStatus === 'in_progress' ? null : s.completedAt),
          checkins: [...s.checkins, { by: currentUserEmail, at: now, note: `Status → ${newStatus}` }],
        };
      })};
    }));
  }, [currentUserEmail]);

  const addCheckin = useCallback((phaseId: string, stepId: string) => {
    const note = checkinNote[stepId]?.trim();
    if (!note) return;
    const now = new Date().toISOString();
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      return { ...p, steps: p.steps.map(s => {
        if (s.id !== stepId) return s;
        return { ...s, checkins: [...s.checkins, { by: currentUserEmail, at: now, note }] };
      })};
    }));
    setCheckinNote(prev => ({ ...prev, [stepId]: '' }));
  }, [checkinNote, currentUserEmail]);

  const toggleCheckins = useCallback((stepId: string) => {
    setShowCheckins(prev => { const n = new Set(prev); n.has(stepId) ? n.delete(stepId) : n.add(stepId); return n; });
  }, []);

  // Stats
  const totalSteps = phases.reduce((s, p) => s + p.steps.length, 0);
  const completedSteps = phases.reduce((s, p) => s + p.steps.filter(x => x.status === 'completed').length, 0);
  const inProgressSteps = phases.reduce((s, p) => s + p.steps.filter(x => x.status === 'in_progress').length, 0);
  const blockedSteps = phases.reduce((s, p) => s + p.steps.filter(x => x.status === 'blocked').length, 0);
  const overallPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const statusConfig: Record<StepStatus, { label: string; color: string; bg: string; Ic: LucideIcon }> = {
    not_started: { label: 'Not Started', color: 'var(--text-4)', bg: 'rgba(255,255,255,0.03)', Ic: Circle },
    in_progress: { label: 'In Progress', color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', Ic: PlayCircle },
    completed:   { label: 'Completed',   color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',  Ic: CheckCircle2 },
    blocked:     { label: 'Blocked',     color: '#F87171', bg: 'rgba(239,68,68,0.1)',  Ic: AlertTriangle },
  };

  // Flatten all steps for prev-step SLA lookup
  const allSteps = phases.flatMap(p => p.steps);

  return (
    <div>
      {/* ── Overall Progress ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(201,150,12,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(201,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag size={18} color="#F0B429" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>FMS Project Timeline</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{completedSteps} of {totalSteps} steps · {phases.length} phases · T = time from previous step completion</div>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #C9960C, #F0B429)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{overallPct}%</div>
        </div>
        <div style={{ height: '8px', borderRadius: '99px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, #C9960C, #F0B429)', width: `${overallPct}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
          {([
            { label: 'Completed', value: completedSteps, color: '#4ADE80' },
            { label: 'In Progress', value: inProgressSteps, color: '#60A5FA' },
            { label: 'Blocked', value: blockedSteps, color: '#F87171' },
            { label: 'Not Started', value: totalSteps - completedSteps - inProgressSteps - blockedSteps, color: 'var(--text-4)' },
          ]).map(st => (
            <div key={st.label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginTop: '2px' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phase Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {phases.map((phase, phaseIdx) => {
          const PhaseIcon = getIcon(phase.iconKey);
          const phaseCompleted = phase.steps.filter(s => s.status === 'completed').length;
          const phasePct = phase.steps.length > 0 ? Math.round((phaseCompleted / phase.steps.length) * 100) : 0;
          const isExpanded = expandedPhases.has(phase.id);
          const hasInProgress = phase.steps.some(s => s.status === 'in_progress');
          const isFullyDone = phasePct === 100;

          return (
            <div key={phase.id} className="card" style={{ overflow: 'hidden', borderLeft: `3px solid ${isFullyDone ? '#4ADE80' : hasInProgress ? phase.color : 'rgba(255,255,255,0.06)'}` }}>
              {/* Phase Header */}
              <button onClick={() => togglePhase(phase.id)} style={{ width: '100%', padding: '14px 18px', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: `${phase.color}18`, border: `1px solid ${phase.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isFullyDone ? <CheckCircle2 size={16} color="#4ADE80" /> : <PhaseIcon size={16} color={phase.color} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: phase.color, background: `${phase.color}15`, padding: '2px 8px', borderRadius: '99px' }}>PHASE {phaseIdx + 1}</span>
                    {isFullyDone && <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#4ADE80', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '99px' }}>✓ COMPLETE</span>}
                    {hasInProgress && <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#60A5FA', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '5px', height: '5px', background: '#60A5FA', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} /> ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)', marginTop: '4px' }}>{phase.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isFullyDone ? '#4ADE80' : 'var(--text-2)' }}>{phasePct}%</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-4)' }}>{phaseCompleted}/{phase.steps.length}</div>
                  </div>
                  <div style={{ width: '50px', height: '4px', borderRadius: '99px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: isFullyDone ? '#4ADE80' : phase.color, width: `${phasePct}%`, transition: 'width 0.3s' }} />
                  </div>
                  {isExpanded ? <ChevronDown size={16} color="var(--text-3)" /> : <ChevronRight size={16} color="var(--text-3)" />}
                </div>
              </button>

              {/* Steps */}
              {isExpanded && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {phase.steps.map((step, stepIdx) => {
                    const cfg = statusConfig[step.status];
                    const StatusIcon = cfg.Ic;
                    const modeInfo = MODE_ICONS[step.mode] || { icon: Mail, color: 'var(--text-3)' };
                    const ModeIcon = modeInfo.icon;
                    const ownerCfg = OWNER_COLORS[step.owner] || { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-3)' };

                    // SLA calculations
                    const globalIdx = allSteps.findIndex(s => s.id === step.id);
                    const prevStep = globalIdx > 0 ? allSteps[globalIdx - 1] : null;
                    const slaDeadline = getSlaDeadline(step.sla, prevStep?.completedAt);
                    const overdue = slaDeadline && step.status === 'in_progress' && isOverdue(slaDeadline);

                    return (
                      <div key={step.id} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: stepIdx < phase.steps.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        {/* Connector */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0, paddingTop: '2px' }}>
                          <StatusIcon size={18} color={cfg.color} />
                          {stepIdx < phase.steps.length - 1 && <div style={{ flex: 1, width: '2px', marginTop: '4px', background: step.status === 'completed' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)' }} />}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Title row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)', textDecoration: step.status === 'completed' ? 'line-through' : 'none', opacity: step.status === 'completed' ? 0.7 : 1 }}>
                                {stepIdx + 1}. {step.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.5 }}>{step.description}</div>
                            </div>
                            <select value={step.status} onChange={e => updateStepStatus(phase.id, step.id, e.target.value as StepStatus)} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, border: `1px solid ${cfg.color}40`, background: cfg.bg, color: cfg.color, cursor: 'pointer', outline: 'none', fontFamily: 'inherit', flexShrink: 0 }}>
                              {(['not_started', 'in_progress', 'completed', 'blocked'] as StepStatus[]).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                            </select>
                          </div>

                          {/* Metadata Pills */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* SLA */}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 700, background: overdue ? 'rgba(239,68,68,0.12)' : 'rgba(201,150,12,0.08)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.25)' : 'rgba(201,150,12,0.15)'}`, color: overdue ? '#F87171' : '#F0B429' }}>
                              <Clock size={10} /> SLA: {step.sla}
                              {slaDeadline && step.status === 'in_progress' && <> · {timeToDeadline(slaDeadline)}</>}
                            </span>
                            {/* Owner */}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 700, background: ownerCfg.bg, color: ownerCfg.text, border: `1px solid ${ownerCfg.text}25` }}>
                              <Users size={10} /> {step.owner}
                            </span>
                            {/* Mode */}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 600, background: `${modeInfo.color}10`, color: modeInfo.color, border: `1px solid ${modeInfo.color}25` }}>
                              <ModeIcon size={10} /> {step.mode}
                            </span>
                          </div>

                          {/* Timer */}
                          {step.status === 'in_progress' && step.startedAt && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                              <Timer size={12} color="#60A5FA" style={{ animation: 'spin 3s linear infinite' }} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60A5FA', fontVariantNumeric: 'tabular-nums' }}>{getElapsedTime(step.startedAt)}</span>
                              <span style={{ fontSize: '0.58rem', color: 'var(--text-4)' }}>since {fmtDateShort(step.startedAt)} {fmtTime(step.startedAt)}</span>
                            </div>
                          )}
                          {step.status === 'completed' && step.startedAt && step.completedAt && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                              <CalendarClock size={12} color="#4ADE80" />
                              <span style={{ fontSize: '0.65rem', color: '#4ADE80', fontWeight: 600 }}>Completed in {getDuration(step.startedAt, step.completedAt)}</span>
                              <span style={{ fontSize: '0.58rem', color: 'var(--text-4)' }}>· {fmtDateShort(step.completedAt)}</span>
                            </div>
                          )}
                          {step.status === 'blocked' && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                              <AlertTriangle size={12} color="#F87171" />
                              <span style={{ fontSize: '0.65rem', color: '#F87171', fontWeight: 600 }}>Blocked — Requires attention</span>
                            </div>
                          )}

                          {/* Check-in Section */}
                          <div style={{ marginTop: '10px' }}>
                            <button onClick={() => toggleCheckins(step.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.65rem', fontWeight: 600, padding: '2px 0' }}>
                              <UserCheck size={11} />
                              Check-ins ({step.checkins.length})
                              {showCheckins.has(step.id) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                            </button>

                            {showCheckins.has(step.id) && (
                              <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {/* Existing check-ins */}
                                {step.checkins.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                    {step.checkins.map((ci, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.68rem' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9960C, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                          {ci.by.split('@')[0].charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{ci.by.split('@')[0]}</span>
                                          <span style={{ color: 'var(--text-4)', marginLeft: '6px' }}>{fmtDateShort(ci.at)} {fmtTime(ci.at)}</span>
                                          <div style={{ color: 'var(--text-2)', marginTop: '2px' }}>{ci.note}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* New check-in */}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add a check-in note..."
                                    value={checkinNote[step.id] || ''}
                                    onChange={e => setCheckinNote(prev => ({ ...prev, [step.id]: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') addCheckin(phase.id, step.id); }}
                                    style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit' }}
                                  />
                                  <button onClick={() => addCheckin(phase.id, step.id)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, background: 'linear-gradient(135deg, #C9960C, #B8860B)', color: '#000', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    Check-in
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
