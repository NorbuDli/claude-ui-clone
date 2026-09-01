import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthorizedAccount, UserPlanTier } from '../types';
import {
  getAuthorizedUsers,
  saveAuthorizedUser,
  deleteAuthorizedUser
} from '../config/authorizedUsers';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authorizedUsers: AuthorizedAccount[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  addAuthorizedAccount: (account: Omit<AuthorizedAccount, 'id' | 'createdAt'> & { id?: string }) => AuthorizedAccount;
  deleteAuthorizedAccount: (idOrEmail: string) => void;
  extendUserDuration: (idOrEmail: string, additionalDays: number) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const STORAGE_KEY = 'claude_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedAccount[]>(() => getAuthorizedUsers());

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        // Check if session has expired
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse auth session:', e);
    }
    // Default to null if no active session
    return null;
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
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Look for existing google user or admin account
    const accounts = getAuthorizedUsers();
    const adminAcc = accounts.find((a) => a.role === 'admin') || accounts[0];

    const googleUser: AuthUser = {
      id: adminAcc?.id || 'usr_g_admin',
      name: adminAcc?.name || 'Norbu',
      email: adminAcc?.email || 'norbu@claude.ai',
      plan: adminAcc?.plan || 'pro',
      role: 'admin',
      provider: 'google',
      createdAt: Date.now(),
      expiresAt: null,
      durationLabel: 'Unlimited'
    };
    setUser(googleUser);
    setIsLoading(false);
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Reload latest authorized users
    const accounts = getAuthorizedUsers();
    const matched = accounts.find(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    if (!matched) {
      setIsLoading(false);
      throw new Error(
        'Access denied. This email is not registered on this private workspace. Please contact the administrator.'
      );
    }

    if (matched.password && matched.password !== cleanPassword) {
      setIsLoading(false);
      throw new Error('Incorrect password. Please verify your password and try again.');
    }

    // Check account expiration duration
    if (matched.expiresAt && Date.now() > matched.expiresAt) {
      setIsLoading(false);
      const expiredDateStr = new Date(matched.expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      throw new Error(
        `Account expired. Your access subscription expired on ${expiredDateStr}. Please contact the administrator to renew your account.`
      );
    }

    const authUser: AuthUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      plan: matched.plan || 'pro',
      role: matched.role || 'member',
      provider: 'email',
      createdAt: matched.createdAt,
      expiresAt: matched.expiresAt,
      durationLabel: matched.durationLabel
    };

    setUser(authUser);
    setIsLoading(false);
  };

  const addAuthorizedAccount = (account: Omit<AuthorizedAccount, 'id' | 'createdAt'> & { id?: string }) => {
    const created = saveAuthorizedUser(account);
    setAuthorizedUsers(getAuthorizedUsers());
    return created;
  };

  const deleteAuthorizedAccount = (idOrEmail: string) => {
    deleteAuthorizedUser(idOrEmail);
    setAuthorizedUsers(getAuthorizedUsers());
  };

  const extendUserDuration = (idOrEmail: string, additionalDays: number) => {
    const accounts = getAuthorizedUsers();
    const account = accounts.find(a => a.id === idOrEmail || a.email.toLowerCase() === idOrEmail.toLowerCase());
    if (account) {
      const baseTime = account.expiresAt && account.expiresAt > Date.now() ? account.expiresAt : Date.now();
      const newExpiry = baseTime + additionalDays * 24 * 60 * 60 * 1000;
      saveAuthorizedUser({
        ...account,
        expiresAt: newExpiry,
        durationLabel: `+${additionalDays} Days (Extended)`
      });
      setAuthorizedUsers(getAuthorizedUsers());
    }
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
        authorizedUsers,
        loginWithGoogle,
        loginWithEmail,
        addAuthorizedAccount,
        deleteAuthorizedAccount,
        extendUserDuration,
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
