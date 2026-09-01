import React, { useState, useMemo } from 'react';
import { ClaudeStarburst } from './ClaudeIcons';
import { ChatInput } from './ChatInput';
import { useSettings } from '../context/SettingsContext';
import { useChat } from '../context/ChatContext';
import { PROMPT_STARTERS } from '../services/mockData';
import { Sparkles, ArrowRight, X, GraduationCap, PenLine, Code2, Coffee, Lightbulb, PanelLeftOpen } from 'lucide-react';

interface LandingViewProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const { settings } = useSettings();
  const { sendMessage, setActivePageView } = useChat();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = settings.userName || 'Norbu';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Afternoon, ${name}`;
    return `Evening, ${name}`;
  }, [settings.userName]);

  const categories = [
    { id: 'learn', label: 'Learn', icon: GraduationCap },
    { id: 'write', label: 'Write', icon: PenLine },
    { id: 'code', label: 'Code', icon: Code2 },
    { id: 'life', label: 'Life stuff', icon: Coffee },
    { id: 'choice', label: "Claude's choice", icon: Lightbulb }
  ];

  const currentCategoryTemplates = PROMPT_STARTERS.filter(
    (item) => item.category === activeCategory
  );

  const handleSelectPrompt = (promptText: string) => {
    sendMessage(promptText);
    setActiveCategory(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] select-none relative overflow-y-auto">
      
      {/* Top Left Sidebar Toggle Button when Collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="fixed left-4 top-4 z-30 p-2 rounded-xl bg-[#1C1B19] hover:bg-[#242320] border border-[#2B2A27] text-[#8C8A82] hover:text-[#ECEBE7] shadow-lg transition-all"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* TOP CENTER PLAN INDICATOR */}
      <div className="pt-6 pb-2 flex items-center justify-center shrink-0">
        <button
          onClick={() => setActivePageView('upgrade')}
          className="flex items-center gap-1.5 text-xs text-[#8C8A82] hover:text-[#ECEBE7] transition-colors"
        >
          <span className="text-[#ECEBE7] font-medium">Pro plan</span>
          <span className="text-[#3B82F6] hover:underline font-normal">· Upgrade</span>
        </button>
      </div>

      {/* CENTERED CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-3xl mx-auto w-full my-auto">
        
        {/* Center Greeting & Logo (matching Image 2) */}
        <div className="flex items-center gap-3.5 mb-8">
          <ClaudeStarburst size={38} color="#DA7756" />
          <h1 className="font-serif text-3xl sm:text-4xl text-[#ECEBE7] font-normal tracking-tight">
            {greeting}
          </h1>
        </div>

        {/* Centered Chat Composer */}
        <div className="w-full mb-4">
          <ChatInput />
        </div>

        {/* Prompt Starter Chips (matching Image 2) */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-[#2A2824] border-[#DA7756]/50 text-[#ECEBE7] shadow-sm'
                    : 'bg-[#1C1B19]/80 hover:bg-[#242320] border-[#2B2A27] text-[#9C9A92] hover:text-[#ECEBE7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#9C9A92]" />
                <span className="font-normal">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Suggestion Templates Flyout */}
        {activeCategory && (
          <div className="mt-4 w-full max-w-2xl bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 relative">
            <div className="flex items-center justify-between pb-2 border-b border-[#262522] mb-3">
              <span className="text-xs font-semibold text-[#ECEBE7] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#DA7756]" />
                Prompts for {categories.find((c) => c.id === activeCategory)?.label}
              </span>
              <button
                onClick={() => setActiveCategory(null)}
                className="text-[#7E7C76] hover:text-[#ECEBE7] p-1 rounded-md hover:bg-[#242320]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentCategoryTemplates.map((template, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPrompt(template.prompt)}
                  className="group p-3 rounded-xl bg-[#141413] border border-[#262522] hover:border-[#DA7756]/60 hover:bg-[#201F1D] cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-medium text-[#ECEBE7] group-hover:text-[#DA7756] transition-colors leading-snug">
                      {template.title}
                    </h4>
                    <p className="text-[11px] text-[#7E7C76] mt-1 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-end text-[11px] text-[#8C8A82] group-hover:text-[#DA7756] mt-2 pt-2 border-t border-[#22211F]">
                    <span className="font-medium mr-1">Use prompt</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
