'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeft, Send, Bot, User, Sparkles, Loader2, Trash2,
  Copy, Check, FileText, MessageSquare, Activity, AlertCircle,
  Brain, Lightbulb, HelpCircle, BarChart3,
} from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  { icon: FileText, text: 'What documents are still missing?', color: '#F87171' },
  { icon: BarChart3, text: 'Summarize this project\'s current status', color: '#60A5FA' },
  { icon: AlertCircle, text: 'What are the key risks or bottlenecks?', color: '#FCD34D' },
  { icon: Lightbulb, text: 'What should be the next steps?', color: '#4ADE80' },
  { icon: Activity, text: 'Show me the recent activity timeline', color: '#A78BFA' },
  { icon: HelpCircle, text: 'Are there any open queries to resolve?', color: '#FB923C' },
];

function formatAIResponse(text: string): string {
  // Convert markdown-style formatting to HTML
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet points
    .replace(/^- (.*)/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*)/gm, '<li>$1</li>')
    // Headers
    .replace(/^### (.*)/gm, '<h4 style="color:var(--gold);margin:12px 0 6px;font-size:0.85rem;font-weight:700;">$1</h4>')
    .replace(/^## (.*)/gm, '<h3 style="color:var(--gold);margin:14px 0 8px;font-size:0.92rem;font-weight:700;">$1</h3>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, (match) => {
    const cleaned = match.replace(/<br\/>/g, '');
    return `<ul style="margin:6px 0;padding-left:18px;list-style:disc;">${cleaned}</ul>`;
  });

  return html;
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

  // Load project name
  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.project) {
          setProjectName(data.project.client_name || data.project.company_name || data.project.name || 'Project');
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

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          messages: chatHistory,
          message: msg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI service error');
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
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

  return (
    <div style={{ padding: '1.5rem 2rem', height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/dashboard/projects/${id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-3)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <ArrowLeft size={13} />
          </Link>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(201,150,12,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(201,150,12,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={18} color="#F0B429" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AI Assistant
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, background: 'linear-gradient(135deg, #C9960C, #8B5CF6)',
                padding: '2px 8px', borderRadius: '99px', color: '#000', letterSpacing: '0.05em',
              }}>
                BETA
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{projectName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                color: '#F87171', fontSize: '0.72rem', fontWeight: 600,
              }}
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column',
        gap: '4px', paddingBottom: '10px', minHeight: 0,
      }}>
        {messages.length === 0 ? (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
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
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '6px' }}>
                How can I help with {projectName || 'this project'}?
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', maxWidth: '420px' }}>
                I have access to all project data — documents, queries, notes, and activity. Ask me anything.
              </div>
            </div>

            {/* Suggested prompts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxWidth: '600px', width: '100%' }}>
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
                      width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                      background: `${prompt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={prompt.color} />
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-2)', lineHeight: 1.3 }}>{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Messages */
          <>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex', gap: '10px', padding: '14px 16px',
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
                  maxWidth: '75%', minWidth: '120px',
                  background: msg.role === 'user' ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--bg-border)'}`,
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '12px 16px',
                  position: 'relative',
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
              <div style={{ display: 'flex', gap: '10px', padding: '14px 16px' }}>
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
        borderRadius: '14px', padding: '10px 14px',
        display: 'flex', alignItems: 'flex-end', gap: '10px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${projectName || 'this project'}...`}
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
