'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_SPOCS, MOCK_DOCUMENTS } from '@/lib/mock-data';
import { Upload, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const spoc = MOCK_SPOCS.find(s => s.email === user?.email);
  const docs = MOCK_DOCUMENTS.filter(d => d.project_id === spoc?.project_id);
  const categories = [...new Set(docs.map(d => d.category))];

  const received = docs.filter(d => d.status === 'received').length;
  const pct = docs.length ? Math.round((received / docs.length) * 100) : 0;

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '900px' }} className="fade-up">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>My Documents</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          {received} of {docs.length} documents received · {pct}% complete
        </div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)' }}>Overall Completion</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F0B429' }}>{pct}%</span>
        </div>
        <div className="progress-track lg"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
          {[
            { label: 'Received', count: docs.filter(d => d.status === 'received').length, color: '#4ADE80' },
            { label: 'Pending', count: docs.filter(d => d.status === 'pending').length, color: '#FCD34D' },
            { label: 'Missing', count: docs.filter(d => d.status === 'required').length, color: '#F87171' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{s.count} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category tables */}
      {categories.map(cat => {
        const catDocs = docs.filter(d => d.category === cat);
        const catReceived = catDocs.filter(d => d.status === 'received').length;
        const catPct = catDocs.length ? Math.round((catReceived / catDocs.length) * 100) : 0;
        return (
          <div key={cat} className="card" style={{ marginBottom: '14px' }}>
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="#F0B429" />
                  <div className="card-header-title">{cat}</div>
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-3)', marginTop: '2px' }}>
                  {catReceived}/{catDocs.length} received
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div className="progress-track" style={{ width: '60px' }}>
                    <div className="progress-fill" style={{ width: `${catPct}%` }} />
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-3)', textAlign: 'right', marginTop: '2px' }}>{catPct}%</div>
                </div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>File</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {catDocs.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: doc.status === 'received' ? '#4ADE80' : doc.status === 'pending' ? '#FCD34D' : '#F87171', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-1)' }}>{doc.name}</span>
                          {doc.is_required && <span style={{ fontSize: '0.58rem', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '3px', padding: '1px 4px' }}>Required</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${doc.status === 'received' ? 'pill-green' : doc.status === 'pending' ? 'pill-gold' : 'pill-red'}`}>
                          {doc.status === 'received' ? '✓ Received' : doc.status === 'pending' ? 'Pending Review' : 'Upload Required'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                        {doc.file_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {doc.file_name}
                            {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}><ExternalLink size={11} /></a>}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {doc.status !== 'received' && (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: '5px', padding: '4px 10px', background: 'var(--gold-dim)' }}>
                            <Upload size={11} /> Upload
                            <input type="file" style={{ display: 'none' }} />
                          </label>
                        )}
                        {doc.status === 'received' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4ADE80', fontSize: '0.72rem' }}>
                            <CheckCircle2 size={12} /> Submitted
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
