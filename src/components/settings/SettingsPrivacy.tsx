import React, { useState } from 'react';
import { ArrowRight, Download, Trash2 } from 'lucide-react';
import { UserSettings } from '../../types';
import { useChat } from '../../context/ChatContext';

interface SettingsTabProps {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsPrivacy: React.FC<SettingsTabProps> = ({ settings, updateSettings }) => {
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const { clearAllConversations } = useChat();

  const handleExportData = () => {
    const exportPayload = {
      user: {
        name: settings.userName,
        email: settings.userEmail,
        role: settings.userRole
      },
      settings,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-[#ECEBE7] mb-1">Privacy</h3>
        <p className="text-xs text-[#8C8A82]">Control how your data and conversations are processed.</p>
      </div>

      <div
        onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
        className="flex items-center justify-between p-4 rounded-2xl bg-[#1C1B19] border border-[#2B2A27] hover:border-[#DA7756]/50 cursor-pointer transition-all"
      >
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-[#ECEBE7]">How we use your data</div>
          <p className="text-[11px] text-[#8C8A82]">Encrypted transit, local storage isolation, zero leakage</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#8C8A82]" />
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Preferences</h4>
        
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1B19] border border-[#2B2A27]">
          <div>
            <span className="text-xs font-medium text-[#ECEBE7]">Location metadata</span>
            <p className="text-[11px] text-[#8C8A82]">Attach approximate timezone & region for localized prompts</p>
          </div>
          <input
            type="checkbox"
            checked={settings.privacy.locationMetadata}
            onChange={(e) =>
              updateSettings({
                privacy: { ...settings.privacy, locationMetadata: e.target.checked }
              })
            }
            className="w-4 h-4 accent-[#DA7756]"
          />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1B19] border border-[#2B2A27]">
          <div>
            <span className="text-xs font-medium text-[#ECEBE7]">Improve AI models</span>
            <p className="text-[11px] text-[#8C8A82]">Allow anonymized conversation feedback to tune evaluation suites</p>
          </div>
          <input
            type="checkbox"
            checked={settings.privacy.improveAiModels}
            onChange={(e) =>
              updateSettings({
                privacy: { ...settings.privacy, improveAiModels: e.target.checked }
              })
            }
            className="w-4 h-4 accent-[#DA7756]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Your data</h4>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1B19] border border-[#2B2A27]">
          <div>
            <span className="text-xs font-medium text-[#ECEBE7]">Export data</span>
            <p className="text-[11px] text-[#8C8A82]">Download all chats, memories, and settings in JSON</p>
          </div>
          <button
            onClick={handleExportData}
            className="px-3 py-1.5 rounded-xl bg-[#242320] hover:bg-[#2A2926] text-xs font-medium text-[#ECEBE7] border border-[#33312E] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export data</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1B19] border border-[#2B2A27]">
          <div>
            <span className="text-xs font-medium text-[#ECEBE7]">Clear all chat history</span>
            <p className="text-[11px] text-[#8C8A82]">Delete all local conversations permanently</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Delete all conversations?')) {
                clearAllConversations();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-xs font-medium text-red-300 border border-red-800/50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear chats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
