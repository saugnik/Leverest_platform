'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Sidebar from '@/components/layout/sidebar';
import { Bell, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/');
    else if (user?.role === 'client_spoc') router.push('/client');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role === 'client_spoc') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03080F' }}>
        <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#C9960C" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#03080F' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: '52px', flexShrink: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem', gap: '12px',
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {['admin', 'manager'].includes(user?.role || '') && (
              <Link
                href="/dashboard/projects/new"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '7px',
                  background: 'linear-gradient(135deg,#C9960C,#F0B429)',
                  color: '#05100C', fontSize: '0.76rem', fontWeight: 700,
                  textDecoration: 'none', border: 'none',
                  boxShadow: '0 2px 12px rgba(201,150,12,0.3)',
                }}
              >
                <Plus size={13} /> New Project
              </Link>
            )}
            <Link
              href="/dashboard/notifications"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: '7px',
                background: 'var(--bg-hover)', border: '1px solid var(--bg-border)',
                color: 'var(--text-2)', position: 'relative', textDecoration: 'none',
              }}
            >
              <Bell size={15} />
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#03080F' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
