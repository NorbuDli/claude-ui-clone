import React from 'react';
import { UserSettings } from '../../types';

interface SettingsTabProps {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsCode: React.FC<SettingsTabProps> = ({ settings, updateSettings }) => {
  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-[#ECEBE7] mb-1">Claude Code</h3>
        <p className="text-xs text-[#8C8A82]">Developer environment, code fonts, syntax themes, and PR options.</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Session settings</h4>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1B19] border border-[#2B2A27]">
          <div>
            <span className="text-xs font-medium text-[#ECEBE7]">Classify session states</span>
            <p className="text-[11px] text-[#8C8A82]">Classify sessions as Blocked, Ready for Review, or Done</p>
          </div>
          <input
            type="checkbox"
            checked={settings.codeSettings.classifySessionStates}
            onChange={(e) =>
              updateSettings({
                codeSettings: { ...settings.codeSettings, classifySessionStates: e.target.checked }
              })
            }
            className="w-4 h-4 accent-[#DA7756]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Code appearance</h4>

        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() =>
              updateSettings({ codeSettings: { ...settings.codeSettings, codeTheme: 'dark' } })
            }
            className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${
              settings.codeSettings.codeTheme === 'dark'
                ? 'border-[#DA7756] bg-[#1C1B19]'
                : 'border-[#2B2A27] bg-[#141413] hover:border-[#383632]'
            }`}
          >
            <div className="text-xs font-semibold mb-2">Claude Dark</div>
            <div className="bg-[#121110] p-2.5 rounded-lg font-mono text-[10px] space-y-1 text-neutral-300">
              <div><span className="text-purple-400">const</span> <span className="text-blue-400">sum</span> = (a, b) =&gt; &#123;</div>
              <div className="pl-3 text-emerald-400">return a + b;</div>
              <div>&#125;;</div>
            </div>
          </div>

          <div
            onClick={() =>
              updateSettings({ codeSettings: { ...settings.codeSettings, codeTheme: 'monokai' } })
            }
            className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${
              settings.codeSettings.codeTheme === 'monokai'
                ? 'border-[#DA7756] bg-[#1C1B19]'
                : 'border-[#2B2A27] bg-[#141413] hover:border-[#383632]'
            }`}
          >
            <div className="text-xs font-semibold mb-2">Monokai Pro</div>
            <div className="bg-[#1f1d1b] p-2.5 rounded-lg font-mono text-[10px] space-y-1 text-neutral-300">
              <div><span className="text-pink-400">const</span> <span className="text-yellow-300">sum</span> = (a, b) =&gt; &#123;</div>
              <div className="pl-3 text-green-400">return a + b;</div>
              <div>&#125;;</div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#B4B3AD]">Code font</label>
          <input
            type="text"
            value={settings.codeSettings.codeFont}
            onChange={(e) =>
              updateSettings({
                codeSettings: { ...settings.codeSettings, codeFont: e.target.value }
              })
            }
            placeholder="e.g. JetBrains Mono, Fira Code"
            className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#B4B3AD]">Transcript text size</label>
            <select
              value={settings.codeSettings.transcriptTextSize}
              onChange={(e) =>
                updateSettings({
                  codeSettings: { ...settings.codeSettings, transcriptTextSize: e.target.value as any }
                })
              }
              className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#B4B3AD]">Transcript width</label>
            <select
              value={settings.codeSettings.transcriptWidth}
              onChange={(e) =>
                updateSettings({
                  codeSettings: { ...settings.codeSettings, transcriptWidth: e.target.value as any }
                })
              }
              className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none"
            >
              <option value="narrow">Narrow</option>
              <option value="medium">Medium</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Pull requests</h4>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#B4B3AD]">Branch prefix</label>
          <input
            type="text"
            value={settings.codeSettings.branchPrefix}
            onChange={(e) =>
              updateSettings({
                codeSettings: { ...settings.codeSettings, branchPrefix: e.target.value }
              })
            }
            placeholder="e.g. norbu"
            className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] px-3.5 py-2 rounded-xl border border-[#2B2A27] focus:outline-none font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#ECEBE7]">Connected code instances</h4>
        <div className="p-4 rounded-2xl bg-[#1C1B19] border border-[#2B2A27] text-center text-xs text-[#706E68]">
          No connected code instances
        </div>
      </div>
    </div>
  );
};
