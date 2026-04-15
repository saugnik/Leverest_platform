'use client';

import { useAuth } from '@/context/auth-context';
import { Upload, ExternalLink, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { getDynamicSpocs } from '@/lib/dynamic';
import { useState, useEffect, useRef } from 'react';

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const spoc = getDynamicSpocs().find(s => s.email === user?.email);

  useEffect(() => {
    async function loadDocuments() {
      if (!spoc?.project_id) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/documents?project_id=${spoc.project_id}`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data.documents || []);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (spoc) {
      loadDocuments();
    } else {
      setLoading(false);
    }
  }, [spoc]);

  async function handleUpload(docId: string) {
    const input = fileInputRefs.current[docId];
    if (!input || !input.files || !input.files.length || !spoc?.project_id) return;
    
    const file = input.files[0];
    setUploading(docId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // In a real implementation, you would upload to storage first
      // For now, we'll simulate an upload and mark as received
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          project_id: spoc.project_id,
          file_url: URL.createObjectURL(file),
          file_source: 'manual',
        }),
      });
      
      if (res.ok) {
        // Update local state
        setDocs(prev => prev.map(d => 
          d.id === docId 
            ? { ...d, status: 'received', file_url: URL.createObjectURL(file), file_name: file.name }
            : d
        ));
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setUploading(null);
      if (input) input.value = '';
    }
  }

  const categories = [...new Set(docs.map((d: any) => d.category))];
  const received = docs.filter((d: any) => d.status === 'received').length;
  const pct = docs.length ? Math.round((received / docs.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading documents...
      </div>
    );
  }

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
      </div>

      {docs.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '0.88rem', marginBottom: '4px' }}>No documents assigned yet.</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Your Leverest team will set up your checklist.</div>
        </div>
      )}

      {/* Category tables */}
      {categories.map((cat: any) => {
        const catDocs = docs.filter((d: any) => d.category === cat);
        const catReceived = catDocs.filter((d: any) => d.status === 'received').length;
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
                  {catDocs.map((doc: any) => (
                    <tr key={doc.id}>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-1)' }}>{doc.document_name}</span>
                      </td>
                      <td>
                        <span className={`pill ${doc.status === 'received' ? 'pill-green' : doc.status === 'pending' ? 'pill-gold' : 'pill-red'}`}>
                          {doc.status === 'received' ? '✓ Received' : doc.status === 'pending' ? 'Pending Review' : 'Upload Required'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                        {doc.file_name || '—'}
                      </td>
                      <td>
                        {doc.status !== 'received' && (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: '5px', padding: '4px 10px', background: 'var(--gold-dim)' }}>
                            {uploading === doc.id ? (
                              <>
                                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload size={11} /> Upload
                              </>
                            )}
                            <input 
                              ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                              type="file" 
                              style={{ display: 'none' }} 
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={() => handleUpload(doc.id)}
                              disabled={uploading !== null}
                            />
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
