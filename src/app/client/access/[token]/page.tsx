'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const AUTH_STORAGE_KEY = 'leverest_auth_user';

export default function ClientAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [error, setError] = useState('');

  useEffect(() => {
    async function exchange() {
      try {
        const isMock =
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy');
        if (isMock) {
          const { readAccessToken, getDynamicSpocById } = await import('@/lib/dynamic');
          const access = readAccessToken(token);
          if (!access) {
            setError('Invalid or expired access link.');
            return;
          }
          const spoc = getDynamicSpocById(access.spoc_id);
          if (!spoc) {
            setError('Invalid or expired access link.');
            return;
          }
          const spocUser = {
            id: spoc.id,
            email: spoc.email,
            name: spoc.name,
            role: 'client_spoc',
            branch: 'kolkata',
            is_active: true,
            created_at: spoc.created_at || new Date().toISOString(),
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(spocUser));
          const spocSession = {
            id: spoc.id,
            email: spoc.email,
            name: spoc.name,
            project_id: spoc.project_id,
            designation: spoc.designation,
          };
          const b64 = btoa(JSON.stringify(spocSession));
          document.cookie = `lv_spoc_session=${b64}; path=/; max-age=28800`;
          document.cookie = `sb-auth-token=mock-token-xyz; path=/; max-age=28800`;
          window.location.href = '/client';
          return;
        }
        const res = await fetch('/api/auth/spoc-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data?.spoc) {
          setError(data?.error || 'Invalid or expired access link.');
          return;
        }
        const spoc = data.spoc as { id: string; email: string; name: string; created_at?: string };
        const spocUser = {
          id: spoc.id,
          email: spoc.email,
          name: spoc.name,
          role: 'client_spoc',
          branch: 'kolkata',
          is_active: true,
          created_at: spoc.created_at || new Date().toISOString(),
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(spocUser));
        window.location.href = '/client';
      } catch (err) {
        console.error(err);
        setError('Invalid or expired access link.');
      }
    }
    exchange();
  }, [token]);

  if (error) {
    return (
      <div style={{ padding: '3rem', maxWidth: '520px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
            Access Link Invalid
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-3)', marginTop: '6px' }}>
            {error}
          </div>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '14px', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '3rem', 
      textAlign: 'center', 
      color: 'var(--text-3)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px'
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'rgba(201,150,12,0.1)',
        border: '1px solid rgba(201,150,12,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Loader2 size={32} color="#F0B429" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>
        Signing you in...
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
        Verifying your access link
      </div>
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
