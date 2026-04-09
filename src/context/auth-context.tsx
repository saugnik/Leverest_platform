'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';
import { getDynamicSpocs, getPasswordHash } from '@/lib/dynamic';

const AUTH_STORAGE_KEY = 'leverest_auth_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  ready: boolean; // true once localStorage has been read
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Read from localStorage after mount (client-only, safe for Next.js App Router)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        // Validate it's a real user object before trusting it
        if (parsed?.id && parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {
      // corrupted storage — ignore
    }
    setReady(true);
  }, []);

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (!ready) return; // don't write during initial load
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, ready]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log(`[AUTH] Login attempt for: ${email}`);
    // Domain restriction — only @leverestfin.com or known SPOCs
    const isTeamEmail = email.endsWith('@leverestfin.com');
    console.log(`[AUTH] Is team email: ${isTeamEmail}`);

    if (isTeamEmail) {
      // Validate against mock users
      const found = MOCK_USERS.find((u) => u.email === email);
      console.log(`[AUTH] Found user:`, found ? `${found.name} (${found.role})` : 'NOT FOUND');
      if (!found) {
        return { success: false, error: 'No account found for this email address.' };
      }
      
      // Check for password override first
      const storedHash = getPasswordHash(email);
      if (storedHash) {
        if (password === storedHash) {
          console.log(`[AUTH] Password override matched`);
          // Save to localStorage immediately
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
          document.cookie = `sb-auth-token=mock-token-xyz; path=/; max-age=86400`;
          setUser(found);
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
      }

      // In prod, validate password hash via API. Here, accept "password" for demo.
      if (password !== 'password' && password !== 'admin') {
        console.log(`[AUTH] Password incorrect. Accepted: 'password' or 'admin', got: '${password}'`);
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      console.log(`[AUTH] Demo password accepted, saving user to state and localStorage`);
      // Save to localStorage immediately
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      document.cookie = `sb-auth-token=mock-token-xyz; path=/; max-age=86400`;
      setUser(found);
      return { success: true };
    }

    // Client SPOC login (any domain)
    const storedSpocHash = getPasswordHash(email);
    if (storedSpocHash) {
      const dynamicSpocs = getDynamicSpocs();
      const foundSpoc = dynamicSpocs.find(s => s.email === email);
      console.log(`[AUTH] Found SPOC:`, foundSpoc ? foundSpoc.name : 'NOT FOUND');
      
      if (foundSpoc) {
        if (storedSpocHash === password) {
          const spocUser: User = {
            id: foundSpoc.id,
            email: foundSpoc.email,
            name: foundSpoc.name,
            role: 'client_spoc',
            branch: 'kolkata',
            is_active: foundSpoc.is_active,
            created_at: foundSpoc.created_at,
          };
          console.log(`[AUTH] SPOC password matched, saving to state and localStorage`);
          // Save to localStorage immediately
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(spocUser));
          const spocSession = { id: spocUser.id, email: spocUser.email, name: spocUser.name, project_id: foundSpoc.project_id || 'mock-id', designation: foundSpoc.designation };
          const b64 = btoa(JSON.stringify(spocSession));
          document.cookie = `lv_spoc_session=${b64}; path=/; max-age=86400`;
          document.cookie = `sb-auth-token=mock-token-xyz; path=/; max-age=86400`;
          setUser(spocUser);
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
      }
    }

    console.log(`[AUTH] Login failed - invalid credentials`);
    return { success: false, error: 'Invalid credentials. Please contact your Leverest representative.' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.cookie = `sb-auth-token=; path=/; max-age=0`;
    document.cookie = `lv_spoc_session=; path=/; max-age=0`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function canAccessProject(userRole: UserRole | undefined, userEmail: string, projectAssignedTeam: string[]): boolean {
  if (!userRole) return false;
  if (userRole === 'admin' || userRole === 'accounts' || userRole === 'mis' || userRole === 'engagement_assistant') {
    return true;
  }
  return projectAssignedTeam.includes(userEmail);
}

export function canViewCommission(userRole: UserRole | undefined): boolean {
  return userRole === 'admin';
}

export function canManageQueries(userRole: UserRole | undefined): boolean {
  return userRole === 'admin' || userRole === 'relation_partner' || userRole === 'relation_manager' || userRole === 'engagement_partner' || userRole === 'engagement_manager';
}

export function canViewDocuments(userRole: UserRole | undefined): boolean {
  return userRole !== 'executive'; // executive sees assigned docs only
}
