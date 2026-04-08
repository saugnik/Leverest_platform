'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { readInvite, consumeInvite, addDynamicSpoc, getProjectByIdMerged } from '@/lib/dynamic';

export default function ClientInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const invite = useMemo(() => readInvite(token), [token]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const project = invite ? getProjectByIdMerged(invite.project_id) : undefined;

  function submit() {
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('All required fields must be filled.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const newSpocId = `spoc-${Date.now()}`;
    addDynamicSpoc({
      id: newSpocId,
      project_id: invite!.project_id,
      name,
      email,
      phone,
      designation,
      password_hash: password,
      is_active: true,
      created_at: new Date().toISOString(),
    });
    consumeInvite(token);
    setDone(true);
  }

  if (!invite || !project) {
    return (
      <div style={{ padding: '3rem', maxWidth: '520px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
            Invalid Invite
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-3)', marginTop: '6px' }}>
            This invite link is invalid or has expired. Contact your Leverest representative.
          </div>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '14px', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ padding: '3rem', maxWidth: '520px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
            You&apos;re all set
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-3)', marginTop: '6px' }}>
            Your access has been configured. Use your email and the password you just set to sign in.
          </div>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '14px', textDecoration: 'none' }}>
            Go to Login &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', maxWidth: '640px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>
          Join Project
        </div>
        <div style={{ fontSize: '0.86rem', color: 'var(--text-3)', marginTop: '6px' }}>
          {project.company_name}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <div>
            <label className="field-label">Full Name *</label>
            <input className="field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Email *</label>
            <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="field" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Designation</label>
            <input className="field" value={designation} onChange={e => setDesignation(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Password *</label>
            <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Confirm Password *</label>
            <input className="field" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        {error && (
          <div style={{
            marginTop: '12px', padding: '9px 12px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '7px', fontSize: '0.78rem', color: '#F87171',
          }}>
            {error}
          </div>
        )}
        <button onClick={submit} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Set Up Account
        </button>
      </div>
    </div>
  );
}
