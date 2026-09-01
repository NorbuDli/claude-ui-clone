import { AuthorizedAccount } from '../types';

export const DEFAULT_AUTHORIZED_USERS: AuthorizedAccount[] = [
  {
    id: 'usr_admin_norbu',
    name: 'Norbu',
    email: 'norbu@claude.ai',
    password: 'password123',
    plan: 'pro',
    role: 'admin',
    createdAt: 1700000000000
  },
  {
    id: 'usr_admin_default',
    name: 'Admin',
    email: 'admin@claude.ai',
    password: 'adminpassword',
    plan: 'pro',
    role: 'admin',
    createdAt: 1700000000000
  }
];

const STORAGE_KEY = 'claude_authorized_accounts_v1';

export function getAuthorizedUsers(): AuthorizedAccount[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: AuthorizedAccount[] = JSON.parse(saved);
      const map = new Map<string, AuthorizedAccount>();
      DEFAULT_AUTHORIZED_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
      parsed.forEach((u) => map.set(u.email.toLowerCase(), u));
      return Array.from(map.values());
    }
  } catch (e) {
    console.error('Failed to load authorized users from localStorage:', e);
  }
  return [...DEFAULT_AUTHORIZED_USERS];
}

export function saveAuthorizedUser(user: Omit<AuthorizedAccount, 'id' | 'createdAt'> & { id?: string }): AuthorizedAccount {
  const users = getAuthorizedUsers();
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === user.email.trim().toLowerCase());

  const newAccount: AuthorizedAccount = {
    id: user.id || (existingIndex >= 0 ? users[existingIndex].id : 'usr_' + Math.random().toString(36).substring(2, 9)),
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    password: user.password,
    plan: user.plan || 'pro',
    role: user.role || 'member',
    createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : Date.now()
  };

  if (existingIndex >= 0) {
    users[existingIndex] = newAccount;
  } else {
    users.push(newAccount);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save authorized users:', e);
  }

  return newAccount;
}

export function deleteAuthorizedUser(emailOrId: string): void {
  const users = getAuthorizedUsers();
  const filtered = users.filter(
    (u) => u.id !== emailOrId && u.email.toLowerCase() !== emailOrId.toLowerCase()
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete authorized user:', e);
  }
}