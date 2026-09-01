import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Settings,
  User,
  Shield,
  CreditCard,
  Sliders,
  Clock,
  Code2,
  Brain,
  Sparkles,
  Layers
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useChat } from '../context/ChatContext';
import { ClaudeCustomizeIcon } from './ClaudeIcons';

// Extracted settings tab components
import { SettingsGeneral } from './settings/SettingsGeneral';
import { SettingsAccount } from './settings/SettingsAccount';
import { SettingsPrivacy } from './settings/SettingsPrivacy';
import { SettingsBilling } from './settings/SettingsBilling';
import { SettingsCapabilities } from './settings/SettingsCapabilities';
import { SettingsTimeFocus } from './settings/SettingsTimeFocus';
import { SettingsCode } from './settings/SettingsCode';
import { SettingsMemory } from './settings/SettingsMemory';

type SettingsTab =
  | 'general'
  | 'account'
  | 'privacy'
  | 'billing'
  | 'capabilities'
  | 'memory'
  | 'reflect'
  | 'time-focus'
  | 'code';

interface SearchResultItem {
  tab: SettingsTab;
  title: string;
  category: string;
  snippet: string;
}

const SETTINGS_TABS = [
  { id: 'general' as const, label: 'General', icon: Settings },
  { id: 'account' as const, label: 'Account', icon: User },
  { id: 'privacy' as const, label: 'Privacy', icon: Shield },
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  { id: 'capabilities' as const, label: 'Capabilities', icon: Sliders },
  { id: 'memory' as const, label: 'Memory', icon: Brain },
  { id: 'reflect' as const, label: 'Reflect', icon: Sparkles },
  { id: 'time-focus' as const, label: 'Time and focus', icon: Clock },
  { id: 'code' as const, label: 'Claude Code', icon: Code2 }
];

export const CustomizeModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings } = useSettings();
  const { clearAllConversations, setActivePageView } = useChat();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, setIsSettingsOpen]);

  // Searchable index
  const searchableIndex = useMemo<SearchResultItem[]>(() => [
    { tab: 'general', title: 'Profile & Full Name', category: 'General', snippet: 'Set your name, what Claude calls you, and role' },
    { tab: 'general', title: 'Instructions for Claude', category: 'General', snippet: 'System preferences and custom behavior instructions' },
    { tab: 'general', title: 'Appearance & Theme', category: 'General', snippet: 'Dark mode, light mode, and system theme selection' },
    { tab: 'general', title: 'Chat Font', category: 'General', snippet: 'Anthropic Serif, Sans, and System fonts' },
    { tab: 'general', title: 'Motion & Animations', category: 'General', snippet: 'System motion or reduced motion transitions' },
    { tab: 'account', title: 'Account & Sessions', category: 'Account', snippet: 'Active browser sessions, devices, and logout' },
    { tab: 'privacy', title: 'Privacy & Data Controls', category: 'Privacy', snippet: 'Data retention, location metadata, and model improvement' },
    { tab: 'billing', title: 'Plan & Billing', category: 'Billing', snippet: 'Pro plan active status, usage limits, and tier upgrades' },
    { tab: 'capabilities', title: 'Tool Access Mode', category: 'Capabilities', snippet: 'Load tools when needed, always available, or disabled' },
    { tab: 'memory', title: 'Long-term Memory', category: 'Memory', snippet: 'Saved facts, remembered user preferences, and memory management' },
    { tab: 'time-focus', title: 'Break Reminders', category: 'Time and focus', snippet: 'Configurable break interval and snooze duration' },
    { tab: 'code', title: 'Claude Code Settings', category: 'Claude Code', snippet: 'Developer environment, syntax themes, and integration' }
  ], []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchableIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery, searchableIndex]);

  if (!isSettingsOpen) return null;

  const handleOpenUpgrade = () => {
    setIsSettingsOpen(false);
    setActivePageView('upgrade');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'general':
        return <SettingsGeneral settings={settings} updateSettings={updateSettings} />;
      case 'account':
        return (
          <SettingsAccount
            settings={settings}
            updateSettings={updateSettings}
            clearAllConversations={clearAllConversations}
            setActivePageView={setActivePageView}
          />
        );
      case 'privacy':
        return <SettingsPrivacy settings={settings} updateSettings={updateSettings} />;
      case 'billing':
        return (
          <SettingsBilling
            settings={settings}
            updateSettings={updateSettings}
            onOpenUpgrade={handleOpenUpgrade}
          />
        );
      case 'capabilities':
        return <SettingsCapabilities settings={settings} updateSettings={updateSettings} />;
      case 'memory':
        return <SettingsMemory settings={settings} updateSettings={updateSettings} />;
      case 'reflect':
        return (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-semibold text-[#ECEBE7]">Reflect</h3>
            <p className="text-xs text-[#8C8A82] leading-relaxed">
              Reflect allows Claude to review previous conversations to provide personalized contextual continuity.
            </p>
            <div className="p-4 rounded-xl bg-[#1C1B19] border border-[#2B2A27] text-xs text-[#B4B3AD]">
              Personalized reflection enabled across your active chats.
            </div>
          </div>
        );
      case 'time-focus':
        return <SettingsTimeFocus settings={settings} updateSettings={updateSettings} />;
      case 'code':
        return <SettingsCode settings={settings} updateSettings={updateSettings} />;
      default:
        return <SettingsGeneral settings={settings} updateSettings={updateSettings} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 duration-75"
      onClick={() => setIsSettingsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="w-full max-w-4xl h-[680px] max-h-[90vh] bg-[#141413] border border-[#262522] rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none duration-75"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 border-b border-[#22211F] px-6 flex items-center justify-between bg-[#161514] shrink-0">
          <div className="flex items-center gap-3 w-80">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#7E7C76] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] placeholder-[#706E68] pl-8 pr-3 py-1.5 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#706E68] hidden sm:inline">Esc to close</span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-1.5 rounded-xl text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#22211F] transition-colors"
              title="Close Settings"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left Navigation */}
          <nav
            className="w-52 shrink-0 bg-[#161514] border-r border-[#22211F] p-2.5 flex flex-col justify-between overflow-y-auto"
            aria-label="Settings navigation"
          >
            {searchQuery.trim() ? (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-[#706E68] uppercase px-2.5 py-1">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab(res.tab);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#201F1D] text-xs transition-colors"
                  >
                    <div className="font-medium text-[#ECEBE7] truncate">{res.title}</div>
                    <div className="text-[10px] text-[#7E7C76] truncate">{res.category}</div>
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <div className="p-4 text-center text-xs text-[#706E68]">
                    No settings matching "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-[#706E68] uppercase px-2.5 py-1 tracking-wider">
                    Settings
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {SETTINGS_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-all text-left ${
                            isActive
                              ? 'bg-[#262522] text-[#ECEBE7] font-medium shadow-sm'
                              : 'text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#1E1D1B]'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#DA7756]' : 'text-[#7E7C76]'}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Customize Navigation Button (matching Image 2) */}
            <div className="pt-2 mt-auto border-t border-[#201F1D]">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setActivePageView('customize');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#1E1D1B] transition-all text-left group"
              >
                <ClaudeCustomizeIcon size={14} color="#7E7C76" className="group-hover:text-[#DA7756] transition-colors" />
                <span className="font-normal text-[#B4B3AD] group-hover:text-[#ECEBE7]">Customize</span>
              </button>
            </div>
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-[#141413]">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
};
