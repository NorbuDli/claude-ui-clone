import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserPlanTier } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password?: string) => Promise<void>;
  quickLoginAs: (presetUser: Partial<AuthUser>) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr_norbu_01',
  name: 'Norbu',
  email: 'norbu@claude.ai',
  plan: 'pro',
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  provider: 'email'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'claude_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse auth session:', e);
    }
    // Default to initial demo user or null if explicitly logged out
    const loggedOut = localStorage.getItem('claude_has_logged_out');
    if (loggedOut === 'true') {
      return null;
    }
    return DEFAULT_DEMO_USER;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.removeItem('claude_has_logged_out');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save auth session:', e);
    }
  }, [user]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    // Simulate brief network auth delay
    await new Promise((resolve) => setTimeout(resolve, 650));
    const googleUser: AuthUser = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      name: 'Google User',
      email: 'user@gmail.com',
      plan: 'pro',
      provider: 'google',
      createdAt: Date.now()
    };
    setUser(googleUser);
    setIsLoading(false);
  };

  const loginWithEmail = async (email: string, _password?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const namePart = email.split('@')[0] || 'User';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const emailUser: AuthUser = {
      id: 'usr_em_' + Math.random().toString(36).substring(2, 9),
      name: formattedName,
      email: email.trim().toLowerCase(),
      plan: 'free',
      provider: 'email',
      createdAt: Date.now()
    };
    setUser(emailUser);
    setIsLoading(false);
  };

  const signupWithEmail = async (name: string, email: string, _password?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newUser: AuthUser = {
      id: 'usr_reg_' + Math.random().toString(36).substring(2, 9),
      name: name.trim() || 'New User',
      email: email.trim().toLowerCase(),
      plan: 'free',
      provider: 'email',
      createdAt: Date.now()
    };
    setUser(newUser);
    setIsLoading(false);
  };

  const quickLoginAs = (preset: Partial<AuthUser>) => {
    const fullUser: AuthUser = {
      id: preset.id || 'usr_' + Math.random().toString(36).substring(2, 9),
      name: preset.name || 'Demo User',
      email: preset.email || 'demo@claude.ai',
      plan: preset.plan || 'pro',
      provider: preset.provider || 'email',
      createdAt: Date.now()
    };
    setUser(fullUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.setItem('claude_has_logged_out', 'true');
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        quickLoginAs,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
