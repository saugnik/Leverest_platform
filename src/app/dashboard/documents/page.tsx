'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Search, Upload, ExternalLink, FileText, Loader2, X, Plus } from 'lucide-react';

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function DocumentsPage() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ project_id: '', document_name: '', category: '', file: null as File | null });
  
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const uploadFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, projRes] = await Promise.all([
          fetch('/api/documents'),
          fetch('/api/projects')
        ]);
        const dbDocs = await docsRes.json();
        const dbProj = await projRes.json();
        setAllDocs(dbDocs.documents || []);
        setProjects(dbProj.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = [...new Set(allDocs.map((d: any) => d.category))];

  const filtered = allDocs.filter((d: any) => {
    const docName = d.document_name || '';
    const matchQ = !search || docName.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    const matchP = filterProject === 'all' || d.project_id === filterProject;
    const matchS = filterStatus === 'all' || d.status === filterStatus;
    const matchC = filterCat === 'all' || d.category === filterCat;
    return matchQ && matchP && matchS && matchC;
  });

  const received = allDocs.filter((d: any) => d.status === 'received').length;
  const pending  = allDocs.filter((d: any) => d.status === 'pending').length;
  const required = allDocs.filter((d: any) => d.status === 'required').length;
  const pct = allDocs.length ? Math.round((received / allDocs.length) * 100) : 0;

  async function handleGlobalUpload() {
    if (!uploadForm.project_id || !uploadForm.document_name || !uploadForm.category || !uploadForm.file) return;
    
    setUploading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: uploadForm.project_id,
          document_name: uploadForm.document_name,
          category: uploadForm.category,
          status: 'received',
          file_url: URL.createObjectURL(uploadForm.file),
          file_name: uploadForm.file.name,
          file_source: 'manual',
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.document) {
          setAllDocs(prev => [data.document, ...prev]);
        }
        setShowUploadModal(false);
        setUploadForm({ project_id: '', document_name: '', category: '', file: null });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleRowUpload(docId: string) {
    const input = fileInputRefs.current[docId];
    if (!input || !input.files || !input.files.length) return;
    
    const file = input.files[0];
    setUploading(true);
    
    try {
      const doc = allDocs.find(d => d.id === docId);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: doc?.project_id,
          document_name: doc?.document_name,
          category: doc?.category,
          status: 'received',
          file_url: URL.createObjectURL(file),
          file_name: file.name,
          file_source: 'manual',
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.document) {
          setAllDocs(prev => [...prev, data.document]);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (input) input.value = '';
    }
  }

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
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Documents</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Global document manager — {filtered.length} of {allDocs.length} shown</div>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowUploadModal(true)}>
          <Upload size={14} /> Upload Document
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Upload Document</div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Project *</label>
                <select value={uploadForm.project_id} onChange={e => setUploadForm(p => ({ ...p, project_id: e.target.value }))} className="field">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.company_name || p.client_name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Document Name *</label>
                <input type="text" value={uploadForm.document_name} onChange={e => setUploadForm(p => ({ ...p, document_name: e.target.value }))} className="field" placeholder="e.g., Certificate of Incorporation" />
              </div>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Category *</label>
                <select value={uploadForm.category} onChange={e => setUploadForm(p => ({ ...p, category: e.target.value }))} className="field">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>File *</label>
                <input type="file" ref={uploadFileRef} onChange={e => setUploadForm(p => ({ ...p, file: e.target.files?.[0] || null }))} className="field" style={{ padding: '8px' }} />
              </div>
              
              {uploadForm.file && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  Selected: {uploadForm.file.name}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!uploadForm.project_id || !uploadForm.document_name || !uploadForm.category || !uploadForm.file || uploading} onClick={handleGlobalUpload}>
                {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Upload size={14} /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Documents', value: allDocs.length, color: 'var(--text-1)' },
          { label: 'Received', value: received, color: '#4ADE80' },
          { label: 'Pending', value: pending, color: '#FCD34D' },
          { label: 'Missing / Required', value: required, color: '#F87171' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{k.label}</div>
            {k.label === 'Total Documents' && (
              <div>
                <div className="progress-track" style={{ marginTop: '8px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '4px' }}>{pct}% received</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input type="text" placeholder="Search document name or category…" value={search} onChange={e => setSearch(e.target.value)} className="field" style={{ paddingLeft: '32px' }} />
        </div>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Projects</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.client_name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Status</option>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="required">Required</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Categories</option>
          {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Project</th>
                <th>Status</th>
                <th>Source</th>
                <th>File</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc: any) => {
                const proj = projects.find((p: any) => p.id === doc.project_id);
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={13} color={doc.status === 'received' ? '#4ADE80' : doc.status === 'pending' ? '#FCD34D' : '#F87171'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-1)' }}>{doc.document_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{doc.category}</td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--gold)' }}>{proj?.client_name || '—'}</td>
                    <td>
                      <span className={`pill ${doc.status === 'received' ? 'pill-green' : doc.status === 'pending' ? 'pill-gold' : 'pill-red'}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                    <td>{doc.file_source ? <span className="pill pill-slate">{doc.file_source}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}</td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                      {doc.file_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                          {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', flexShrink: 0 }}><ExternalLink size={11} /></a>}
                        </div>
                      ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {doc.uploaded_at ? fmtDate(doc.uploaded_at) : '—'}
                    </td>
                    <td>
                      {doc.status !== 'received' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: '5px', padding: '3px 8px', background: 'var(--gold-dim)' }}>
                          <Upload size={11} /> Upload
                          <input 
                            ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                            type="file" 
                            style={{ display: 'none' }} 
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={() => handleRowUpload(doc.id)}
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>No documents match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
