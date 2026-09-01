import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { UserSettings } from '../../types';

interface SettingsTabProps {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsGeneral: React.FC<SettingsTabProps> = ({ settings, updateSettings }) => {
  return (
    <div className="space-y-8 max-w-xl">
      {/* ─── Profile Section (matching Image 2) ─── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#ECEBE7]">Profile</h3>

        {/* Avatar */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-normal text-[#B4B3AD]">Avatar</span>
          <div className="w-9 h-9 rounded-full bg-[#2B2A27] border border-[#3A3935] text-[#ECEBE7] flex items-center justify-center font-medium text-sm">
            {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'N'}
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-normal text-[#B4B3AD]">Full name</label>
          <input
            type="text"
            value={settings.fullName || settings.userName || 'Norbu'}
            onChange={(e) => updateSettings({ fullName: e.target.value })}
            placeholder="Norbu"
            className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756]"
          />
        </div>

        {/* What should Claude call you? */}
        <div className="space-y-1.5">
          <label className="block text-xs font-normal text-[#B4B3AD]">What should Claude call you?</label>
          <input
            type="text"
            value={settings.userName || 'Norbu'}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Norbu"
            className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756]"
          />
        </div>

        {/* What best describes your work? */}
        <div className="space-y-1.5">
          <label className="block text-xs font-normal text-[#B4B3AD]">What best describes your work?</label>
          <select
            value={settings.userRole || 'developer'}
            onChange={(e) => updateSettings({ userRole: e.target.value })}
            className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756]"
          >
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="student">Student</option>
            <option value="researcher">Researcher</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Instructions for Claude (matching Image 2) */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-normal text-[#B4B3AD]">Instructions for Claude</label>
          <p className="text-[11px] text-[#8C8A82] leading-relaxed">
            Claude will keep these in mind for this and any of your associated accounts across chats and Cowork within <span className="underline cursor-pointer">Anthropic's guidelines</span>. <span className="underline cursor-pointer">Learn more</span>
          </p>
          <textarea
            rows={4}
            value={settings.customInstructions || ''}
            onChange={(e) => updateSettings({ customInstructions: e.target.value })}
            placeholder="e.g. keep explanations brief and to the point"
            className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] p-3 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756] resize-none font-sans"
          />
        </div>
      </div>

      <div className="border-t border-[#22211F]" />

      {/* ─── Preferences Section (matching Image 2) ─── */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-[#ECEBE7]">Preferences</h3>

        {/* Appearance 3-icon button */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-normal text-[#B4B3AD]">Appearance</label>
          <div className="flex items-center p-1 rounded-xl bg-[#1C1B19] border border-[#2B2A27] gap-1">
            {[
              { id: 'system', label: 'System', icon: Monitor },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon }
            ].map((th) => {
              const Icon = th.icon;
              const isSelected = settings.theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => updateSettings({ theme: th.id as any })}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-[#2A2824] text-[#ECEBE7] shadow-xs'
                      : 'text-[#7E7C76] hover:text-[#ECEBE7]'
                  }`}
                  title={th.label}
                  aria-label={th.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat font dropdown */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-normal text-[#B4B3AD]">Chat font</label>
          <select
            value={settings.chatFont || 'serif'}
            onChange={(e) => updateSettings({ chatFont: e.target.value as any })}
            className="bg-[#1C1B19] text-xs text-[#ECEBE7] px-3 py-1.5 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756]"
          >
            <option value="serif">Anthropic Serif</option>
            <option value="sans">Sans</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Motion */}
        <div className="space-y-2">
          <label className="block text-xs font-normal text-[#B4B3AD]">Motion</label>
          <p className="text-[11px] text-[#8C8A82]">
            Control animation in streaming responses and other interface elements.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['system', 'reduced'].map((m) => (
              <button
                key={m}
                onClick={() => updateSettings({ motion: m as any })}
                className={`py-2 rounded-xl text-xs capitalize border transition-all ${
                  settings.motion === m
                    ? 'bg-[#2A2824] border-[#DA7756] text-[#ECEBE7] font-medium'
                    : 'bg-[#1C1B19] border-[#2B2A27] text-[#8C8A82] hover:text-[#ECEBE7]'
                }`}
              >
                {m === 'system' ? 'System Default' : 'Reduced Motion'}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Dictation */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#ECEBE7]">Voice input dictation</span>
              <p className="text-[11px] text-[#8C8A82]">Speech-to-text in chat composer</p>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceInputEnabled !== false}
              onChange={(e) => updateSettings({ voiceInputEnabled: e.target.checked })}
              className="accent-[#DA7756] w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#ECEBE7]">Read aloud speech</span>
              <p className="text-[11px] text-[#8C8A82]">Audio speaker icon under assistant messages</p>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceOutputEnabled !== false}
              onChange={(e) => updateSettings({ voiceOutputEnabled: e.target.checked })}
              className="accent-[#DA7756] w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
