'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { MOCK_DOCUMENTS, MOCK_PROJECTS, getProjectsByUser, formatCurrency } from '@/lib/mock-data';
import { Search, Upload, ExternalLink, FileText } from 'lucide-react';

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function DocumentsPage() {
  const { user } = useAuth();
  const projects = getProjectsByUser(user?.email || '', user?.role || '');
  const projectIds = projects.map(p => p.id);
  const allDocs = MOCK_DOCUMENTS.filter(d => projectIds.includes(d.project_id));

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');

  const categories = [...new Set(allDocs.map(d => d.category))];

  const filtered = allDocs.filter(d => {
    const matchQ = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    const matchP = filterProject === 'all' || d.project_id === filterProject;
    const matchS = filterStatus === 'all' || d.status === filterStatus;
    const matchC = filterCat === 'all' || d.category === filterCat;
    return matchQ && matchP && matchS && matchC;
  });

  const received = allDocs.filter(d => d.status === 'received').length;
  const pending  = allDocs.filter(d => d.status === 'pending').length;
  const required = allDocs.filter(d => d.status === 'required').length;
  const pct = allDocs.length ? Math.round((received / allDocs.length) * 100) : 0;

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Documents</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Global document manager — {filtered.length} of {allDocs.length} shown</div>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> Upload Document
        </button>
      </div>

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
          {projects.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Status</option>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="required">Required</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
              {filtered.map(doc => {
                const proj = projects.find(p => p.id === doc.project_id);
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={13} color={doc.status === 'received' ? '#4ADE80' : doc.status === 'pending' ? '#FCD34D' : '#F87171'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-1)' }}>{doc.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{doc.category}</td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--gold)' }}>{proj?.company_name || '—'}</td>
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: '5px', padding: '3px 8px', background: 'var(--gold-dim)' }}>
                          <Upload size={11} /> Upload
                          <input type="file" style={{ display: 'none' }} />
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
