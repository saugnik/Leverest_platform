'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeft, Send, Bot, User, Sparkles, Loader2, Trash2,
  Copy, Check, FileText, MessageSquare, Activity, AlertCircle,
  Brain, Lightbulb, HelpCircle, BarChart3, FolderOpen, Eye,
  Download, ChevronRight, Table2, X, Pencil, Save, Image,
  FileSpreadsheet, File, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedTable?: ExtractedTable | null;
};

type ExtractedTable = {
  headers: string[];
  rows: string[][];
};

type DocFile = {
  id: string;
  document_name: string;
  category: string;
  status: string;
  file_url?: string;
  file_name?: string;
  file_source?: string;
};

const SUGGESTED_PROMPTS = [
  { icon: FileText, text: 'What documents are still missing?', color: '#F87171' },
  { icon: BarChart3, text: "Summarize this project's current status", color: '#60A5FA' },
  { icon: AlertCircle, text: 'What are the key risks or bottlenecks?', color: '#FCD34D' },
  { icon: Lightbulb, text: 'What should be the next steps?', color: '#4ADE80' },
  { icon: Table2, text: 'Extract financial data into a table from the selected document', color: '#A78BFA' },
  { icon: HelpCircle, text: 'Are there any open queries to resolve?', color: '#FB923C' },
];

function formatAIResponse(text: string): string {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*)/gm, '<li>$1</li>')
    .replace(/^### (.*)/gm, '<h4 style="color:var(--gold);margin:12px 0 6px;font-size:0.85rem;font-weight:700;">$1</h4>')
    .replace(/^## (.*)/gm, '<h3 style="color:var(--gold);margin:14px 0 8px;font-size:0.92rem;font-weight:700;">$1</h3>')
    .replace(/\n/g, '<br/>');

  html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, (match) => {
    const cleaned = match.replace(/<br\/>/g, '');
    return `<ul style="margin:6px 0;padding-left:18px;list-style:disc;">${cleaned}</ul>`;
  });

  return html;
}

// Try to parse table from AI response
function tryParseTable(text: string): ExtractedTable | null {
  const lines = text.split('\n').filter(l => l.trim());
  const tableLines = lines.filter(l => l.includes('|') && l.trim().startsWith('|'));
  if (tableLines.length < 3) return null;

  const parseRow = (line: string) =>
    line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));

  const headers = parseRow(tableLines[0]);
  if (headers.length < 2) return null;

  // Skip the separator line (line with dashes)
  const dataLines = tableLines.slice(1).filter(l => !l.match(/^\|[\s-:|]+\|$/));
  const rows = dataLines.map(parseRow).filter(r => r.length === headers.length);

  if (rows.length === 0) return null;
  return { headers, rows };
}

function getFileIcon(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.pdf')) return <FileText size={14} color="#F87171" />;
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return <FileSpreadsheet size={14} color="#4ADE80" />;
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return <Image size={14} color="#60A5FA" />;
  return <File size={14} color="var(--text-3)" />;
}

function getStatusDot(status: string) {
  const color = status === 'received' ? '#4ADE80' : status === 'pending' ? '#FCD34D' : '#F87171';
  return <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

export default function ProjectAssistantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Document panel state
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Editable table state
  const [editingTable, setEditingTable] = useState<{ msgId: string; data: ExtractedTable } | null>(null);

  // Load project name + documents
  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.project) {
          setProjectName(data.project.client_name || data.project.company_name || data.project.name || 'Project');
        }
        if (data.documents) {
          setDocs(data.documents);
        }
      })
      .catch(console.error);
  }, [id]);

  // Load saved messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`ai_chat_${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {}
    }
  }, [id]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_chat_${id}`, JSON.stringify(messages));
    }
  }, [messages, id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // If a document is selected, add context about it
      let enrichedMsg = msg;
      if (selectedDoc) {
        enrichedMsg = `[User is currently viewing document: "${selectedDoc.document_name}" (Category: ${selectedDoc.category}, Status: ${selectedDoc.status})]\n\n${msg}`;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          messages: chatHistory,
          message: enrichedMsg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI service error');
      }

      // Try to detect if the AI generated a table
      const table = tryParseTable(data.response);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        extractedTable: table,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Failed to get response. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function copyToClipboard(text: string, msgId: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(`ai_chat_${id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startEditTable(msgId: string, table: ExtractedTable) {
    setEditingTable({ msgId, data: { headers: [...table.headers], rows: table.rows.map(r => [...r]) } });
  }

  function updateTableCell(rowIdx: number, colIdx: number, value: string) {
    if (!editingTable) return;
    const newRows = editingTable.data.rows.map((r, ri) =>
      ri === rowIdx ? r.map((c, ci) => ci === colIdx ? value : c) : r
    );
    setEditingTable({ ...editingTable, data: { ...editingTable.data, rows: newRows } });
  }

  function saveTableEdit() {
    if (!editingTable) return;
    setMessages(prev => prev.map(m =>
      m.id === editingTable.msgId ? { ...m, extractedTable: editingTable.data } : m
    ));
    setEditingTable(null);
  }

  function exportTableCSV(table: ExtractedTable) {
    const csv = [table.headers.join(','), ...table.rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_extracted_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const receivedDocs = docs.filter(d => d.status === 'received');
  const pendingDocs = docs.filter(d => d.status !== 'received');

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }} className="fade-up">

      {/* ═══════════════ LEFT: Document Sidebar ═══════════════ */}
      <div style={{
        width: sidebarOpen ? '280px' : '0px',
        minWidth: sidebarOpen ? '280px' : '0px',
        borderRight: sidebarOpen ? '1px solid var(--bg-border)' : 'none',
        background: 'var(--bg-main)',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '16px', borderBottom: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={16} color="var(--gold)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-1)' }}>Project Files</span>
          </div>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
            background: 'rgba(201,150,12,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,150,12,0.2)',
          }}>
            {docs.length}
          </span>
        </div>

        {/* Document List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {/* Received Documents */}
          {receivedDocs.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: '#4ADE80', padding: '4px 8px', marginBottom: '4px',
              }}>
                ✓ Received ({receivedDocs.length})
              </div>
              {receivedDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: selectedDoc?.id === doc.id ? 'rgba(201,150,12,0.1)' : 'transparent',
                    borderLeft: selectedDoc?.id === doc.id ? '2px solid var(--gold)' : '2px solid transparent',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (selectedDoc?.id !== doc.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (selectedDoc?.id !== doc.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {getFileIcon(doc.file_name || doc.document_name)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-1)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {doc.document_name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>{doc.category}</div>
                  </div>
                  <ChevronRight size={12} color="var(--text-4)" />
                </button>
              ))}
            </div>
          )}

          {/* Pending / Missing */}
          {pendingDocs.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: '#FCD34D', padding: '4px 8px', marginBottom: '4px',
              }}>
                ⏳ Pending / Missing ({pendingDocs.length})
              </div>
              {pendingDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: selectedDoc?.id === doc.id ? 'rgba(201,150,12,0.1)' : 'transparent',
                    borderLeft: selectedDoc?.id === doc.id ? '2px solid var(--gold)' : '2px solid transparent',
                    opacity: 0.6, transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (selectedDoc?.id !== doc.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (selectedDoc?.id !== doc.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {getStatusDot(doc.status)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-2)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {doc.document_name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>{doc.status}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {docs.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.75rem' }}>
              No documents found for this project.
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ CENTER: Document Viewer ═══════════════ */}
      {selectedDoc && (
        <div style={{
          width: '420px', minWidth: '420px', borderRight: '1px solid var(--bg-border)',
          background: 'var(--bg-main)', display: 'flex', flexDirection: 'column',
        }}>
          {/* Viewer Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--bg-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <Eye size={14} color="var(--gold)" />
              <span style={{
                fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-1)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {selectedDoc.document_name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className={`pill ${selectedDoc.status === 'received' ? 'pill-green' : selectedDoc.status === 'pending' ? 'pill-gold' : 'pill-red'}`}>
                {selectedDoc.status}
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  display: 'flex', padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Viewer Body */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {selectedDoc.file_url ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Try to embed PDF or image */}
                {selectedDoc.file_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={selectedDoc.file_url}
                    style={{ width: '100%', flex: 1, border: 'none' }}
                    title={selectedDoc.document_name}
                  />
                ) : (selectedDoc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                  <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <img src={selectedDoc.file_url} alt={selectedDoc.document_name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '16px',
                      background: 'rgba(201,150,12,0.1)', border: '1px solid rgba(201,150,12,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={28} color="var(--gold)" />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 600 }}>
                      {selectedDoc.file_name || selectedDoc.document_name}
                    </div>
                    <a
                      href={selectedDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                        color: 'var(--gold)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600,
                      }}
                    >
                      <Download size={14} /> Open Externally
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={32} color="var(--text-4)" />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                  No file uploaded yet
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
                  This document is {selectedDoc.status}. Ask the AI about it or upload a file.
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--bg-border)',
            display: 'flex', gap: '6px', flexWrap: 'wrap',
          }}>
            <button
              onClick={() => sendMessage(`Summarize the document "${selectedDoc.document_name}" and extract key data points.`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                borderRadius: '6px', border: '1px solid rgba(201,150,12,0.2)',
                background: 'rgba(201,150,12,0.05)', color: 'var(--gold)',
                fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Sparkles size={11} /> AI Summarize
            </button>
            <button
              onClick={() => sendMessage(`Extract all tabular/financial data from "${selectedDoc.document_name}" and present it as a formatted table.`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                borderRadius: '6px', border: '1px solid rgba(139,92,246,0.2)',
                background: 'rgba(139,92,246,0.05)', color: '#A78BFA',
                fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Table2 size={11} /> Extract Table
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ RIGHT: AI Chat Panel ═══════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-main)' }}>
        {/* Chat Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid var(--bg-border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                display: 'flex', padding: '4px',
              }}
              title={sidebarOpen ? 'Hide documents' : 'Show documents'}
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <Link href={`/dashboard/projects/${id}`} style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              <ArrowLeft size={14} />
            </Link>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(201,150,12,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(201,150,12,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={16} color="#F0B429" />
            </div>
            <div>
              <div style={{
                fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'var(--font-playfair)',
              }}>
                AI Assistant
                <span style={{
                  fontSize: '0.5rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #C9960C, #8B5CF6)',
                  padding: '1px 7px', borderRadius: '99px', color: '#000',
                }}>BETA</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>
                {projectName}
                {selectedDoc && (
                  <span style={{ color: 'var(--gold)' }}> · Viewing: {selectedDoc.document_name}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                color: '#F87171', fontSize: '0.72rem', fontWeight: 600,
              }}>
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div style={{
          flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column',
          gap: '4px', paddingBottom: '10px', minHeight: 0,
        }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(201,150,12,0.15), rgba(139,92,246,0.15))',
                border: '1px solid rgba(201,150,12,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 3s ease-in-out infinite',
              }}>
                <Sparkles size={32} color="#F0B429" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '6px' }}>
                  How can I help with {projectName || 'this project'}?
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', maxWidth: '420px' }}>
                  {selectedDoc
                    ? `I can see you've selected "${selectedDoc.document_name}". Ask me to extract data, summarize, or analyze it.`
                    : 'Select a document from the sidebar, or ask me anything about this project.'
                  }
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxWidth: '550px', width: '100%' }}>
                {SUGGESTED_PROMPTS.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt.text)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                        borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(201,150,12,0.3)';
                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--bg-border)';
                        e.currentTarget.style.background = 'var(--bg-card)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                        background: `${prompt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={13} color={prompt.color} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.3 }}>{prompt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex', gap: '10px', padding: '14px 20px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #3B82F6, #06B6D4)'
                      : 'linear-gradient(135deg, rgba(201,150,12,0.2), rgba(139,92,246,0.2))',
                    border: msg.role === 'assistant' ? '1px solid rgba(201,150,12,0.3)' : 'none',
                  }}>
                    {msg.role === 'user'
                      ? <User size={14} color="#fff" />
                      : <Bot size={14} color="#F0B429" />
                    }
                  </div>

                  {/* Message bubble */}
                  <div style={{
                    maxWidth: '80%', minWidth: '120px',
                    background: msg.role === 'user' ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--bg-border)'}`,
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '12px 16px',
                  }}>
                    {msg.role === 'assistant' ? (
                      <div
                        style={{ fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: 1.7 }}
                        dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    )}

                    {/* ── Extracted Table Rendering ── */}
                    {msg.extractedTable && (
                      <div style={{
                        marginTop: '14px', borderRadius: '8px', overflow: 'hidden',
                        border: '1px solid rgba(201,150,12,0.2)',
                        background: 'rgba(0,0,0,0.15)',
                      }}>
                        <div style={{
                          padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'rgba(201,150,12,0.08)', borderBottom: '1px solid rgba(201,150,12,0.15)',
                        }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Table2 size={12} /> Extracted Data
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {editingTable?.msgId === msg.id ? (
                              <button onClick={saveTableEdit} style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
                                borderRadius: '5px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.1)',
                                color: '#4ADE80', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
                              }}>
                                <Save size={10} /> Save
                              </button>
                            ) : (
                              <button onClick={() => startEditTable(msg.id, msg.extractedTable!)} style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
                                borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                                color: 'var(--text-3)', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer',
                              }}>
                                <Pencil size={10} /> Edit
                              </button>
                            )}
                            <button onClick={() => exportTableCSV(msg.extractedTable!)} style={{
                              display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
                              borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                              color: 'var(--text-3)', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer',
                            }}>
                              <Download size={10} /> CSV
                            </button>
                          </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                            <thead>
                              <tr>
                                {(editingTable?.msgId === msg.id ? editingTable.data.headers : msg.extractedTable.headers).map((h, i) => (
                                  <th key={i} style={{
                                    padding: '8px 12px', textAlign: 'left', fontWeight: 700,
                                    color: 'var(--gold)', borderBottom: '1px solid rgba(201,150,12,0.15)',
                                    whiteSpace: 'nowrap', background: 'rgba(201,150,12,0.04)',
                                  }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(editingTable?.msgId === msg.id ? editingTable.data.rows : msg.extractedTable.rows).map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '6px 12px', color: 'var(--text-2)' }}>
                                      {editingTable?.msgId === msg.id ? (
                                        <input
                                          value={cell}
                                          onChange={e => updateTableCell(ri, ci, e.target.value)}
                                          style={{
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '4px', padding: '3px 6px', color: 'var(--text-1)',
                                            fontSize: '0.72rem', width: '100%', outline: 'none', fontFamily: 'inherit',
                                          }}
                                        />
                                      ) : cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '8px' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>
                        {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '2px', display: 'flex' }}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: '10px', padding: '14px 20px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(201,150,12,0.2), rgba(139,92,246,0.2))',
                    border: '1px solid rgba(201,150,12,0.3)',
                  }}>
                    <Bot size={14} color="#F0B429" />
                  </div>
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                    borderRadius: '14px 14px 14px 4px', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <Loader2 size={14} color="#F0B429" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Analyzing project data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
          borderRadius: '14px', padding: '10px 14px', margin: '0 16px 12px',
          display: 'flex', alignItems: 'flex-end', gap: '10px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDoc ? `Ask about "${selectedDoc.document_name}"...` : `Ask about ${projectName || 'this project'}...`}
            rows={1}
            style={{
              flex: 1, resize: 'none', background: 'transparent', color: 'var(--text-1)',
              border: 'none', outline: 'none', fontSize: '0.85rem', lineHeight: 1.5,
              maxHeight: '120px', fontFamily: 'inherit',
            }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: '36px', height: '36px', borderRadius: '10px', border: 'none',
              cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              background: (!input.trim() || loading)
                ? 'rgba(255,255,255,0.04)'
                : 'linear-gradient(135deg, #C9960C, #B8860B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            <Send size={15} color={(!input.trim() || loading) ? 'var(--text-4)' : '#000'} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
