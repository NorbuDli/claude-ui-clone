import React, { useState } from 'react';
import { Laptop, Check, Copy, UserPlus, Trash2, Key, Eye, EyeOff, ShieldCheck, Clock, Plus, Calendar, AlertTriangle } from 'lucide-react';
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
  const { user: currentUser, authorizedUsers, addAuthorizedAccount, deleteAuthorizedAccount, extendUserDuration } = useAuth();
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
  const [durationDays, setDurationDays] = useState<number>(30); // 30 days = 1 month default
  const [addError, setAddError] = useState<string | null>(null);

  const getExpiryInfo = (expiresAt: number | null | undefined) => {
    if (!expiresAt) return { isExpired: false, label: 'Unlimited / Never', daysLeft: null, dateStr: 'Never' };
    const now = Date.now();
    const diff = expiresAt - now;
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const isExpired = diff <= 0;
    const dateStr = new Date(expiresAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return { isExpired, label: dateStr, daysLeft, dateStr };
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAddError('Please fill in name, email, and password.');
      return;
    }

    const expiresAt = durationDays > 0 ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : null;
    const durationLabel = durationDays === 30 ? '1 Month'
      : durationDays === 60 ? '2 Months'
      : durationDays === 90 ? '3 Months'
      : durationDays === 180 ? '6 Months'
      : durationDays === 365 ? '1 Year'
      : durationDays === 7 ? '7 Days'
      : 'Unlimited';

    try {
      addAuthorizedAccount({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        plan: newPlan,
        role: newRole,
        expiresAt,
        durationLabel
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setDurationDays(30);
      setIsAddingUser(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add user.');
    }
  };

  const handleCopyCredentials = (acc: typeof authorizedUsers[0]) => {
    const expiry = getExpiryInfo(acc.expiresAt);
    const text = [
      `🌐 Claude Workspace Login`,
      `Email: ${acc.email}`,
      `Password: ${acc.password}`,
      `Plan: ${acc.plan.toUpperCase()}`,
      `Access Duration: ${acc.durationLabel || 'Custom'} (Expires: ${expiry.dateStr})`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedAccountEmail(acc.email);
    setTimeout(() => setCopiedAccountEmail(null), 2500);
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
        <p className="text-xs text-[#8C8A82]">Manage credentials, authorized user logins, duration expiration, and private access.</p>
      </div>

      {/* ─── AUTHORIZED ACCOUNTS & PASSWORDS (ADMIN) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-[#ECEBE7] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#DA7756]" />
              <span>Authorized User Accounts & Access Duration</span>
            </h4>
            <p className="text-[11px] text-[#8C8A82]">
              Create user logins with custom expiration (e.g. 1 month, 2 months). When expired, access is blocked automatically.
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
              <span>Create User Login & Access Duration</span>
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
                  <option value="pro">Pro Plan (Unlimited Claude 3.7)</option>
                  <option value="team">Team Plan</option>
                  <option value="free">Free Plan</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] text-[#8C8A82] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#DA7756]" />
                  <span>Access Duration (Auto-Expires After)</span>
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-[#141413] border border-[#2B2A27] focus:border-[#DA7756] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] outline-none"
                >
                  <option value={30}>1 Month (30 Days)</option>
                  <option value={60}>2 Months (60 Days)</option>
                  <option value={90}>3 Months (90 Days)</option>
                  <option value={180}>6 Months (180 Days)</option>
                  <option value={365}>1 Year (365 Days)</option>
                  <option value={7}>7 Days (Trial)</option>
                  <option value={0}>Unlimited / Never Expire</option>
                </select>
                <p className="text-[10px] text-[#706E68]">
                  {durationDays > 0 
                    ? `Account will automatically expire on ${new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` 
                    : 'Account will remain active forever until manually deleted.'}
                </p>
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
                Save Account & Set Expiration
              </button>
            </div>
          </form>
        )}

        {/* List of Authorized Users */}
        <div className="rounded-2xl bg-[#1C1B19] border border-[#2B2A27] divide-y divide-[#262522] overflow-hidden">
          {authorizedUsers.map((acc) => {
            const isPassVisible = showPasswords[acc.id];
            const isCopied = copiedAccountEmail === acc.email;
            const expiry = getExpiryInfo(acc.expiresAt);

            return (
              <div key={acc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Expiration Badge */}
                    {expiry.isExpired ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/70 text-red-300 border border-red-800/60 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                        <span>EXPIRED ({expiry.dateStr})</span>
                      </span>
                    ) : expiry.daysLeft !== null ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{expiry.daysLeft}d left ({expiry.dateStr})</span>
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        Unlimited
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

                {/* Actions: Renew +1 Mo / +2 Mo / Copy / Delete */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => extendUserDuration(acc.id, 30)}
                    className="px-2 py-1 rounded-lg bg-[#242320] hover:bg-[#2C2A27] text-[10px] text-[#A5A39C] hover:text-[#DA7756] border border-[#33312E] transition-colors flex items-center gap-0.5"
                    title="Extend user access by 30 days (1 Month)"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+1 Mo</span>
                  </button>

                  <button
                    onClick={() => extendUserDuration(acc.id, 60)}
                    className="px-2 py-1 rounded-lg bg-[#242320] hover:bg-[#2C2A27] text-[10px] text-[#A5A39C] hover:text-[#DA7756] border border-[#33312E] transition-colors flex items-center gap-0.5"
                    title="Extend user access by 60 days (2 Months)"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+2 Mo</span>
                  </button>

                  <button
                    onClick={() => handleCopyCredentials(acc)}
                    className="p-1.5 rounded-lg bg-[#242320] hover:bg-[#2C2A27] text-[#8C8A82] hover:text-[#ECEBE7] border border-[#33312E] transition-colors"
                    title="Copy full login credentials & expiration info to clipboard"
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
