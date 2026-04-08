'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, FileText, MessageSquare, Banknote, Clock, MessageCircle, Bell, LogOut } from 'lucide-react';

const TABS = [
  { href: '/client',          label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/client/documents',label: 'My Documents', icon: FileText },
  { href: '/client/queries',  label: 'Bank Queries', icon: MessageSquare },
  { href: '/client/banks',    label: 'Choose Bank',  icon: Banknote },
  { href: '/client/timeline', label: 'Deal Timeline',icon: Clock },
  { href: '/client/messages', label: 'Messages',     icon: MessageCircle },
];

function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)','linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name.charCodeAt(0) % g.length];
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/'); return; }
    if (user?.role !== 'client_spoc') { router.push('/dashboard'); return; }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'client_spoc') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03080F' }}>
        <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#C9960C" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  function isActive(href: string) {
    if (href === '/client') return pathname === '/client';
    return pathname.startsWith(href);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#03080F', display: 'flex', flexDirection: 'column' }}>
      {/* Top navigation */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--bg-border)',
        position: 'sticky', top: 0, zIndex: 20,
        flexShrink: 0,
      }}>
        {/* Brand row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', height: '52px',
          borderBottom: '1px solid var(--bg-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={14} color="#F0B429" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)' }}>Leverest</div>
            </div>
            <div style={{ height: '16px', width: '1px', background: 'var(--bg-border)', margin: '0 4px' }} />
            <div style={{ fontSize: '0.66rem', color: '#F0B429', letterSpacing: '0.1em', textTransform: 'uppercase' }}>CLIENT PORTAL</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', position: 'relative', padding: '4px' }}>
              <Bell size={16} />
              <div style={{ position: 'absolute', top: '0', right: '0', width: '7px', height: '7px', borderRadius: '50%', background: '#F0B429' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getGrad(user.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#fff' }}>
                {getInitials(user.name)}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-1)' }}>{user.name}</div>
                <div style={{ fontSize: '0.62rem', color: '#FB923C' }}>Client SPOC</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              style={{ background: 'none', border: '1px solid var(--bg-border)', cursor: 'pointer', color: 'var(--text-3)', padding: '5px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem' }}
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', padding: '0 2rem', overflowX: 'auto' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '11px 16px',
                  fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                  color: active ? '#F0B429' : 'var(--text-2)',
                  textDecoration: 'none',
                  borderBottom: `2px solid ${active ? '#C9960C' : 'transparent'}`,
                  marginBottom: '-1px', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
