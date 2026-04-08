import {
  User,
  Project,
  DocumentItem,
  Query,
  BankSuggestion,
  ActivityLog,
  InternalNote,
  BankCommunication,
  Message,
  Notification,
  ClientSPOC,
  MANUFACTURING_SERVICE_CHECKLIST,
  NBFC_CHECKLIST,
} from './types';

// ─── MOCK USERS ────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'admin@leverestfin.com',
    name: 'Arjun Sharma',
    role: 'admin',
    branch: 'kolkata',
    designation: 'Admin',
    phone: '+91 98300 00001',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u10',
    email: 'manager@leverestfin.com',
    name: 'New Manager',
    role: 'manager',
    branch: 'kolkata',
    designation: 'Manager',
    phone: '+91 98300 00010',
    is_active: true,
    created_at: '2024-04-08T00:00:00Z',
  },
  {
    id: 'u2',
    email: 'rajesh.rp@leverestfin.com',
    name: 'Rajesh Kumar',
    role: 'relation_partner',
    branch: 'kolkata',
    designation: 'Relation Partner',
    phone: '+91 98300 00002',
    is_active: true,
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: 'u3',
    email: 'priya.rm@leverestfin.com',
    name: 'Priya Mehta',
    role: 'relation_manager',
    branch: 'kolkata',
    designation: 'Relation Manager',
    phone: '+91 98300 00003',
    is_active: true,
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 'u4',
    email: 'deepak.ep@leverestfin.com',
    name: 'Deepak Banerjee',
    role: 'engagement_partner',
    branch: 'kolkata',
    designation: 'Engagement Partner',
    phone: '+91 98300 00004',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'u5',
    email: 'sneha.em@leverestfin.com',
    name: 'Sneha Das',
    role: 'engagement_manager',
    branch: 'kolkata',
    designation: 'Engagement Manager',
    phone: '+91 98300 00005',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'u6',
    email: 'rohit.exec@leverestfin.com',
    name: 'Rohit Ghosh',
    role: 'executive',
    branch: 'kolkata',
    designation: 'Executive 1',
    phone: '+91 98300 00006',
    is_active: true,
    created_at: '2024-02-10T00:00:00Z',
  },
  {
    id: 'u7',
    email: 'anita.accounts@leverestfin.com',
    name: 'Anita Roy',
    role: 'accounts',
    branch: 'kolkata',
    designation: 'Accounts',
    phone: '+91 98300 00007',
    is_active: true,
    created_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'u8',
    email: 'suresh.mis@leverestfin.com',
    name: 'Suresh Patel',
    role: 'mis',
    branch: 'kolkata',
    designation: 'MIS',
    phone: '+91 98300 00008',
    is_active: true,
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'u9',
    email: 'amit.rm2@leverestfin.com',
    name: 'Amit Verma',
    role: 'relation_manager',
    branch: 'kolkata',
    designation: 'Relation Manager',
    phone: '+91 98300 00009',
    is_active: true,
    created_at: '2024-03-10T00:00:00Z',
  },
];

// ─── MOCK CLIENT SPOCs ──────────────────────────────────────────────────────────

export const MOCK_SPOCS: ClientSPOC[] = [
  {
    id: 'spoc1',
    project_id: 'p1',
    name: 'Vikram Agarwal',
    email: 'vikram@acmetextiles.com',
    phone: '+91 98765 00001',
    designation: 'CFO',
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'spoc2',
    project_id: 'p1',
    name: 'Meera Joshi',
    email: 'meera@acmetextiles.com',
    phone: '+91 98765 00002',
    designation: 'Finance Manager',
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'spoc3',
    project_id: 'p2',
    name: 'Kiran Reddy',
    email: 'kiran@technovisionit.com',
    phone: '+91 98765 00003',
    designation: 'Director',
    is_active: true,
    created_at: '2025-02-01T00:00:00Z',
  },
  {
    id: 'spoc4',
    project_id: 'p3',
    name: 'Arun Shah',
    email: 'arun@sunrisenbfc.com',
    phone: '+91 98765 00004',
    designation: 'CEO',
    is_active: true,
    created_at: '2025-02-20T00:00:00Z',
  },
];

// ─── MOCK PROJECTS ──────────────────────────────────────────────────────────────

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'ACME Textiles — Working Capital',
    company_name: 'ACME Textiles Pvt. Ltd.',
    company_type: 'manufacturing_service',
    branch: 'kolkata',
    stage: 'bank_connect',
    lead_source: 'referral',
    loan_type: 'working_capital',
    loan_amount: 25000000,
    assigned_team: [
      'rajesh.rp@leverestfin.com',
      'priya.rm@leverestfin.com',
      'rohit.exec@leverestfin.com',
    ],
    spoc_ids: ['spoc1', 'spoc2'],
    approval_score: 82,
    commission_percentage: 1.5,
    commission_amount: 375000,
    commission_status: 'pending',
    selected_bank: 'HDFC Bank',
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-03-20T14:30:00Z',
    created_by: 'admin@leverestfin.com',
    contact_person: 'Vikram Agarwal',
    contact_email: 'vikram@acmetextiles.com',
    contact_phone: '+91 98765 00001',
    description: 'Working capital loan for inventory financing and trade settlements.',
    deadline: '2025-05-30T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'TechnoVision IT — Term Loan',
    company_name: 'TechnoVision IT Solutions Pvt. Ltd.',
    company_type: 'manufacturing_service',
    branch: 'kolkata',
    stage: 'proposal_sent',
    lead_source: 'direct',
    loan_type: 'term_loan',
    loan_amount: 15000000,
    assigned_team: [
      'deepak.ep@leverestfin.com',
      'sneha.em@leverestfin.com',
      'rohit.exec@leverestfin.com',
    ],
    spoc_ids: ['spoc3'],
    approval_score: 67,
    commission_percentage: 1.25,
    commission_amount: 187500,
    commission_status: 'pending',
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-03-25T11:00:00Z',
    created_by: 'admin@leverestfin.com',
    contact_person: 'Kiran Reddy',
    contact_email: 'kiran@technovisionit.com',
    contact_phone: '+91 98765 00003',
    description: 'Term loan for office expansion and equipment purchase.',
    deadline: '2025-06-15T00:00:00Z',
  },
  {
    id: 'p3',
    name: 'Sunrise NBFC — Debt Refinancing',
    company_name: 'Sunrise NBFC Ltd.',
    company_type: 'nbfc',
    branch: 'kolkata',
    stage: 'documents_requested',
    lead_source: 'ca_referral',
    loan_type: 'term_loan',
    loan_amount: 100000000,
    assigned_team: [
      'rajesh.rp@leverestfin.com',
      'deepak.ep@leverestfin.com',
      'sneha.em@leverestfin.com',
    ],
    spoc_ids: ['spoc4'],
    approval_score: 55,
    commission_percentage: 0.75,
    commission_amount: 750000,
    commission_status: 'pending',
    created_at: '2025-02-20T09:00:00Z',
    updated_at: '2025-03-28T16:45:00Z',
    created_by: 'admin@leverestfin.com',
    contact_person: 'Arun Shah',
    contact_email: 'arun@sunrisenbfc.com',
    contact_phone: '+91 98765 00004',
    description: 'Debt refinancing and fresh term loan for portfolio expansion.',
    deadline: '2025-07-01T00:00:00Z',
  },
  {
    id: 'p4',
    name: 'Bengal Steel Industries — Project Finance',
    company_name: 'Bengal Steel Industries Pvt. Ltd.',
    company_type: 'manufacturing_service',
    branch: 'kolkata',
    stage: 'internal_processing',
    lead_source: 'broker',
    loan_type: 'project_finance',
    loan_amount: 50000000,
    assigned_team: [
      'priya.rm@leverestfin.com',
      'rohit.exec@leverestfin.com',
    ],
    spoc_ids: [],
    approval_score: 71,
    commission_percentage: 1.0,
    commission_amount: 500000,
    commission_status: 'pending',
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-03-30T09:15:00Z',
    created_by: 'admin@leverestfin.com',
    contact_person: 'Subhash Chatterjee',
    contact_email: 'subhash@bengalsteel.com',
    contact_phone: '+91 98765 00005',
    description: 'Project finance for new manufacturing plant setup.',
    deadline: '2025-08-01T00:00:00Z',
  },
  {
    id: 'p5',
    name: 'Kolkata Pharma Ltd — OD/CC',
    company_name: 'Kolkata Pharma Ltd.',
    company_type: 'manufacturing_service',
    branch: 'kolkata',
    stage: 'approved',
    lead_source: 'referral',
    loan_type: 'od_cc',
    loan_amount: 20000000,
    assigned_team: [
      'rajesh.rp@leverestfin.com',
      'priya.rm@leverestfin.com',
    ],
    spoc_ids: [],
    approval_score: 91,
    commission_percentage: 1.5,
    commission_amount: 300000,
    commission_status: 'paid',
    selected_bank: 'SBI',
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2025-03-15T10:00:00Z',
    created_by: 'admin@leverestfin.com',
    contact_person: 'Ratan Sen',
    contact_email: 'ratan@kolkatapharma.com',
    contact_phone: '+91 98765 00006',
    description: 'OD/CC facility for working capital requirements.',
    deadline: '2025-02-28T00:00:00Z',
  },
  {
    id: 'p6',
    name: 'Eastern Logistics — Lead',
    company_name: 'Eastern Logistics Pvt. Ltd.',
    company_type: 'manufacturing_service',
    branch: 'kolkata',
    stage: 'lead_received',
    lead_source: 'website',
    loan_type: 'working_capital',
    loan_amount: 8000000,
    assigned_team: ['priya.rm@leverestfin.com'],
    spoc_ids: [],
    approval_score: 45,
    created_at: '2025-04-01T09:00:00Z',
    updated_at: '2025-04-01T09:00:00Z',
    created_by: 'admin@leverestfin.com',
    contact_person: 'Dinesh Kumar',
    contact_email: 'dinesh@easternlogistics.com',
    contact_phone: '+91 98765 00007',
    description: 'Working capital for fleet expansion.',
  },
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

export const MOCK_DOCUMENTS: DocumentItem[] = [
  ...generateDocuments('p1', 'manufacturing_service'),
  ...generateDocuments('p2', 'manufacturing_service'),
  ...generateDocuments('p3', 'nbfc'),
  ...generateDocuments('p4', 'manufacturing_service'),
  ...generateDocuments('p5', 'manufacturing_service'),
];

// ─── MOCK QUERIES ───────────────────────────────────────────────────────────────

export const MOCK_QUERIES: Query[] = [
  {
    id: 'q1',
    project_id: 'p1',
    title: 'Latest bank statement required',
    description: 'Please provide the bank statement for the last 3 months (Jan–Mar 2025) for all accounts.',
    raised_by: 'priya.rm@leverestfin.com',
    raised_by_name: 'Priya Mehta',
    query_type: 'document',
    status: 'open',
    priority: 'high',
    created_at: '2025-03-25T10:00:00Z',
    updated_at: '2025-03-25T10:00:00Z',
  },
  {
    id: 'q2',
    project_id: 'p1',
    title: 'HDFC Bank — Clarification on financials',
    description: 'HDFC Bank has requested clarification on the FY 2023-24 revenue recognition policy. Please provide a detailed note.',
    raised_by: 'rajesh.rp@leverestfin.com',
    raised_by_name: 'Rajesh Kumar',
    query_type: 'bank',
    status: 'in_progress',
    priority: 'high',
    created_at: '2025-03-20T14:00:00Z',
    updated_at: '2025-03-22T09:00:00Z',
  },
  {
    id: 'q3',
    project_id: 'p1',
    title: 'Shareholding pattern discrepancy',
    description: 'The shareholding pattern submitted shows 105% total. Please rectify and resubmit.',
    raised_by: 'rohit.exec@leverestfin.com',
    raised_by_name: 'Rohit Ghosh',
    query_type: 'internal',
    status: 'resolved',
    priority: 'medium',
    created_at: '2025-03-10T11:00:00Z',
    updated_at: '2025-03-12T16:00:00Z',
    resolved_at: '2025-03-12T16:00:00Z',
  },
  {
    id: 'q4',
    project_id: 'p2',
    title: 'Order book required for last 6 months',
    description: 'Please share the order book and work-in-hand for the last 6 months with client details.',
    raised_by: 'sneha.em@leverestfin.com',
    raised_by_name: 'Sneha Das',
    query_type: 'document',
    status: 'open',
    priority: 'medium',
    created_at: '2025-03-28T09:00:00Z',
    updated_at: '2025-03-28T09:00:00Z',
  },
];

// ─── MOCK BANK SUGGESTIONS ─────────────────────────────────────────────────────

export const MOCK_BANK_SUGGESTIONS: BankSuggestion[] = [
  {
    id: 'bs1',
    project_id: 'p1',
    bank_name: 'HDFC Bank',
    interest_rate: 10.5,
    processing_time: '15-20 business days',
    commission_percentage: 1.5,
    emi_estimate: 537500,
    pros: ['Fastest processing', 'Flexible repayment', 'Pre-approved eligibility'],
    cons: ['Higher processing fee'],
    is_selected: true,
    suggested_by: 'rajesh.rp@leverestfin.com',
    suggested_at: '2025-03-18T11:00:00Z',
  },
  {
    id: 'bs2',
    project_id: 'p1',
    bank_name: 'ICICI Bank',
    interest_rate: 10.75,
    processing_time: '20-25 business days',
    commission_percentage: 1.25,
    emi_estimate: 545833,
    pros: ['Strong branch network', 'Good relationship'],
    cons: ['Slightly slower', 'More documentation'],
    is_selected: false,
    suggested_by: 'rajesh.rp@leverestfin.com',
    suggested_at: '2025-03-18T11:00:00Z',
  },
  {
    id: 'bs3',
    project_id: 'p1',
    bank_name: 'Axis Bank',
    interest_rate: 11.0,
    processing_time: '18-22 business days',
    commission_percentage: 1.0,
    emi_estimate: 554167,
    pros: ['Good terms for textile sector'],
    cons: ['Higher interest rate'],
    is_selected: false,
    suggested_by: 'rajesh.rp@leverestfin.com',
    suggested_at: '2025-03-18T11:00:00Z',
  },
];

// ─── MOCK ACTIVITY LOGS ─────────────────────────────────────────────────────────

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'al1',
    project_id: 'p1',
    action: 'stage_updated',
    description: 'Project stage updated from "Proposal Sent" to "Bank Connect"',
    performed_by: 'rajesh.rp@leverestfin.com',
    performed_by_name: 'Rajesh Kumar',
    created_at: '2025-03-20T14:30:00Z',
  },
  {
    id: 'al2',
    project_id: 'p1',
    action: 'document_uploaded',
    description: 'ACME Textiles uploaded "3 Year Audited Financials"',
    performed_by: 'vikram@acmetextiles.com',
    performed_by_name: 'Vikram Agarwal (SPOC)',
    created_at: '2025-03-18T11:00:00Z',
  },
  {
    id: 'al3',
    project_id: 'p1',
    action: 'bank_suggested',
    description: '3 banks suggested to client: HDFC Bank, ICICI Bank, Axis Bank',
    performed_by: 'rajesh.rp@leverestfin.com',
    performed_by_name: 'Rajesh Kumar',
    created_at: '2025-03-18T11:00:00Z',
  },
  {
    id: 'al4',
    project_id: 'p1',
    action: 'query_raised',
    description: 'Query raised: "Latest bank statement required"',
    performed_by: 'priya.rm@leverestfin.com',
    performed_by_name: 'Priya Mehta',
    created_at: '2025-03-25T10:00:00Z',
  },
  {
    id: 'al5',
    project_id: 'p1',
    action: 'bank_selected',
    description: 'Client selected HDFC Bank as preferred lender',
    performed_by: 'vikram@acmetextiles.com',
    performed_by_name: 'Vikram Agarwal (SPOC)',
    created_at: '2025-03-22T15:00:00Z',
  },
];

// ─── MOCK INTERNAL NOTES ───────────────────────────────────────────────────────

export const MOCK_NOTES: InternalNote[] = [
  {
    id: 'n1',
    project_id: 'p1',
    content: 'Client is flexible on processing fee but very strict about turnaround time. Target HDFC for fastest processing.',
    created_by: 'rajesh.rp@leverestfin.com',
    created_by_name: 'Rajesh Kumar',
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z',
  },
  {
    id: 'n2',
    project_id: 'p1',
    content: 'FY23 EBITDA margins are lower due to one-time legal costs — need to flag this proactively to bank and give context.',
    created_by: 'priya.rm@leverestfin.com',
    created_by_name: 'Priya Mehta',
    created_at: '2025-03-17T14:00:00Z',
    updated_at: '2025-03-17T14:00:00Z',
  },
];

// ─── MOCK BANK COMMUNICATIONS ──────────────────────────────────────────────────

export const MOCK_BANK_COMMS: BankCommunication[] = [
  {
    id: 'bc1',
    project_id: 'p1',
    bank_name: 'HDFC Bank',
    communication_type: 'call',
    summary: 'Spoke with RM Ashish. Bank is interested. Term sheet expected by next week.',
    next_steps: 'Follow up on Thursday for term sheet.',
    communicated_by: 'rajesh.rp@leverestfin.com',
    communicated_by_name: 'Rajesh Kumar',
    communicated_at: '2025-03-19T16:00:00Z',
  },
  {
    id: 'bc2',
    project_id: 'p1',
    bank_name: 'HDFC Bank',
    communication_type: 'email',
    summary: 'Sent financial package and CMA report to bank email.',
    communicated_by: 'priya.rm@leverestfin.com',
    communicated_by_name: 'Priya Mehta',
    communicated_at: '2025-03-20T10:00:00Z',
  },
];

// ─── MOCK MESSAGES ─────────────────────────────────────────────────────────────

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg1',
    project_id: 'p1',
    content: 'Hi team, we have uploaded the latest bank statements. Please check.',
    sender_id: 'spoc1',
    sender_name: 'Vikram Agarwal',
    sender_type: 'client',
    created_at: '2025-03-18T12:00:00Z',
    read_by: ['rajesh.rp@leverestfin.com'],
  },
  {
    id: 'msg2',
    project_id: 'p1',
    content: 'Thank you Vikram, we have reviewed the statements. We will share the proposal today.',
    sender_id: 'u2',
    sender_name: 'Rajesh Kumar',
    sender_type: 'team',
    created_at: '2025-03-18T14:00:00Z',
    read_by: ['spoc1', 'spoc2'],
  },
];

// ─── MOCK NOTIFICATIONS ────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    user_id: 'u2',
    title: 'New Document Uploaded',
    message: 'ACME Textiles uploaded 3 Year Audited Financials',
    type: 'document',
    project_id: 'p1',
    is_read: false,
    created_at: '2025-03-18T11:00:00Z',
  },
  {
    id: 'notif2',
    user_id: 'u2',
    title: 'Query Response Received',
    message: 'SPOC responded to bank statement query',
    type: 'query',
    project_id: 'p1',
    is_read: false,
    created_at: '2025-03-25T15:00:00Z',
  },
  {
    id: 'notif3',
    user_id: 'u2',
    title: 'Bank Selected by Client',
    message: 'ACME Textiles selected HDFC Bank',
    type: 'bank',
    project_id: 'p1',
    is_read: true,
    created_at: '2025-03-22T15:00:00Z',
  },
  {
    id: 'notif4',
    user_id: 'u3',
    title: 'Deadline Approaching',
    message: 'TechnoVision IT project deadline is in 10 days',
    type: 'deadline',
    project_id: 'p2',
    is_read: false,
    created_at: '2025-04-05T09:00:00Z',
  },
];

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
  if (
    userRole === 'admin' ||
    userRole === 'accounts' ||
    userRole === 'mis' ||
    userRole === 'engagement_assistant'
  ) {
    return MOCK_PROJECTS;
  }
  return MOCK_PROJECTS.filter((p) => p.assigned_team.includes(userEmail));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getStageIndex(stage: string): number {
  const stages = [
    'lead_received',
    'meeting_done',
    'documents_requested',
    'internal_processing',
    'bank_connect',
    'proposal_sent',
    'bank_document_stage',
    'approved',
  ];
  return stages.indexOf(stage);
}
