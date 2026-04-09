'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Building2, Lock, ArrowRight, AlertCircle, User, ChevronDown, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface ClientSpocEntry {
  id: string;
  name: string;
  email: string;
  designation: string;
  company_name: string;
  project_id: string;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarGradient(name: string) {
  const grads = [
    'linear-gradient(135deg,#C9960C,#8B5CF6)',
    'linear-gradient(135deg,#3B82F6,#06B6D4)',
    'linear-gradient(135deg,#22C55E,#059669)',
    'linear-gradient(135deg,#F97316,#EF4444)',
    'linear-gradient(135deg,#8B5CF6,#EC4899)',
  ];
  return grads[name.charCodeAt(0) % grads.length];
}

export default function ClientLoginPage() {
  const [selectedSpoc, setSelectedSpoc] = useState<ClientSpocEntry | null>(null);
  const [registeredSpocs, setRegisteredSpocs] = useState<ClientSpocEntry[]>([]);
  const [spocsLoading, setSpocsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/spocs')
      .then((r) => r.json())
      .then((data) => {
        setRegisteredSpocs(data.spocs || []);
        setSpocsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load SPOCs:', err);
        setRegisteredSpocs([]);
        setSpocsLoading(false);
      });
  }, []);

  const email = selectedSpoc?.email || '';

  // Group SPOCs by company
  const spocsByCompany: Record<string, ClientSpocEntry[]> = {};
  registeredSpocs.forEach((s) => {
    if (!spocsByCompany[s.company_name]) spocsByCompany[s.company_name] = [];
    spocsByCompany[s.company_name].push(s);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Please select your name first.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      router.push('/client');
    } else {
      setLoading(false);
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03080F', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="fade-up">
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
              <label className="field-label">Select Your Name</label>

              {spocsLoading ? (
                <div style={{
                  padding: '14px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '7px', color: '#4E647F', fontSize: '0.82rem',
                }}>
                  Loading registered clients…
                </div>
              ) : registeredSpocs.length === 0 ? (
                <div style={{
                  padding: '20px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                }}>
                  <Briefcase size={28} color="#2D3F55" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '0.85rem', color: '#4E647F', marginBottom: '6px', fontWeight: 600 }}>
                    No client accounts registered
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#2D3F55', lineHeight: 1.6 }}>
                    Your Leverest representative will create a project and share an invite link with you. 
                    Use that link to register your account first.
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showDropdown ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '7px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontFamily: 'inherit',
                      boxShadow: showDropdown ? '0 0 0 2px rgba(251,146,60,0.1)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {selectedSpoc ? (
                      <>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: getAvatarGradient(selectedSpoc.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {getInitials(selectedSpoc.name)}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF' }}>{selectedSpoc.name}</div>
                          <div style={{ fontSize: '0.66rem', color: '#FB923C' }}>{selectedSpoc.company_name}</div>
                        </div>
                      </>
                    ) : (
                      <div style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={15} color="#2D3F55" />
                        <span style={{ fontSize: '0.82rem', color: '#2D3F55' }}>Choose your name…</span>
                      </div>
                    )}
                    <ChevronDown size={15} color="#4E647F" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                  </button>

                  {showDropdown && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                      background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: '8px', overflow: 'hidden', zIndex: 50,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                      maxHeight: '260px', overflowY: 'auto',
                    }}>
                      {Object.entries(spocsByCompany).map(([company, spocs]) => (
                        <div key={company}>
                          <div style={{
                            padding: '8px 14px 4px',
                            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: '#FB923C',
                            background: 'rgba(251,146,60,0.05)',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}>
                            <Briefcase size={10} />
                            {company}
                          </div>
                          {spocs.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setSelectedSpoc(s); setShowDropdown(false); setPassword(''); setError(''); }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 14px', border: 'none', cursor: 'pointer',
                                background: selectedSpoc?.id === s.id ? 'rgba(251,146,60,0.1)' : 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                transition: 'background 0.1s', fontFamily: 'inherit',
                              }}
                              onMouseEnter={(e) => { if (selectedSpoc?.id !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                              onMouseLeave={(e) => { if (selectedSpoc?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: getAvatarGradient(s.name),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                              }}>
                                {getInitials(s.name)}
                              </div>
                              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF' }}>{s.name}</div>
                                <div style={{ fontSize: '0.66rem', color: '#FB923C' }}>{s.designation || 'Client SPOC'}</div>
                              </div>
                              <div style={{ fontSize: '0.6rem', color: '#2D3F55', whiteSpace: 'nowrap' }}>{s.email}</div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Auto-filled email */}
              {selectedSpoc && (
                <div style={{
                  marginTop: '6px', padding: '6px 12px',
                  background: 'rgba(251,146,60,0.05)',
                  border: '1px solid rgba(251,146,60,0.15)',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '0.65rem', color: '#4E647F' }}>Email:</span>
                  <span style={{ fontSize: '0.72rem', color: '#FB923C', fontFamily: 'monospace', flex: 1 }}>{selectedSpoc.email}</span>
                  <Lock size={11} color="#4E647F" />
                  <span style={{ fontSize: '0.6rem', color: '#2D3F55' }}>auto-filled</span>
                </div>
              )}
            </div>

            {registeredSpocs.length > 0 && (
              <>
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
                  {selectedSpoc && (
                    <div style={{ marginTop: '5px', fontSize: '0.65rem', color: '#2D3F55' }}>
                      Use the password you set during registration
                    </div>
                  )}
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <Link 
                      href="/forgot-password" 
                      style={{ fontSize: '0.75rem', color: '#F0B429', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !email || !password}
                  style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
                >
                  {loading ? 'Signing in...' : (
                    <>
                      Sign In <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </>
            )}
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
