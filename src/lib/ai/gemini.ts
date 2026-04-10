import Groq from 'groq-sdk';

// ─── Groq Client ──────────────────────────────────────────────────────────────

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectContext {
  project: any;
  documents: any[];
  queries: any[];
  notes: any[];
  activity: any[];
  members: any[];
  spocs: any[];
}

// ─── Context Builder ──────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  lead_received: 'Lead Received',
  meeting_done: 'Meeting Done',
  documents_requested: 'Documents Requested',
  docs_requested: 'Documents Requested',
  internal_processing: 'Internal Processing',
  processing: 'Processing',
  proposal_sent: 'Proposal Sent',
  bank_connect: 'Bank Connect',
  bank_docs: 'Bank Documents',
  approved: 'Approved',
};

export function buildProjectSystemPrompt(ctx: ProjectContext): string {
  const p = ctx.project;

  // ── Project Overview
  const overview = [
    `## PROJECT: ${p.client_name || p.company_name || p.name}`,
    `- **Stage:** ${STAGE_LABELS[p.stage] || p.stage}`,
    `- **Company Type:** ${p.company_type === 'nbfc' ? 'NBFC' : 'Manufacturing / Service'}`,
    p.loan_type ? `- **Loan Type:** ${p.loan_type}` : null,
    p.loan_amount ? `- **Loan Amount:** ₹${(p.loan_amount / 10000000).toFixed(2)} Cr` : null,
    p.lead_source ? `- **Lead Source:** ${p.lead_source}` : null,
    p.branch ? `- **Branch:** ${p.branch}` : null,
    p.contact_person ? `- **Contact:** ${p.contact_person} (${p.contact_email || ''})` : null,
    p.description ? `- **Description:** ${p.description}` : null,
    p.commission_percent ? `- **Commission:** ${p.commission_percent}%` : null,
    p.approval_score ? `- **Approval Score:** ${p.approval_score}/100` : null,
    `- **Created:** ${p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : 'Unknown'}`,
  ].filter(Boolean).join('\n');

  // ── Documents
  const received = ctx.documents.filter(d => d.status === 'received');
  const pending = ctx.documents.filter(d => d.status === 'pending');
  const required = ctx.documents.filter(d => d.status === 'required');
  const docPct = ctx.documents.length
    ? Math.round((received.length / ctx.documents.length) * 100)
    : 0;

  const docSection = [
    `## DOCUMENTS (${ctx.documents.length} total, ${docPct}% complete)`,
    `**Received (${received.length}):** ${received.map(d => d.document_name || d.name).join(', ') || 'None'}`,
    `**Pending (${pending.length}):** ${pending.map(d => d.document_name || d.name).join(', ') || 'None'}`,
    `**Missing (${required.length}):** ${required.map(d => d.document_name || d.name).join(', ') || 'None'}`,
  ].join('\n');

  // ── Queries
  const openQueries = ctx.queries.filter(q => q.status === 'open');
  const querySection = ctx.queries.length > 0
    ? [
        `## QUERIES (${ctx.queries.length} total, ${openQueries.length} open)`,
        ...ctx.queries.slice(0, 10).map(q =>
          `- [${q.status.toUpperCase()}] "${q.title}": ${q.description?.slice(0, 100) || ''}`
        ),
      ].join('\n')
    : '## QUERIES\nNo queries raised yet.';

  // ── Notes
  const noteSection = ctx.notes.length > 0
    ? [
        `## INTERNAL NOTES (${ctx.notes.length})`,
        ...ctx.notes.slice(0, 10).map(n =>
          `- [${new Date(n.created_at).toLocaleDateString('en-IN')}] ${n.created_by || n.created_by_name || 'Team'}: "${(n.note || n.content || '').slice(0, 200)}"`
        ),
      ].join('\n')
    : '## INTERNAL NOTES\nNo internal notes yet.';

  // ── Activity
  const activitySection = ctx.activity.length > 0
    ? [
        `## RECENT ACTIVITY (last ${Math.min(ctx.activity.length, 15)})`,
        ...ctx.activity.slice(0, 15).map(a =>
          `- [${new Date(a.created_at).toLocaleDateString('en-IN')}] ${a.action} by ${a.performed_by}`
        ),
      ].join('\n')
    : '## RECENT ACTIVITY\nNo activity recorded yet.';

  // ── Team
  const teamSection = [
    `## ASSIGNED TEAM (${ctx.members.length})`,
    ...ctx.members.map(m => `- ${m.user_email}`),
    ctx.spocs.length > 0
      ? `## CLIENT SPOCs (${ctx.spocs.length})\n${ctx.spocs.map(s => `- ${s.name} (${s.email})`).join('\n')}`
      : '',
  ].join('\n');

  return `You are the Leverest AI Project Assistant — an intelligent aide built into the Leverest Fintech platform. You have complete knowledge of the project described below.

Your role:
1. Answer questions about this specific project accurately using ONLY the data provided below.
2. Help the team understand document status, deal progress, and next steps.
3. Provide actionable insights and recommendations based on the project data.
4. Summarize complex information clearly and concisely.
5. If you don't have enough data to answer, say so clearly — never make up data.

Guidelines:
- Respond in clear, professional language suitable for a financial services team.
- Use bullet points and structured formatting for readability.
- When discussing amounts, use Indian currency format (₹ Cr, ₹ L).
- Be proactive in highlighting risks, bottlenecks, or missing items.
- Keep responses concise but thorough.

─────────────────── PROJECT DATA ───────────────────

${overview}

${docSection}

${querySection}

${noteSection}

${activitySection}

${teamSection}

─────────────────── END DATA ───────────────────`;
}

// ─── Chat Function (Groq) ─────────────────────────────────────────────────────

export async function chatWithProject(
  projectContext: ProjectContext,
  messages: { role: 'user' | 'model'; content: string }[],
  userMessage: string,
): Promise<string> {
  const systemPrompt = buildProjectSystemPrompt(projectContext);

  // Convert history to Groq/OpenAI format
  const chatMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
  });

  return completion.choices[0]?.message?.content || 'No response generated.';
}
