
export type UserRole =
  | 'admin'
  | 'manager'
  | 'relation_partner'
  | 'relation_manager'
  | 'engagement_partner'
  | 'engagement_manager'
  | 'executive'
  | 'accounts'
  | 'mis'
  | 'engagement_assistant'
  | 'client_spoc';

export type Branch = 'kolkata' | 'delhi';

export type PipelineStage =
  | 'lead_received'
  | 'meeting_done'
  | 'documents_requested'
  | 'internal_processing'
  | 'bank_connect'
  | 'proposal_sent'
  | 'bank_document_stage'
  | 'approved';

export type CompanyType = 'manufacturing_service' | 'nbfc';

export type DocumentStatus = 'received' | 'pending' | 'required';

export type LeadSource = 'direct' | 'referral' | 'website' | 'ca_referral' | 'bank_referral' | 'broker';

export type LoanType = 'term_loan' | 'working_capital' | 'od_cc' | 'project_finance' | 'equipment_finance' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branch: Branch;
  designation?: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  company_name: string;
  company_type: CompanyType;
  branch: Branch;
  stage: PipelineStage;
  lead_source: LeadSource;
  loan_type?: LoanType;
  loan_amount?: number;
  assigned_team: string[]; // array of @leverestfin.com emails
  spoc_ids: string[];
  approval_score?: number;
  commission_percentage?: number;
  commission_amount?: number;
  commission_status?: 'pending' | 'partial' | 'paid';
  selected_bank?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  notes?: string;
  deadline?: string;
}

export interface TeamMember {
  email: string;
  name: string;
  role: UserRole;
  designation?: string;
  is_admin?: boolean;
}

export interface ClientSPOC {
  id: string;
  project_id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  password_hash?: string;
  is_active: boolean;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  project_id: string;
  category: string;
  name: string;
  status: DocumentStatus;
  file_url?: string;
  file_name?: string;
  file_source?: 'gmail' | 'drive' | 'upload';
  uploaded_at?: string;
  uploaded_by?: string;
  expiry_date?: string;
  notes?: string;
  is_required: boolean;
}

export interface Query {
  id: string;
  project_id: string;
  title: string;
  description: string;
  raised_by: string;
  raised_by_name: string;
  query_type: 'bank' | 'internal' | 'document';
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  response?: string;
  response_document_url?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface BankSuggestion {
  id: string;
  project_id: string;
  bank_name: string;
  interest_rate: number;
  processing_time: string;
  commission_percentage: number;
  emi_estimate?: number;
  pros?: string[];
  cons?: string[];
  is_selected: boolean;
  suggested_by: string;
  suggested_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  action: string;
  description: string;
  performed_by: string;
  performed_by_name: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface InternalNote {
  id: string;
  project_id: string;
  content: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface BankCommunication {
  id: string;
  project_id: string;
  bank_name: string;
  communication_type: 'call' | 'email' | 'meeting';
  summary: string;
  next_steps?: string;
  communicated_by: string;
  communicated_by_name: string;
  communicated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'team' | 'client';
  created_at: string;
  read_by: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'document' | 'query' | 'bank' | 'stage' | 'deadline' | 'message';
  project_id?: string;
  is_read: boolean;
  created_at: string;
}

// Document Checklist Templates
export const MANUFACTURING_SERVICE_CHECKLIST: { category: string; docs: string[] }[] = [
  {
    category: 'Legal & Registration',
    docs: [
      'MOA (Memorandum of Association)',
      'COI (Certificate of Incorporation)',
      'AOA (Articles of Association)',
      'Company PAN Card',
      'URC (Udyam Registration Certificate)',
      'Trade License',
      'GST Certificate',
    ],
  },
  {
    category: 'Financial Documents',
    docs: [
      '3 Year Audited Financials',
      'CMA — Credit Monitoring Arrangement (Projections)',
      '12 Month Bank Statement',
    ],
  },
  {
    category: 'Debt & Liability',
    docs: ['All Sanction Letters', 'Debt Schedule (Outstanding loans)'],
  },
  {
    category: 'Ownership & Governance',
    docs: ['Shareholding Pattern', 'List of Directors'],
  },
  {
    category: 'Business Profile',
    docs: [
      'Order Book / Work Orders in Hand',
      'Top 5 Customers (with amounts)',
      'Top 5 Suppliers (with amounts and items/products)',
      'Credit Rating Report',
      'Brief Company Profile',
    ],
  },
];

export const NBFC_CHECKLIST: { category: string; docs: string[] }[] = [
  {
    category: 'Legal & Registration',
    docs: [
      'Corporate Deck',
      'RBI Registration Certificate',
      'GST Registration Certificate',
    ],
  },
  {
    category: 'Ownership & Governance',
    docs: ['Shareholding Pattern (Latest)', 'List of Directors (Latest)'],
  },
  {
    category: 'Financial Documents',
    docs: [
      'Last 3 Years Audited Financials — FY 2022-23',
      'Last 3 Years Audited Financials — FY 2023-24',
      'Last 3 Years Audited Financials — FY 2024-25',
      'Latest 3 Years Provisional Financials — FY 2022-23',
      'Latest 3 Years Provisional Financials — FY 2023-24',
      'Latest 3 Years Provisional Financials — FY 2024-25',
    ],
  },
  {
    category: 'Latest Performance Data',
    docs: [
      'Portfolio Cuts, GNPA & NNPA, CRAR, MOM Disbursement, Collection Efficiency, ALM, Borrowing Details (Excel)',
    ],
  },
];

export const PIPELINE_STAGES: { id: PipelineStage; label: string; description: string }[] = [
  { id: 'lead_received', label: 'Lead Received', description: 'Initial lead captured' },
  { id: 'meeting_done', label: 'Meeting Done', description: 'Client meeting completed' },
  { id: 'documents_requested', label: 'Documents Requested', description: 'Checklist activated' },
  { id: 'internal_processing', label: 'Internal Processing', description: 'Leverest internal review' },
  { id: 'bank_connect', label: 'Bank Connect', description: 'Bank connected, commission set' },
  { id: 'proposal_sent', label: 'Proposal Sent', description: 'Proposal submitted to client' },
  { id: 'bank_document_stage', label: 'Bank Document Stage', description: 'Bank docs collected' },
  { id: 'approved', label: 'Approved', description: 'Loan sanctioned' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
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
