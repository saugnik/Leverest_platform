'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Send, Loader2 } from 'lucide-react';
import { getDynamicSpocs } from '@/lib/dynamic';

function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ClientMessagesPage() {
  const { user } = useAuth();
  const spoc = getDynamicSpocs().find(s => s.email === user?.email);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      project_id: spoc?.project_id || '',
      content: text,
      sender_id: user?.id || '',
      sender_name: user?.name || 'You',
      sender_type: 'client',
      created_at: new Date().toISOString(),
      read_by: [],
    };
    
    setMessages(prev => [...prev, newMessage]);
    setText('');
    setSending(true);
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          // Update with server response if needed
          setMessages(prev => prev.map(m => m.id === newMessage.id ? data.message : m));
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '800px' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Messages</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          Direct line to your Leverest relationship managers
        </div>
      </div>

      {/* Chat window */}
      <div className="card">
        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>Leverest Team</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Kolkata Branch</span>
        </div>

        {/* Messages */}
        <div style={{
          padding: '16px 18px', minHeight: '360px', maxHeight: '480px',
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {messages.map((msg: any) => {
            const isClient = msg.sender_type === 'client';
            return (
              <div key={msg.id} style={{ display: 'flex', gap: '10px', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                {!isClient && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getGrad(msg.sender_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {getInitials(msg.sender_name)}
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-2)' }}>{msg.sender_name}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-4)' }}>{timeAgo(msg.created_at)}</span>
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: isClient ? 'rgba(201,150,12,0.12)' : 'var(--bg-card-2)',
                    border: `1px solid ${isClient ? 'rgba(201,150,12,0.2)' : 'var(--bg-border)'}`,
                    fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: 1.6,
                    borderTopRightRadius: isClient ? '2px' : '10px',
                    borderTopLeftRadius: isClient ? '10px' : '2px',
                  }}>
                    {msg.content}
                  </div>
                </div>
                {isClient && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getGrad(msg.sender_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {getInitials(msg.sender_name)}
                  </div>
                )}
              </div>
            );
          })}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-4)', padding: '3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No messages yet. Start the conversation below.
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--bg-border)',
          display: 'flex', gap: '10px', alignItems: 'flex-end',
        }}>
          <textarea
            placeholder="Type your message to Leverest team… (Shift+Enter for new line)"
            value={text}
            onChange={e => setText(e.target.value)}
            className="field"
            style={{ flex: 1, minHeight: '52px', maxHeight: '120px', resize: 'none' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button
            className="btn btn-primary"
            onClick={send}
            disabled={!text.trim() || sending}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-end' }}
          >
            {sending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={14} />
            )}
            Send
          </button>
        </div>
      </div>

      {/* Notice */}
      <div style={{
        marginTop: '12px', padding: '10px 14px',
        background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '7px',
        fontSize: '0.72rem', color: 'var(--text-3)',
      }}>
        💬 Messages are end-to-end logged. Your Leverest team typically responds within 1 business hour.
      </div>
    </div>
  );
}
