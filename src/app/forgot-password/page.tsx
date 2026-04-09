'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOtp, savePasswordOverride } from '@/lib/dynamic';
import { MOCK_USERS } from '@/lib/mock-data';
import { getDynamicSpocs } from '@/lib/dynamic';
import { Mail, Lock, KeyRound, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    
    setLoading(true);
    setError('');
    
    // Check if user exists
    const isTeam = email.endsWith('@leverestfin.com') && MOCK_USERS.some(u => u.email === email);
    const isClient = getDynamicSpocs().some(s => s.email === email);
    
    if (!isTeam && !isClient) {
      setLoading(false);
      setError('No account found with this email address.');
      return;
    }

    try {
      // Send OTP via email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      setLoading(false);
      setStep('otp');
    } catch (err) {
      setLoading(false);
      setError('Failed to send OTP email. Please try again.');
      console.error('OTP send error:', err);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp) { setError('Please enter the OTP.'); return; }
    
    setLoading(true);
    setError('');
    
    const isValid = verifyOtp(email, otp);
    
    setTimeout(() => {
      setLoading(false);
      if (isValid) {
        setStep('password');
      } else {
        setError('Invalid or expired OTP. Please try again.');
      }
    }, 800);
  }

  async function handleResendOtp() {
    setResendLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      setResendLoading(false);
      setError('');
      setOtp('');
    } catch (err) {
      setResendLoading(false);
      setError('Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', err);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setError('All fields are required.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    
    setLoading(true);
    setError('');
    
    savePasswordOverride(email, newPassword);
    
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1000);
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
            {step === 'success' ? <ShieldCheck size={24} color="#22C55E" /> : <KeyRound size={24} color="#F0B429" />}
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: '#EEF2FF' }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'password' && 'New Password'}
            {step === 'success' && 'Password Reset'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#4E647F', marginTop: '8px' }}>
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'otp' && `We've sent a 6-digit code to ${email}`}
            {step === 'password' && 'Create a secure password for your account'}
            {step === 'success' && 'Your password has been updated successfully'}
          </p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {error && (
            <div style={{ 
              marginBottom: '20px', padding: '12px', background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', 
              display: 'flex', alignItems: 'center', gap: '10px', color: '#F87171', fontSize: '0.8rem' 
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '44px', width: '100%', justifyContent: 'center' }}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="field-label">Verification Code</label>
                <input
                  type="text"
                  className="field"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 700 }}
                  autoFocus
                />
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    style={{ background: 'none', border: 'none', color: '#F0B429', fontSize: '0.75rem', cursor: resendLoading ? 'not-allowed' : 'pointer', opacity: resendLoading ? 0.6 : 1 }}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '44px', width: '100%', justifyContent: 'center' }}>
                {loading ? 'Checking...' : 'Verify Code'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="field-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4E647F' }} />
                  <input
                    type="password"
                    className="field"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4E647F' }} />
                  <input
                    type="password"
                    className="field"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '44px', width: '100%', justifyContent: 'center' }}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#22C55E', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={48} />
                <span style={{ fontWeight: 600 }}>Password updated!</span>
              </div>
              <Link href="/" className="btn btn-primary" style={{ height: '44px', width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href="/" style={{ fontSize: '0.8rem', color: '#4E647F', textDecoration: 'none' }}>
              ← Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
