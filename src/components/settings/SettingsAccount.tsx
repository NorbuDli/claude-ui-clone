import React, { useState } from 'react';
import { Laptop, Check, Copy } from 'lucide-react';
import { UserSettings, ActivePageView } from '../../types';

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
  const [copiedOrgId, setCopiedOrgId] = useState(false);

  const handleCopyOrgId = () => {
    navigator.clipboard.writeText('org-claude-9824f1e09c8');
    setCopiedOrgId(true);
    setTimeout(() => setCopiedOrgId(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-[#ECEBE7] mb-1">Account</h3>
        <p className="text-xs text-[#8C8A82]">Manage credentials, devices, and sessions.</p>
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
