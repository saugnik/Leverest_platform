'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';
import { getDynamicSpocs } from '@/lib/dynamic';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Domain restriction — only @leverestfin.com or known SPOCs
    const isTeamEmail = email.endsWith('@leverestfin.com');

    if (isTeamEmail) {
      // Validate against mock users
      const found = MOCK_USERS.find((u) => u.email === email);
      if (!found) {
        return { success: false, error: 'No account found for this email address.' };
      }
      // In prod, validate password hash via API. Here, accept "password" for demo.
      if (password !== 'password' && password !== 'admin') {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      setUser(found);
      return { success: true };
    }

    // Client SPOC login (any domain)
    const dynamicSpocs = getDynamicSpocs();
    const foundSpoc = dynamicSpocs.find(s => s.email === email);

    if (foundSpoc) {
      if (foundSpoc.password_hash === password) { // In prod, compare hashed passwords
        const spocUser: User = {
          id: foundSpoc.id,
          email: foundSpoc.email,
          name: foundSpoc.name,
          role: 'client_spoc',
          branch: foundSpoc.branch || 'kolkata', // Assuming a default branch if not set
          is_active: foundSpoc.is_active,
          created_at: foundSpoc.created_at,
        };
        setUser(spocUser);
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
    }

    return { success: false, error: 'Invalid credentials. Please contact your Leverest representative.' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
  return userRole === 'admin' || userRole === 'accounts' || userRole === 'relation_partner' || userRole === 'relation_manager' || userRole === 'engagement_partner' || userRole === 'engagement_manager';
}

export function canManageQueries(userRole: UserRole | undefined): boolean {
  return userRole === 'admin' || userRole === 'relation_partner' || userRole === 'relation_manager' || userRole === 'engagement_partner' || userRole === 'engagement_manager';
}

export function canViewDocuments(userRole: UserRole | undefined): boolean {
  return userRole !== 'executive'; // executive sees assigned docs only
}
