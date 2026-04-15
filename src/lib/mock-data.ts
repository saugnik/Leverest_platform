import {
  User,
  Project,
  DocumentItem,
  Query,
  ActivityLog,
  InternalNote,
  Message,
  Notification,
  ClientSPOC,
} from './types';

// ─── TEAM ROSTER ────────────────────────────────────────────────────────────────
// Real Leverest team members — used for authentication and team assignment.

export const MOCK_USERS: User[] = [
  { id: 'u-pawan', email: 'pawan.lohia@leverestfin.com', name: 'Pawan Lohia', role: 'admin', branch: 'kolkata', designation: 'Director', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-utkarsh', email: 'utkarsh.lohia@leverestfin.com', name: 'Utkarsh Lohia', role: 'admin', branch: 'kolkata', designation: 'Director', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-arunima', email: 'arunima.guha@leverestfin.com', name: 'Arunima Guha', role: 'admin', branch: 'kolkata', designation: 'Director', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-rekha', email: 'rekha.kedia@leverestfin.com', name: 'Rekha Kedia', role: 'admin', branch: 'kolkata', designation: 'Director', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-neha-r', email: 'neha.roongta@leverestfin.com', name: 'Neha Roongta', role: 'manager', branch: 'kolkata', designation: 'Manager', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-neha-a', email: 'neha.agarwal@leverestfin.com', name: 'Neha Agarwal', role: 'manager', branch: 'kolkata', designation: 'Manager', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-raj', email: 'accounts@leverestfin.com', name: 'Rajkumar Shaw', role: 'accounts', branch: 'kolkata', designation: 'Accountant', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-deb', email: 'contact@leverestfin.com', name: 'Debjani Paul Chouhury', role: 'engagement_assistant', branch: 'kolkata', designation: 'EA to Director', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-shaikat', email: 'shaikat.saha@leverestfin.com', name: 'Shaikat Saha', role: 'relation_manager', branch: 'kolkata', designation: 'BD Manager', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-barun', email: 'barun.thakur@leverestfin.com', name: 'Barun Kumar Thakur', role: 'relation_manager', branch: 'kolkata', designation: 'BD Manager', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-peu', email: 'peu.b@leverestfin.com', name: 'Peu Bhattacharyya', role: 'relation_manager', branch: 'kolkata', designation: 'BD Manager', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-nitin', email: 'nitin.parmar@leverestfin.com', name: 'Nitin Parmar', role: 'relation_manager', branch: 'kolkata', designation: 'BD Manager', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-mohitosh', email: 'mis@leverestfin.com', name: 'Mohitosh Singha', role: 'mis', branch: 'kolkata', designation: 'MIS', phone: '', is_active: true, created_at: '2024-01-01T00:00:00Z' },
];

// ─── EMPTY DATA STORES (populated by Supabase in production) ─────────────────

export const MOCK_SPOCS: ClientSPOC[] = [];
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_DOCUMENTS: DocumentItem[] = [];
export const MOCK_QUERIES: Query[] = [];
export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [];
export const MOCK_NOTES: InternalNote[] = [];
export const MOCK_MESSAGES: Message[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getProjectDocCompletionPercent(_projectId: string): number {
  // In production, document completion is computed from live Supabase data.
  // This stub returns 0 when no documents exist in the local store.
  return 0;
}

export function getProjectsByUser(_userEmail: string, _userRole: string): Project[] {
  return [];
}
