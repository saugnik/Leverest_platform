
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

export type PipelineStage = string;

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
  query_type: 'internal' | 'document';
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  response?: string;
  response_document_url?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Bank concepts removed
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
  type: 'document' | 'query' | 'stage' | 'deadline' | 'message';
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
  { id: 'client_meeting', label: 'Client Meeting Created', description: 'Assigned Bank Name can be Unknown' },
  { id: 'request_documents', label: 'Request Documents', description: 'Send email requesting basic documents' },
  { id: 'follow_up_documents', label: 'Doc Follow-up', description: 'Track requested documents receipt' },
  { id: 'executive_summary', label: 'Executive Summary', description: 'Prepare summary post doc receipt' },
  { id: 'bank_identification', label: 'Bank Identification', description: 'Identify suitable banks for proposal' },
  { id: 'preliminary_meetings', label: 'Preliminary Meetings', description: 'Discuss new proposal with banks' },
  { id: 'shortlisting', label: 'Shortlisting', description: 'List banks expressing interest' },
  { id: 'data_sharing', label: 'Data Sharing', description: 'Send document package to banks' },
  { id: 'bank_revert', label: 'Bank Revert', description: 'Initial feedback from banks' },
  { id: 'query_handling', label: 'Query Handling', description: 'Collect queries from banks' },
  { id: 'resolution', label: 'Resolution', description: 'Sort queries and send to client' },
  { id: 'follow_up_queries', label: 'Follow-up Queries', description: 'Ensure client replies' },
  { id: 'prepare_query_reply', label: 'Prepare Query Reply', description: 'Draft and get reviewed by EP' },
  { id: 'review_query_reply', label: 'Review Query Reply', description: 'Review and finalize reply' },
  { id: 'submission', label: 'Submission', description: 'Forward replies back to banks' },
  { id: 'initiate_legal_valuation', label: 'Legal & Valuation', description: 'Initiate and obtain draft reports' },
  { id: 'client_bank_meeting', label: 'Client-Bank Meeting', description: 'Arrange VC/Meeting' },
  { id: 'secondary_queries', label: 'Secondary Queries', description: 'Address post-meeting queries' },
  { id: 'submit_final_note', label: 'Submit Final Note', description: 'Submit note/sheet before approval' },
  { id: 'in_principal_sanction', label: 'In-Principal Sanction', description: 'Secure sanction letter' },
  { id: 'followup_bank_1', label: 'Follow-up Bank (T+2)', description: 'Follow-up if sanction delayed' },
  { id: 'terms_discussion', label: 'Terms Discussion', description: 'Discuss pricing/security with client' },
  { id: 'bank_coordination', label: 'Bank Coordination', description: 'Inform client requests & get draft' },
  { id: 'sanction_approval', label: 'Sanction Approval', description: 'Review draft and approach for final' },
  { id: 'condition_review', label: 'Condition Review (PDC)', description: 'Check pre-disbursement conditions' },
  { id: 'rectification', label: 'Rectification', description: 'Address outstanding PDCs' },
  { id: 'final_sanction', label: 'Final Sanction', description: 'Secure formal setup' },
  { id: 'followup_bank_2', label: 'Follow-up Bank (T+2)', description: 'Follow-up if final sanction delayed' },
  { id: 'compliance', label: 'Compliance', description: 'Fulfill pre-disbursement conditions' },
  { id: 'disbursement', label: 'Disbursement', description: 'Execute loan process' },
  { id: 'post_disb_compliance', label: 'Post-Disb. Compliance', description: 'Monitor post-disbursement terms' },
  { id: 'future_planning', label: 'Future Planning', description: 'Discuss next facility needs' },
  { id: 'fee_realization', label: 'Fee Realization', description: 'Ensure fee received' },
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
