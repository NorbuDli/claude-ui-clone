import React, { useState } from 'react';
import { Laptop, Check, Copy, UserPlus, Trash2, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { UserSettings, ActivePageView, UserPlanTier } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SettingsTabProps {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  clearAllConversations: () => void;
  setActivePageView: (view: ActivePageView) => void;
}

export const SettingsAccount: React.FC<SettingsTabProps> = ({ 
  settings, 
  updateSettings,
  clearAllConversations,
  setActivePageView 
}) => {
  const { user: currentUser, authorizedUsers, addAuthorizedAccount, deleteAuthorizedAccount } = useAuth();
  const [copiedOrgId, setCopiedOrgId] = useState(false);
  const [copiedAccountEmail, setCopiedAccountEmail] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // New user form state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPlan, setNewPlan] = useState<UserPlanTier>('pro');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAddError('Please fill in name, email, and password.');
      return;
    }

    try {
      addAuthorizedAccount({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        plan: newPlan,
        role: newRole
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setIsAddingUser(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add user.');
    }
  };

  const handleCopyCredentials = (email: string, pass: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pass}`);
    setCopiedAccountEmail(email);
    setTimeout(() => setCopiedAccountEmail(null), 2000);
  };

  const handleCopyOrgId = () => {
    navigator.clipboard.writeText('org-claude-9824f1e09c8');
    setCopiedOrgId(true);
    setTimeout(() => setCopiedOrgId(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-[#ECEBE7] mb-1">Account & Access Control</h3>
        <p className="text-xs text-[#8C8A82]">Manage credentials, authorized user logins, and private access.</p>
      </div>

      {/* ─── AUTHORIZED ACCOUNTS & PASSWORDS (ADMIN) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-[#ECEBE7] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#DA7756]" />
              <span>Authorized User Logins</span>
            </h4>
            <p className="text-[11px] text-[#8C8A82]">
              Only these accounts can log in to your Claude workspace. Public signup is disabled.
            </p>
          </div>
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DA7756] hover:bg-[#C86545] text-white text-xs font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isAddingUser ? 'Cancel' : 'Create User'}</span>
          </button>
        </div>

        {/* Add User Form */}
        {isAddingUser && (
          <form onSubmit={handleAddUser} className="p-4 rounded-2xl bg-[#1C1B19] border border-[#DA7756]/40 space-y-3 animate-in fade-in duration-200">
            <div className="text-xs font-medium text-[#ECEBE7] flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-[#DA7756]" />
              <span>Create New User & Password</span>
            </div>

            {addError && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {addError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#8C8A82]">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-[#141413] border border-[#2B2A27] focus:border-[#DA7756] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8C8A82]">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-[#141413] border border-[#2B2A27] focus:border-[#DA7756] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8C8A82]">Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="SecretPass123"
                  className="w-full bg-[#141413] border border-[#2B2A27] focus:border-[#DA7756] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8C8A82]">Plan Tier</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as UserPlanTier)}
                  className="w-full bg-[#141413] border border-[#2B2A27] focus:border-[#DA7756] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] outline-none"
                >
                  <option value="pro">Pro Plan</option>
                  <option value="free">Free Plan</option>
                  <option value="team">Team Plan</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-3 py-1.5 rounded-xl bg-[#242320] hover:bg-[#2A2926] text-xs text-[#8C8A82] hover:text-[#ECEBE7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#ECEBE7] hover:bg-white text-black text-xs font-medium transition-colors shadow-sm"
              >
                Save Account
              </button>
            </div>
          </form>
        )}

        {/* List of Authorized Users */}
        <div className="rounded-2xl bg-[#1C1B19] border border-[#2B2A27] divide-y divide-[#262522] overflow-hidden">
          {authorizedUsers.map((acc) => {
            const isPassVisible = showPasswords[acc.id];
            const isCopied = copiedAccountEmail === acc.email;

            return (
              <div key={acc.id} className="p-3.5 flex items-center justify-between text-xs gap-3">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#ECEBE7] truncate">{acc.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      acc.plan === 'pro' 
                        ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30' 
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}>
                      {acc.plan}
                    </span>
                    {acc.role === 'admin' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8C8A82] font-mono truncate">{acc.email}</div>
                  <div className="flex items-center gap-2 pt-0.5 text-[11px] text-[#706E68]">
                    <span>Password:</span>
                    <span className="font-mono text-[#B4B3AD]">
                      {isPassVisible ? acc.password : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                      className="text-[#7E7C76] hover:text-[#ECEBE7] p-0.5"
                      title={isPassVisible ? "Hide password" : "Show password"}
                    >
                      {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopyCredentials(acc.email, acc.password)}
                    className="p-1.5 rounded-lg bg-[#242320] hover:bg-[#2C2A27] text-[#8C8A82] hover:text-[#ECEBE7] border border-[#33312E] transition-colors"
                    title="Copy Email & Password to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {acc.email !== 'norbu@claude.ai' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete authorized user ${acc.email}?`)) {
                          deleteAuthorizedAccount(acc.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1C1B19] border border-[#2B2A27]">
          <div>
            <div className="text-xs font-medium text-[#ECEBE7]">Logout of all devices</div>
            <p className="text-[11px] text-[#8C8A82]">Invalidate all active session tokens</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Log out from all connected devices?')) {
                alert('Logged out from all remote devices.');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#242320] hover:bg-[#2A2926] text-xs font-medium text-[#ECEBE7] border border-[#33312E] transition-colors"
          >
            Log out
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1C1B19] border border-red-900/30">
          <div>
            <div className="text-xs font-medium text-red-300">Delete your account</div>
            <p className="text-[11px] text-[#8C8A82]">Permanently delete account and all conversation data</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
                clearAllConversations();
                alert('Account reset completed.');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-xs font-medium text-red-300 border border-red-800/50 transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#1C1B19] border border-[#2B2A27] space-y-1.5">
        <div className="text-xs font-medium text-[#ECEBE7]">Organization ID</div>
        <div className="flex items-center justify-between bg-[#141413] px-3 py-2 rounded-xl border border-[#262522]">
          <span className="font-mono text-xs text-[#9C9A92]">org-claude-9824f1e09c8</span>
          <button
            onClick={handleCopyOrgId}
            className="flex items-center gap-1 text-[11px] text-[#DA7756] hover:underline"
          >
            {copiedOrgId ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Trusted devices</h4>
        <p className="text-[11px] text-[#8C8A82]">
          Devices authorized for persistent passkey authentication and local tool dispatch.
        </p>
        <div className="p-4 rounded-2xl bg-[#1C1B19] border border-[#2B2A27] text-center text-xs text-[#706E68]">
          No trusted devices
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Active sessions</h4>
        <div className="rounded-2xl bg-[#1C1B19] border border-[#2B2A27] overflow-hidden text-xs">
          <div className="grid grid-cols-4 p-3 bg-[#161514] border-b border-[#242320] text-[11px] font-semibold text-[#706E68]">
            <span>Device</span>
            <span>Location</span>
            <span>Created</span>
            <span>Updated</span>
          </div>
          <div className="grid grid-cols-4 p-3 items-center border-b border-[#201F1D] text-[#ECEBE7]">
            <div className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-[#DA7756]" />
              <span className="font-medium">Chrome</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950/70 border border-sky-800/60 text-sky-400">Current</span>
            </div>
            <span className="text-[#8C8A82]">Local</span>
            <span className="text-[#7E7C76]">Today</span>
            <span className="text-[#7E7C76]">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
