import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { UserSettings } from '../../types';

interface SettingsTabProps {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenUpgrade: () => void;
}

export const SettingsBilling: React.FC<SettingsTabProps> = ({ settings, updateSettings, onOpenUpgrade }) => {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-[#ECEBE7] mb-1">Billing & Plans</h3>
        <p className="text-xs text-[#8C8A82]">Manage plan subscriptions and high-throughput quotas.</p>
      </div>

      <div className="p-6 rounded-3xl bg-[#1C1B19] border-2 border-sky-800/50 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#ECEBE7]">Pro Plan</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-700/60 text-sky-400">
                Active
              </span>
            </div>
            <p className="text-xs text-[#8C8A82] mt-1">₹2,399 / month · Renews automatically</p>
          </div>
          <button
            onClick={onOpenUpgrade}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow transition-all"
          >
            Manage plan
          </button>
        </div>

        <div className="border-t border-[#242320] pt-4 space-y-2 text-xs text-[#B4B3AD]">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-sky-400" />
            <span>Full model suite access (Opus 5, Sonnet 5, Haiku 4.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-sky-400" />
            <span>Extended thinking & deep mathematical reasoning</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-sky-400" />
            <span>Sandboxed live React & HTML Artifacts</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#181816] border border-[#262522] flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-xs text-[#ECEBE7]">Need higher volume or Team seats?</span>
          <p className="text-[11px] text-[#8C8A82]">Explore Max tier or Team and Enterprise plans.</p>
        </div>
        <button
          onClick={onOpenUpgrade}
          className="flex items-center gap-1 text-xs text-[#DA7756] hover:underline font-medium"
        >
          <span>View all plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
