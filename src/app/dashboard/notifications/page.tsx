'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Bell, FileText, MessageSquare, Banknote, Clock, CheckCircle2, Loader2 } from 'lucide-react';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getTypeIcon(type: string) {
  const m: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    document: { icon: FileText,      color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
    query:    { icon: MessageSquare, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    bank:     { icon: Banknote,      color: '#F0B429', bg: 'rgba(201,150,12,0.1)' },
    deadline: { icon: Clock,         color: '#F87171', bg: 'rgba(239,68,68,0.1)' },
    system:   { icon: Bell,          color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  };
  return m[type] || m.system;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifs(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  async function markAll() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  async function markOne(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading notifications...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Notifications</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
            {unread > 0 ? <><span style={{ color: '#F0B429', fontWeight: 700 }}>{unread} unread</span> · </> : ''}{notifs.length} total
          </div>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> Mark all as read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Bell size={32} color="var(--text-4)" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>No notifications yet.</div>
          <div style={{ color: 'var(--text-4)', fontSize: '0.75rem', marginTop: '4px' }}>You'll receive notifications when important events occur.</div>
        </div>
      ) : (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}></th>
                  <th>Notification</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {notifs.map(n => {
                  const { icon: Icon, color, bg } = getTypeIcon(n.type);
                  return (
                    <tr key={n.id} style={{ opacity: n.is_read ? 0.6 : 1 }}>
                      <td>
                        {!n.is_read && (
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F0B429', margin: '0 auto' }} />
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} color={color} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 400 : 600, color: 'var(--text-1)' }}>{n.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>{n.message}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="pill pill-slate" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{n.type || 'system'}</span></td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</td>
                      <td>
                        {!n.is_read && (
                          <button className="btn btn-ghost btn-sm" onClick={() => markOne(n.id)} style={{ whiteSpace: 'nowrap', fontSize: '0.68rem' }}>
                            Mark read
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
