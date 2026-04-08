'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Building2, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      router.push('/client');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03080F', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Building2 size={24} color="#F0B429" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: '#EEF2FF' }}>
            Client Portal
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#4E647F', marginTop: '8px' }}>
            Sign in to manage your deal and documents
          </p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ 
                padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
                borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#F87171', fontSize: '0.8rem' 
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="field-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4E647F' }} />
                <input
                  type="email"
                  className="field"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4E647F' }} />
                <input
                  type="password"
                  className="field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/" style={{ fontSize: '0.8rem', color: '#4E647F', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#F0B429'} onMouseLeave={e => e.currentTarget.style.color = '#4E647F'}>
            ← Back to main login
          </Link>
        </div>
      </div>
    </div>
  );
}
