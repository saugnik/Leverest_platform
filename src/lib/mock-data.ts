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
  MANUFACTURING_SERVICE_CHECKLIST,
  NBFC_CHECKLIST,
} from './types';

// ─── MOCK USERS ────────────────────────────────────────────────────────────────

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

// ─── MOCK CLIENT SPOCs ──────────────────────────────────────────────────────────

export const MOCK_SPOCS: ClientSPOC[] = [];

// ─── MOCK PROJECTS ──────────────────────────────────────────────────────────────

export const MOCK_PROJECTS: Project[] = [
  {
    id: "mock-seed-project",
    name: "Leverest AI Validation Test — Working Capital",
    client_name: "Leverest AI Validation Test",
    company_name: "Leverest AI Validation Test",
    company_type: "manufacturing_service",
    branch: "kolkata",
    stage: "client_meeting",
    lead_source: "direct",
    loan_type: "working_capital",
    loan_amount: 50000000,
    assigned_team: ["pawan.lohia@leverestfin.com", "contact@leverestfin.com"],
    spoc_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "pawan.lohia@leverestfin.com",
    description: "A permanent test project for AI validation."
  }
];

// ─── MOCK DOCUMENTS ─────────────────────────────────────────────────────────────

function generateDocuments(projectId: string, companyType: 'manufacturing_service' | 'nbfc'): DocumentItem[] {
  const checklist = companyType === 'manufacturing_service' ? MANUFACTURING_SERVICE_CHECKLIST : NBFC_CHECKLIST;
  const statuses: ('received' | 'pending' | 'required')[] = ['received', 'received', 'pending', 'required'];
  const docs: DocumentItem[] = [];
  let idx = 0;
  for (const cat of checklist) {
    for (const docName of cat.docs) {
      const status = statuses[idx % statuses.length];
      docs.push({
        id: `doc-${projectId}-${idx}`,
        project_id: projectId,
        category: cat.category,
        name: docName,
        status,
        file_url: status === 'received' ? `https://drive.google.com/file/d/example-${idx}` : undefined,
        file_name: status === 'received' ? `${docName.replace(/[^a-z0-9]/gi, '_')}.pdf` : undefined,
        file_source: status === 'received' ? 'drive' : undefined,
        uploaded_at: status === 'received' ? '2025-03-01T10:00:00Z' : undefined,
        is_required: true,
      });
      idx++;
    }
  }
  return docs;
}

export const MOCK_DOCUMENTS: DocumentItem[] = generateDocuments("mock-seed-project", "manufacturing_service");

// ─── MOCK QUERIES ───────────────────────────────────────────────────────────────

export const MOCK_QUERIES: Query[] = [];

// ─── MOCK ACTIVITY LOGS ─────────────────────────────────────────────────────────

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [];

// ─── MOCK INTERNAL NOTES ───────────────────────────────────────────────────────

export const MOCK_NOTES: InternalNote[] = [];

// ─── MOCK MESSAGES ─────────────────────────────────────────────────────────────

export const MOCK_MESSAGES: Message[] = [];

// ─── MOCK NOTIFICATIONS ────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

export function getProjectDocuments(projectId: string): DocumentItem[] {
  return MOCK_DOCUMENTS.filter((d) => d.project_id === projectId);
}

export function getProjectDocCompletionPercent(projectId: string): number {
  const docs = getProjectDocuments(projectId);
  if (!docs.length) return 0;
  const received = docs.filter((d) => d.status === 'received').length;
  return Math.round((received / docs.length) * 100);
}

export function getProjectsByUser(userEmail: string, userRole: string): Project[] {
  // Return all projects so everyone can see the project list on the dashboard
  return MOCK_PROJECTS;
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getStageIndex(stage: string): number {
  return PIPELINE_STAGES.findIndex(s => s.id === stage);
}
