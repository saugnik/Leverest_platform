'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';

const AUTH_STORAGE_KEY = 'leverest_auth_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {
      // corrupted storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, ready]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const isTeamEmail = email.endsWith('@leverestfin.com');
      const mode = isTeamEmail ? 'internal' : 'spoc';
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      
      if (data.user) {
        // Internal user
        const newUser: User = { ...data.user, id: data.user.id || 'internal-id', is_active: true, created_at: new Date().toISOString() };
        setUser(newUser);
        return { success: true };
      } else if (data.spoc) {
        // Client SPOC
        const spocUser: User = { 
          id: data.spoc.id, 
          email: data.spoc.email, 
          name: data.spoc.name, 
          role: 'client_spoc', 
          branch: 'kolkata', 
          is_active: true, 
          created_at: new Date().toISOString() 
        };
        setUser(spocUser);
        return { success: true };
      }
      
      return { success: false, error: 'Unexpected response' };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // document.cookie max-age=0 to wipe local cookies not handled by the api
    document.cookie = `sb-auth-token=; path=/; max-age=0`;
    document.cookie = `mock-user-email=; path=/; max-age=0`;
    document.cookie = `lv_spoc_session=; path=/; max-age=0`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
