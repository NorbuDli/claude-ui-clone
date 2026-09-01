import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthorizedAccount } from '../types';

// Read Supabase credentials from Vite or Next-style environment variables
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env as any).SUPABASE_URL ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (import.meta.env as any).SUPABASE_ANON_KEY ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

/**
 * Fetch all authorized accounts from Supabase cloud database.
 */
export async function fetchSupabaseAuthorizedUsers(): Promise<AuthorizedAccount[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch authorized_users notice:', error.message);
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name || 'User',
        email: (row.email || '').toLowerCase().trim(),
        password: row.password || '',
        plan: row.plan || 'pro',
        role: (row.email || '').toLowerCase().trim() === 'tenzinrey@gmail.com' ? 'admin' : 'member',
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
        durationLabel: row.duration_label || 'Unlimited'
      }));
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
  }
  return null;
}

/**
 * Upsert / Save an authorized user to Supabase cloud.
 */
export async function saveSupabaseAuthorizedUser(account: AuthorizedAccount): Promise<boolean> {
  if (!supabase) return false;

  try {
    const isMaster = account.email.toLowerCase().trim() === 'tenzinrey@gmail.com';
    const payload = {
      id: account.id,
      name: account.name,
      email: account.email.toLowerCase().trim(),
      password: account.password,
      plan: account.plan,
      role: isMaster ? 'admin' : 'member',
      expires_at: account.expiresAt ? new Date(account.expiresAt).toISOString() : null,
      duration_label: account.durationLabel || (account.expiresAt ? 'Custom' : 'Unlimited'),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('authorized_users')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving user to Supabase:', err);
    return false;
  }
}

/**
 * Delete an authorized user from Supabase cloud.
 */
export async function deleteSupabaseAuthorizedUser(email: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('email', email.toLowerCase().trim());

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting user from Supabase:', err);
    return false;
  }
}
