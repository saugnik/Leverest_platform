'use client';

import { useAuth } from '@/context/auth-context';
import { MOCK_USERS } from '@/lib/mock-data';
import { getDynamicSpocs } from '@/lib/dynamic';
import { Mail, Phone, UserCheck } from 'lucide-react';

function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function getGrad(name: string) {
  const g = ['linear-gradient(135deg,#C9960C,#8B5CF6)', 'linear-gradient(135deg,#3B82F6,#06B6D4)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#EF4444)', 'linear-gradient(135deg,#8B5CF6,#EC4899)'];
  return g[name.charCodeAt(0) % g.length];
}
const ROLES: Record<string, { label: string; color: string }> = {
  admin:                { label: 'Admin',               color: '#F0B429' },
  relation_partner:     { label: 'Relation Partner',    color: '#60A5FA' },
  relation_manager:     { label: 'Relation Manager',    color: '#60A5FA' },
  engagement_partner:   { label: 'Engagement Partner',  color: '#A78BFA' },
  engagement_manager:   { label: 'Engagement Manager',  color: '#A78BFA' },
  executive:            { label: 'Executive',           color: '#94A3B8' },
  accounts:             { label: 'Accounts',            color: '#22C55E' },
  mis:                  { label: 'MIS',                 color: '#22D3EE' },
  engagement_assistant: { label: 'Eng. Assistant',      color: '#FB923C' },
};

const SECTIONS = [
  {
    title: 'Senior Leadership',
    roles: ['admin', 'relation_partner', 'engagement_partner'],
    desc: 'Full platform access · Commission · All projects',
  },
  {
    title: 'Deal Team',
    roles: ['relation_manager', 'engagement_manager', 'executive', 'engagement_assistant'],
    desc: 'Assigned projects · Documents · Queries',
  },
  {
    title: 'Support Teams',
    roles: ['accounts', 'mis'],
    desc: 'Cross-project view · Finance data',
  },
];

export default function TeamPage() {
  const { user } = useAuth();
  const canViewFull = ['admin', 'relation_partner', 'engagement_partner'].includes(user?.role || '');

  return (
    <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Team</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>
          {MOCK_USERS.length} active team members · Kolkata Branch
        </div>
      </div>

      {/* Internal team sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {SECTIONS.map(section => {
          const sectionUsers = MOCK_USERS.filter(u => section.roles.includes(u.role));
          if (!sectionUsers.length) return null;
          return (
            <div key={section.title} className="card">
              <div className="card-header">
                <div>
                  <div className="card-header-title">{section.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{section.desc}</div>
                </div>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)',
                  background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '99px',
                }}>
                  {sectionUsers.length} members
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      {canViewFull && <th>Phone</th>}
                      <th>Access Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionUsers.map(u => {
                      const role = ROLES[u.role] || { label: u.role, color: '#94A3B8' };
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getGrad(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                {getInitials(u.name)}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{u.name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{u.designation}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: role.color }}>{role.label}</span>
                          </td>
                          <td>
                            <a href={`mailto:${u.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-2)', textDecoration: 'none' }}>
                              <Mail size={11} /> {u.email}
                            </a>
                          </td>
                          {canViewFull && (
                            <td style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{u.phone || '—'}</td>
                          )}
                          <td>
                            <div style={{ fontSize: '0.66rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                              {u.role === 'admin' ? 'All projects + settings' :
                               ['relation_partner','engagement_partner'].includes(u.role) ? 'Assigned + commission' :
                               ['accounts','mis'].includes(u.role) ? 'All projects (view-only)' :
                               'Assigned projects only'}
                            </div>
                          </td>
                          <td>
                            <span className={`pill ${u.is_active ? 'pill-green' : 'pill-slate'}`}>
                              {u.is_active ? '● Active' : '○ Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Client SPOCs section */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-header-title">Client SPOCs</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Project-isolated access · Own deal only
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '99px' }}>
              {getDynamicSpocs().length} SPOCs
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Project</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {getDynamicSpocs().map(s => {
                  const proj = s.project_id;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getGrad(s.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {getInitials(s.name)}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.74rem' }}>{s.designation}</td>
                      <td>
                        <a href={`mailto:${s.email}`} style={{ fontSize: '0.72rem', color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={11} /> {s.email}
                        </a>
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{s.phone}</td>
                      <td>
                        <span className="pill pill-gold" style={{ fontSize: '0.65rem' }}>Project {proj}</span>
                      </td>
                      <td style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>Docs · Queries · Timeline · Banks</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
