import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { UserRole } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a user can view finance-related data (commission, loan amounts, revenue, etc.)
 * Only admin and accounts role can access finance data
 */
export function canViewFinanceData(userRole: UserRole | string | undefined): boolean {
  return userRole === 'admin' || userRole === 'accounts';
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    lead_received: 'text-slate-400 bg-slate-400/10',
    meeting_done: 'text-blue-400 bg-blue-400/10',
    documents_requested: 'text-purple-400 bg-purple-400/10',
    internal_processing: 'text-amber-400 bg-amber-400/10',
    proposal_sent: 'text-cyan-400 bg-cyan-400/10',
    approved: 'text-emerald-400 bg-emerald-400/10',
  };
  return colors[stage] || 'text-slate-400 bg-slate-400/10';
}

export function getStageBorder(stage: string): string {
  const colors: Record<string, string> = {
    lead_received: 'border-slate-500',
    meeting_done: 'border-blue-500',
    documents_requested: 'border-purple-500',
    internal_processing: 'border-amber-500',
    proposal_sent: 'border-cyan-500',
    approved: 'border-emerald-500',
  };
  return colors[stage] || 'border-slate-500';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-emerald-400';
  if (score >= 60) return 'from-amber-500 to-amber-400';
  return 'from-red-500 to-red-400';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    received: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    required: 'text-red-400 bg-red-400/10 border-red-400/30',
    open: 'text-red-400 bg-red-400/10 border-red-400/30',
    in_progress: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    resolved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    paid: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    partial: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  };
  return map[status] || 'text-slate-400 bg-slate-400/10 border-slate-400/30';
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    high: 'text-red-400 bg-red-400/10',
    medium: 'text-amber-400 bg-amber-400/10',
    low: 'text-slate-400 bg-slate-400/10',
  };
  return map[priority] || 'text-slate-400 bg-slate-400/10';
}

export function getStageLabel(stage: string): string {
  const map: Record<string, string> = {
    lead_received: 'Lead Received',
    meeting_done: 'Meeting Done',
    documents_requested: 'Docs Requested',
    internal_processing: 'Internal Processing',
    proposal_sent: 'Proposal Sent',
    approved: 'Approved',
  };
  return map[stage] || stage;
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    relation_partner: 'Relation Partner',
    relation_manager: 'Relation Manager',
    engagement_partner: 'Engagement Partner',
    engagement_manager: 'Engagement Manager',
    executive: 'Executive',
    accounts: 'Accounts',
    mis: 'MIS',
    engagement_assistant: 'Engagement Assistant',
    client_spoc: 'Client SPOC',
  };
  return map[role] || role;
}

export function getLoanTypeLabel(type: string): string {
  const map: Record<string, string> = {
    term_loan: 'Term Loan',
    working_capital: 'Working Capital',
    od_cc: 'OD / CC',
    project_finance: 'Project Finance',
    equipment_finance: 'Equipment Finance',
    other: 'Other',
  };
  return map[type] || type;
}

export function getLeadSourceLabel(source: string): string {
  const map: Record<string, string> = {
    direct: 'Direct',
    referral: 'Referral',
    website: 'Website',
    ca_referral: 'CA Referral',
    bank_referral: 'Bank Referral',
    broker: 'Broker',
  };
  return map[source] || source;
}

export function getCompanyTypeLabel(type: string): string {
  return type === 'manufacturing_service' ? 'Manufacturing / Service' : 'NBFC';
}
