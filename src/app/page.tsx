'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { MOCK_USERS } from '@/lib/mock-data';
import { Eye, EyeOff, Building2, ChevronDown, ArrowRight, Lock, User, Briefcase } from 'lucide-react';

type LoginMode = 'team' | 'client';

// All team members for the name picker
const TEAM_MEMBERS = MOCK_USERS.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  designation: u.designation || '',
}));

// Type for fetched client SPOCs
interface ClientSpocEntry {
  id: string;
  name: string;
  email: string;
  designation: string;
  company_name: string;
  project_id: string;
}

function getRoleColor(role: string) {
  const map: Record<string, string> = {
    admin: '#F0B429',
    relation_partner: '#60A5FA',
    relation_manager: '#60A5FA',
    engagement_partner: '#A78BFA',
    engagement_manager: '#A78BFA',
    executive: '#94A3B8',
    accounts: '#22C55E',
    mis: '#22D3EE',
    engagement_assistant: '#FB923C',
  };
  return map[role] || '#94A3B8';
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    admin: '⚡ Admin',
    relation_partner: 'Relation Partner',
    relation_manager: 'Relation Manager',
    engagement_partner: 'Engagement Partner',
    engagement_manager: 'Engagement Manager',
    executive: 'Executive',
    accounts: 'Accounts',
    mis: 'MIS',
    engagement_assistant: 'Engagement Assistant',
  };
  return map[role] || role;
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
    'linear-gradient(135deg,#F59E0B,#EF4444)',
    'linear-gradient(135deg,#06B6D4,#3B82F6)',
  ];
  return grads[name.charCodeAt(0) % grads.length];
}

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('team');
  const [selectedMember, setSelectedMember] = useState<typeof TEAM_MEMBERS[0] | null>(null);
  const [selectedSpoc, setSelectedSpoc] = useState<ClientSpocEntry | null>(null);
  const [registeredSpocs, setRegisteredSpocs] = useState<ClientSpocEntry[]>([]);
  const [spocsLoading, setSpocsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user, ready } = useAuth();
  const router = useRouter();

  // Only redirect if localStorage has been read AND user is authenticated
  useEffect(() => {
    if (ready && isAuthenticated && user) {
      router.replace(user.role === 'client_spoc' ? '/client' : '/dashboard');
    }
  }, [ready, isAuthenticated, user, router]);

  // Fetch registered SPOCs when switching to client mode
  useEffect(() => {
    if (mode === 'client') {
      setSpocsLoading(true);
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
    }
  }, [mode]);

  const email =
    mode === 'team'
      ? (selectedMember?.email || '')
      : (selectedSpoc?.email || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError(mode === 'team' ? 'Please select a user first.' : 'Please select your name first.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    console.log(`🔐 Login attempt: ${email} in ${mode} mode`);

    // First, perform local auth immediately via context
    const result = await login(email, password);
    console.log(`🔐 Login result:`, result);

    if (result.success) {
      // Use hard navigation so the new page does a fresh load and
      // reads the user from localStorage cleanly (survives Fast Refresh in dev)
      window.location.href = mode === 'client' ? '/client' : '/dashboard';
      return;
    }

    // If local auth failed, show error
    console.log(`❌ Auth failed:`, result.error);
    setLoading(false);
    setError(result.error || 'Login failed. Please check your credentials.');
  }

  function selectTeamMember(m: typeof TEAM_MEMBERS[0]) {
    setSelectedMember(m);
    setShowDropdown(false);
    setPassword('');
    setError('');
  }

  function selectClientSpoc(s: ClientSpocEntry) {
    setSelectedSpoc(s);
    setShowDropdown(false);
    setPassword('');
    setError('');
  }

  const canSubmit = email && password;

  // Group SPOCs by company for the dropdown
  const spocsByCompany: Record<string, ClientSpocEntry[]> = {};
  registeredSpocs.forEach((s) => {
    if (!spocsByCompany[s.company_name]) spocsByCompany[s.company_name] = [];
    spocsByCompany[s.company_name].push(s);
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#03080F' }}>
      {/* ─── LEFT PANEL ─── */}
      <div style={{
        width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '3.5rem', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #03080F 0%, #060D18 60%, #0A1525 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Ambient glow spots */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,150,12,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', right: '0',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} color="#F0B429" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 700, color: '#EEF2FF' }}>
              Leverest
            </div>
            <div style={{ fontSize: '0.6rem', color: '#C9960C', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Fintech · Kolkata Branch
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: '#4E647F', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Deal Management Platform
          </div>
          <h1 style={{
            fontFamily: 'var(--font-playfair)', fontSize: '2.8rem',
            fontWeight: 800, lineHeight: 1.12, color: '#EEF2FF', marginBottom: '16px',
          }}>
            Bridging Ambition<br />
            <span style={{
              background: 'linear-gradient(135deg, #F0B429, #C9960C)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>With Capital.</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#8899B8', lineHeight: 1.7, maxWidth: '360px' }}>
            Enterprise-grade loan origination and deal management for financial intermediaries.
            Secure, role-based, and built for your workflow.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
            {[
              { value: '₹240 Cr+', label: 'Facilitated' },
              { value: '48', label: 'Active Deals' },
              { value: '14', label: 'Team Members' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F0B429' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: '#4E647F', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline visual */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.6rem', color: '#2D3F55', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            6-Stage Deal Lifecycle
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
            {[
              { h: 20, c: '#64748B', l: 'Lead' },
              { h: 30, c: '#3B82F6', l: 'Meeting' },
              { h: 44, c: '#8B5CF6', l: 'Docs' },
              { h: 38, c: '#F59E0B', l: 'Process' },
              { h: 28, c: '#06B6D4', l: 'Proposal' },
              { h: 22, c: '#22C55E', l: 'Approved' },
            ].map((s) => (
              <div key={s.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '28px', height: `${s.h}px`,
                  background: s.c, borderRadius: '4px', opacity: 0.7,
                }} />
                <div style={{ fontSize: '0.52rem', color: '#2D3F55', whiteSpace: 'nowrap' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL — LOGIN FORM ─── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', overflow: 'hidden',
        background: '#060D18',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-60%)',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,150,12,0.04) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }} className="fade-up">
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: '#EEF2FF' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#4E647F', marginTop: '4px' }}>
              {mode === 'team'
                ? 'Select your name and enter your password to sign in'
                : registeredSpocs.length > 0
                  ? 'Select your name and enter your password to sign in'
                  : 'No client accounts registered yet — ask your Leverest representative for an invite link'}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: '0',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '3px',
            marginBottom: '24px',
          }}>
            {[
              { key: 'team', label: '🏢 Leverest Team' },
              { key: 'client', label: '🤝 Client SPOC' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setMode(opt.key as LoginMode);
                  setSelectedMember(null);
                  setSelectedSpoc(null);
                  setPassword('');
                  setError('');
                  setShowDropdown(false);
                }}
                style={{
                  flex: 1, padding: '7px 12px',
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  background: mode === opt.key ? 'rgba(201,150,12,0.15)' : 'transparent',
                  color: mode === opt.key ? '#F0B429' : '#4E647F',
                  ...(mode === opt.key ? { boxShadow: 'inset 0 0 0 1px rgba(201,150,12,0.3)' } : {}),
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ─── TEAM MODE: Name Picker ─── */}
            {mode === 'team' && (
              <div>
                <label className="field-label">Select Your Name</label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showDropdown ? 'rgba(201,150,12,0.4)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '7px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontFamily: 'inherit',
                      boxShadow: showDropdown ? '0 0 0 2px rgba(201,150,12,0.1)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {selectedMember ? (
                      <>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: getAvatarGradient(selectedMember.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {getInitials(selectedMember.name)}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF' }}>{selectedMember.name}</div>
                          <div style={{ fontSize: '0.66rem', color: getRoleColor(selectedMember.role) }}>{getRoleLabel(selectedMember.role)}</div>
                        </div>
                      </>
                    ) : (
                      <div style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={15} color="#2D3F55" />
                        <span style={{ fontSize: '0.82rem', color: '#2D3F55' }}>
                          Choose your name…
                        </span>
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
                      maxHeight: '280px', overflowY: 'auto',
                    }}>
                      {TEAM_MEMBERS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectTeamMember(m)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', border: 'none', cursor: 'pointer',
                            background: selectedMember?.id === m.id ? 'rgba(201,150,12,0.1)' : 'transparent',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            transition: 'background 0.1s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={(e) => { if (selectedMember?.id !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={(e) => { if (selectedMember?.id !== m.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: getAvatarGradient(m.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {getInitials(m.name)}
                          </div>
                          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: getRoleColor(m.role) }}>
                              {getRoleLabel(m.role)}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '0.6rem', color: '#2D3F55', whiteSpace: 'nowrap',
                          }}>
                            {m.email}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-filled email display for team */}
                {email && (
                  <div style={{
                    marginTop: '6px', padding: '6px 12px',
                    background: 'rgba(201,150,12,0.05)',
                    border: '1px solid rgba(201,150,12,0.15)',
                    borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ fontSize: '0.65rem', color: '#4E647F' }}>Email:</span>
                    <span style={{ fontSize: '0.72rem', color: '#F0B429', fontFamily: 'monospace', flex: 1 }}>{email}</span>
                    <Lock size={11} color="#4E647F" />
                    <span style={{ fontSize: '0.6rem', color: '#2D3F55' }}>auto-filled</span>
                  </div>
                )}
              </div>
            )}

            {/* ─── CLIENT MODE: Registered SPOC Picker ─── */}
            {mode === 'client' && (
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
                    padding: '16px', textAlign: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.10)',
                    borderRadius: '8px',
                  }}>
                    <Briefcase size={24} color="#2D3F55" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.82rem', color: '#4E647F', marginBottom: '4px' }}>
                      No client accounts yet
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#2D3F55', lineHeight: 1.5 }}>
                      Client SPOCs can only be registered after a project is created by the Leverest team. 
                      An invite link will be shared with you to create your account.
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
                          <span style={{ fontSize: '0.82rem', color: '#2D3F55' }}>
                            Choose your name…
                          </span>
                        </div>
                      )}
                      <ChevronDown size={15} color="#4E647F" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                    </button>

                    {/* Dropdown — grouped by company */}
                    {showDropdown && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                        background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: '8px', overflow: 'hidden', zIndex: 50,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                        maxHeight: '300px', overflowY: 'auto',
                      }}>
                        {Object.entries(spocsByCompany).map(([company, spocs]) => (
                          <div key={company}>
                            {/* Company group header */}
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
                                onClick={() => selectClientSpoc(s)}
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
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {s.name}
                                  </div>
                                  <div style={{ fontSize: '0.66rem', color: '#FB923C' }}>
                                    {s.designation || 'Client SPOC'}
                                  </div>
                                </div>
                                <div style={{
                                  fontSize: '0.6rem', color: '#2D3F55', whiteSpace: 'nowrap',
                                }}>
                                  {s.email}
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Auto-filled email display for selected SPOC */}
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
            )}

            {/* Password — only show if a person is selected (or both modes have someone) */}
            {((mode === 'team') || (mode === 'client' && registeredSpocs.length > 0)) && (
              <div>
                <label className="field-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field"
                    style={{ paddingRight: '40px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none',
                      cursor: 'pointer', color: '#4E647F',
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Demo hint */}
                {mode === 'team' && email && (
                  <div style={{ marginTop: '5px', fontSize: '0.65rem', color: '#2D3F55' }}>
                    Demo password: <span style={{ color: '#F0B429', fontFamily: 'monospace' }}>
                      {email === 'pawan.lohia@leverestfin.com' ? 'admin' : 'password'}
                    </span>
                  </div>
                )}
                {mode === 'client' && selectedSpoc && (
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
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '9px 12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '7px', fontSize: '0.78rem', color: '#F87171',
              }}>
                {error}
              </div>
            )}

            {/* Submit — only show if there are people to select from */}
            {((mode === 'team') || (mode === 'client' && registeredSpocs.length > 0)) && (
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              >
                {loading ? (
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                ) : <ArrowRight size={16} />}
                {loading ? 'Signing in…' : 'Sign In to Platform'}
              </button>
            )}
          </form>

          {/* Role access legend */}
          <div style={{
            marginTop: '28px', padding: '14px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.62rem', color: '#2D3F55', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Role Access Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { role: 'Admin', color: '#F0B429', access: 'Full access · All projects · All data · Settings' },
                { role: 'Relation / Engagement Partner', color: '#60A5FA', access: 'Assigned projects · Commission · Queries' },
                { role: 'Manager / Executive', color: '#A78BFA', access: 'Assigned projects · Docs · Limited commission' },
                { role: 'Accounts / MIS', color: '#22C55E', access: 'All projects (view) · Commission tracker' },
                { role: 'Client SPOC', color: '#FB923C', access: 'Own project only · Upload docs · Queries · Timeline' },
              ].map((r) => (
                <div key={r.role} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '5px', minWidth: '5px', height: '5px', borderRadius: '50%', background: r.color, marginTop: '5px' }} />
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: r.color }}>{r.role}</span>
                    <span style={{ fontSize: '0.65rem', color: '#4E647F' }}> — {r.access}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.65rem', color: '#2D3F55', marginTop: '20px' }}>
            © 2026 Leverest Fintech Pvt. Ltd. · Kolkata Branch
          </p>
        </div>
      </div>
    </div>
  );
}
