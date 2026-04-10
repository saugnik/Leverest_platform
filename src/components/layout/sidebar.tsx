'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';
import {
  LayoutDashboard, FolderKanban, Columns2, FileText, MessageSquare,
  Banknote, DollarSign, StickyNote, Activity, Users, Bell, LogOut,
  ChevronLeft, ChevronRight, Building2, Settings, Brain
} from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}
function getGrad(name: string) {
  const grads = [
    'linear-gradient(135deg,#C9960C,#8B5CF6)',
    'linear-gradient(135deg,#3B82F6,#06B6D4)',
    'linear-gradient(135deg,#22C55E,#059669)',
    'linear-gradient(135deg,#F97316,#EF4444)',
    'linear-gradient(135deg,#8B5CF6,#EC4899)',
  ];
  return grads[name.charCodeAt(0) % grads.length];
}
function getRolePill(role: string) {
  const m: Record<string, {label:string;color:string}> = {
    admin:                { label:'Admin',       color:'#F0B429' },
    relation_partner:     { label:'Rel. Partner', color:'#60A5FA' },
    relation_manager:     { label:'Rel. Manager', color:'#60A5FA' },
    engagement_partner:   { label:'Eng. Partner', color:'#A78BFA' },
    engagement_manager:   { label:'Eng. Manager', color:'#A78BFA' },
    executive:            { label:'Executive',    color:'#94A3B8' },
    accounts:             { label:'Accounts',     color:'#22C55E' },
    mis:                  { label:'MIS',          color:'#22D3EE' },
    engagement_assistant: { label:'Eng. Asst',    color:'#FB923C' },
  };
  return m[role] || { label: role, color: '#94A3B8' };
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  section?: string;
};

const NAV: NavItem[] = [
  // Operations
  { href: '/dashboard',              label: 'Dashboard',      icon: LayoutDashboard, section: 'Operations', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis','engagement_assistant'] },
  { href: '/dashboard/projects',     label: 'Projects',       icon: FolderKanban,    section: '', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis'] },
  { href: '/dashboard/kanban',       label: 'Kanban Board',   icon: Columns2,        section: '', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis'] },
  // Deal management
  { href: '/dashboard/documents',    label: 'Documents',      icon: FileText,        section: 'Deal Management', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis'] },
  { href: '/dashboard/queries',      label: 'Queries',        icon: MessageSquare,   section: '', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis'] },

  // Finance
  { href: '/dashboard/finance',      label: 'Finance & HR',   icon: Banknote,        section: 'Finance', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis','accounts','engagement_assistant'] },
  { href: '/dashboard/commission',   label: 'Commission',     icon: DollarSign,      section: '', roles: ['admin', 'accounts'] },
  // Admin
  { href: '/dashboard/notes',        label: 'Internal Notes', icon: StickyNote,      section: 'Records', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis'] },
  { href: '/dashboard/activity',     label: 'Activity Log',   icon: Activity,        section: '', roles: ['admin','manager','relation_partner','relation_manager','engagement_partner','engagement_manager','executive','mis'] },
  { href: '/dashboard/team',         label: 'Team',           icon: Users,           section: '', roles: ['admin','relation_partner','engagement_partner'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const unread = MOCK_NOTIFICATIONS.filter(n => !n.is_read && n.user_id === user?.id).length;
  const visibleNav = NAV.filter(item => !item.roles || (user?.role && item.roles.includes(user.role)));

  // Group by section
  const sections: string[] = [];
  visibleNav.forEach(item => {
    if (item.section && !sections.includes(item.section)) sections.push(item.section);
  });

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const rolePill = user ? getRolePill(user.role) : { label: '', color: '#94A3B8' };

  return (
    <aside style={{
      width: collapsed ? '56px' : '220px',
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--bg-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      height: '100vh',
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '14px', minHeight: '52px',
        borderBottom: '1px solid var(--bg-border)',
        gap: '10px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
            background: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={14} color="#F0B429" />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                Leverest
              </div>
              <div style={{ fontSize: '0.55rem', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Kolkata
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px', flexShrink: 0 }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{ position: 'absolute', left: '4px', top: '58px', background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: '5px', cursor: 'pointer', color: 'var(--text-3)', padding: '3px', zIndex: 10 }}
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {sections.map((sec) => {
          const items = visibleNav.filter(i => i.section === sec || (!i.section && visibleNav[visibleNav.indexOf(i) - 1]?.section === sec));
          const sectionItems = visibleNav.filter((_, idx) => {
            // Items belonging to this section
            let currentSec = '';
            for (let i = 0; i <= idx; i++) {
              const s = visibleNav[i].section;
              if (s) currentSec = s;
            }
            return currentSec === sec;
          });

          return (
            <div key={sec}>
              {!collapsed && (
                <div style={{
                  fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: 'var(--text-4)',
                  padding: '10px 8px 4px',
                }}>
                  {sec}
                </div>
              )}
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: `8px ${collapsed ? '0' : '10px'}`,
                      borderRadius: '7px', textDecoration: 'none',
                      fontSize: '0.78rem', fontWeight: 500,
                      color: active ? '#F0B429' : 'var(--text-2)',
                      background: active ? 'rgba(201,150,12,0.1)' : 'transparent',
                      borderRight: active ? '2px solid var(--gold)' : '2px solid transparent',
                      transition: 'all 0.12s',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      marginBottom: '1px',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; } }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--bg-border)', padding: '8px', flexShrink: 0 }}>
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          title={collapsed ? 'Notifications' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '7px 10px', borderRadius: '7px', textDecoration: 'none',
            fontSize: '0.78rem', color: 'var(--text-2)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            position: 'relative', background: isActive('/dashboard/notifications') ? 'rgba(201,150,12,0.1)' : 'transparent',
            marginBottom: '2px',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Bell size={15} />
            {unread > 0 && (
              <div style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: 'var(--gold)', color: '#000',
                fontSize: '0.52rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread}
              </div>
            )}
          </div>
          {!collapsed && <span>Notifications</span>}
          {!collapsed && unread > 0 && (
            <span style={{
              marginLeft: 'auto', background: 'var(--gold)', color: '#000',
              fontSize: '0.58rem', fontWeight: 800,
              borderRadius: '999px', padding: '1px 6px',
            }}>
              {unread}
            </span>
          )}
        </Link>

        {user?.role === 'admin' && (
          <Link
            href="/dashboard/settings"
            title={collapsed ? 'Settings' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '7px 10px', borderRadius: '7px', textDecoration: 'none',
              fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <Settings size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Settings</span>}
          </Link>
        )}

        {/* User row */}
        {!collapsed ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '7px',
            borderTop: '1px solid var(--bg-border)', paddingTop: '10px', marginTop: '4px',
          }}>
            {user && (
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: getGrad(user.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700, color: '#fff',
              }}>
                {getInitials(user.name)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.62rem', color: rolePill.color }}>
                {rolePill.label}
              </div>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: '4px', borderRadius: '5px', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { logout(); router.push('/'); }}
            title="Sign out"
            style={{
              width: '100%', display: 'flex', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', padding: '6px', borderRadius: '5px',
            }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
