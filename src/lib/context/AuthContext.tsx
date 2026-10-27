'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types';

export interface UserProfile {
  user_id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  switchDemoRole: async () => {}
});

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; name: string }> = {
  admin: { email: 'admin@autocare.com', name: 'Admin User' },
  service_advisor: { email: 'rajesh@autocare.com', name: 'Rajesh Kumar (Service Advisor)' },
  mechanic: { email: 'suresh@autocare.com', name: 'Suresh Mehta (Mechanic)' }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
          setLoading(false);
          return;
        }
      }
      // If no session exists, default to Admin for seamless review/demo
      await switchDemoRole('admin');
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string = 'password123'): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUser(json.data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch {
      setUser(null);
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const cred = DEMO_CREDENTIALS[targetRole];
    if (cred) {
      await login(cred.email, 'password123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

