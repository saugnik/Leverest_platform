'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Lock, Plus, Send, Loader2 } from 'lucide-react';

function getInitials(n: string) { return n?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?'; }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)'];
  return g[name?.charCodeAt(0) % g.length] || g[0];
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [newNote, setNewNote] = useState('');
  const [newNoteProject, setNewNoteProject] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, notesRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/notes'),
        ]);
        
        const projectsData = await projectsRes.json();
        const notesData = await notesRes.json();
        
        if (projectsData.projects) setProjects(projectsData.projects);
        if (notesData.notes) setAllNotes(notesData.notes);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function addNote() {
    if (!newNote.trim() || !newNoteProject) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: newNoteProject, note: newNote }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setAllNotes(prev => [data.note, ...prev]);
          setNewNote('');
          setNewNoteProject('');
        }
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSaving(false);
    }
  }

  const filtered = filterProject === 'all' ? allNotes : allNotes.filter(n => n.project_id === filterProject);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        Loading notes...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Internal Notes</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(201,150,12,0.1)', border: '1px solid rgba(201,150,12,0.2)', borderRadius: '99px', padding: '3px 10px' }}>
              <Lock size={10} color="#F0B429" />
              <span style={{ fontSize: '0.62rem', color: '#F0B429', fontWeight: 700 }}>Not visible to clients</span>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>{filtered.length} notes</div>
        </div>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="field" style={{ width: 'auto' }}>
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
        </select>
      </div>

      {/* Add note */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={11} color="var(--text-3)" /> ADD INTERNAL NOTE
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <select value={newNoteProject} onChange={e => setNewNoteProject(e.target.value)} className="field" style={{ width: 'auto' }}>
            <option value="">Select project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
          </select>
        </div>
        <textarea
          placeholder="Add a private internal note that is NOT visible to the client…"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="field"
          style={{ minHeight: '80px', marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            disabled={!newNote.trim() || !newNoteProject || saving}
            onClick={addNote}
          >
            {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={12} />}
            {saving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {filtered.map((note: any) => {
          const proj = projects.find(p => p.id === note.project_id);
          const creator = note.created_by || 'Unknown';
          return (
            <div key={note.id} className="card" style={{ padding: '16px' }}>
              {/* Project badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="pill pill-gold" style={{ fontSize: '0.65rem' }}>{proj?.company_name || 'Unknown Project'}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{timeAgo(note.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: 1.7 }}>{note.note || note.content}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--bg-border)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: getGrad(creator), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                  {getInitials(creator)}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{creator}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', gridColumn: '1/-1' }}>
            <div style={{ fontSize: '0.88rem', marginBottom: '4px' }}>No notes found.</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Add your first internal note above.</div>
          </div>
        )}
      </div>
    </div>
  );
}
