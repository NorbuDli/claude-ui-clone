import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Info
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { ThinkingEffort, ModelOption } from '../types';
import { PRIMARY_MODELS, MORE_MODELS, ALL_MODELS } from '../services/mockData';

export const ModelSelectorDropdown: React.FC = () => {
  const { selectedModel, setSelectedModel, setActivePageView } = useChat();
  const { settings, updateSettings } = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'effort' | 'more-models' | null>(null);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const effortTimerRef = useRef<any>(null);
  const moreTimerRef = useRef<any>(null);

  const currentModel = ALL_MODELS.find((m) => m.id === selectedModel) || PRIMARY_MODELS[2]; // default Sonnet 5

  // Smart placement calculation
  useEffect(() => {
    if (!isOpen) return;

    const calculatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = 360;

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // If it doesn't fit on top and there's more space below, display below (and vice versa)
      if (spaceAbove < dropdownHeight + 16 && spaceBelow > spaceAbove) {
        setPlacement('bottom');
      } else {
        setPlacement('top');
      }
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectModel = (model: ModelOption) => {
    if (model.requiresUpgrade) {
      setActivePageView('upgrade');
      setIsOpen(false);
      return;
    }
    setSelectedModel(model.id);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const handleSelectEffort = (effort: ThinkingEffort) => {
    updateSettings({ thinkingEffort: effort });
    setActiveSubmenu(null);
    setIsOpen(false);
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePageView('upgrade');
    setIsOpen(false);
  };

  const effortLabel = () => {
    const eff = settings.thinkingEffort || 'medium';
    switch (eff) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'extra':
        return 'Extra';
      case 'max':
        return 'Max';
      default:
        return 'Medium';
    }
  };

  return (
    <div className="relative inline-block text-left select-none" ref={dropdownRef}>
      
      {/* 1. TRIGGER BUTTON INSIDE COMPOSER */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveSubmenu(null);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-transparent hover:bg-[#242320] text-xs font-normal text-[#9C9A92] hover:text-[#ECEBE7] transition-all border border-transparent hover:border-[#2D2C28]"
      >
        <span className="font-medium text-[#ECEBE7]">{currentModel.shortName}</span>
        {currentModel.supportsThinking && settings.thinkingEnabled !== false && (
          <span className="text-[11px] text-[#706E68] capitalize font-normal">
            {effortLabel()}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-[#706E68]" />
      </button>

      {/* 2. MAIN DROPDOWN POPOVER */}
      {isOpen && (
        <div
          className={`absolute right-0 w-[280px] bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-[#ECEBE7] animate-in fade-in zoom-in-95 duration-100 ${
            placement === 'bottom' ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
          }`}
        >
          
          {/* PRIMARY MODELS LIST */}
          <div className="space-y-0.5">
            {PRIMARY_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;

              return (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors group ${
                    isSelected
                      ? 'bg-[#262522] text-[#ECEBE7]'
                      : 'hover:bg-[#22211F] text-[#ECEBE7]'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs text-[#ECEBE7]">
                        {model.name}
                      </span>
                      {model.isPro && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-sky-950/70 border border-sky-800/60 text-sky-400">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8C8A82] leading-tight">
                      {model.description}
                    </p>
                  </div>

                  {/* Right Action: Checkmark or Upgrade Button */}
                  <div className="shrink-0 flex items-center">
                    {model.requiresUpgrade ? (
                      <button
                        type="button"
                        onClick={handleUpgradeClick}
                        className="px-2 py-0.5 rounded-lg border border-[#383632] hover:border-[#4A4742] hover:bg-[#282724] text-[10px] text-[#B4B3AD] hover:text-[#ECEBE7] font-medium transition-colors"
                      >
                        Upgrade
                      </button>
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DIVIDER */}
          <div className="border-t border-[#262522] my-1" />

          {/* EFFORT ROW */}
          <div
            className="relative"
            onMouseEnter={() => {
              clearTimeout(effortTimerRef.current);
              setActiveSubmenu('effort');
            }}
            onMouseLeave={() => {
              effortTimerRef.current = setTimeout(() => {
                setActiveSubmenu((prev) => (prev === 'effort' ? null : prev));
              }, 200);
            }}
          >
            <div
              onClick={() => setActiveSubmenu(activeSubmenu === 'effort' ? null : 'effort')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                activeSubmenu === 'effort' ? 'bg-[#22211F] text-[#ECEBE7]' : 'hover:bg-[#22211F] text-[#9C9A92] hover:text-[#ECEBE7]'
              }`}
            >
              <span className="text-xs">Effort</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[#8C8A82] capitalize">
                  {effortLabel()}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#706E68]" />
              </div>
            </div>

            {/* EFFORT SUBMENU PANEL */}
            {activeSubmenu === 'effort' && (
              <div
                className={`absolute right-full mr-1.5 w-[260px] bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 space-y-2 select-none ${
                  placement === 'bottom' ? 'top-0' : 'bottom-0'
                }`}
                onMouseEnter={() => clearTimeout(effortTimerRef.current)}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Explanation */}
                <p className="text-[11px] text-[#8C8A82] leading-relaxed px-1">
                  Higher effort means more thorough responses, but takes longer and uses your limits faster.
                </p>

                {/* Effort Levels List (No Off button!) */}
                <div className="space-y-0.5">
                  {[
                    { id: 'low', label: 'Low' },
                    { id: 'medium', label: 'Medium', isDefault: true },
                    { id: 'high', label: 'High' },
                    { id: 'extra', label: 'Extra' },
                    { id: 'max', label: 'Max', hasInfo: true }
                  ].map((item) => {
                    const isSelected = (settings.thinkingEffort || 'medium') === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectEffort(item.id as ThinkingEffort)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'text-[#ECEBE7] font-medium bg-[#242320]'
                            : 'text-[#9C9A92] hover:bg-[#22211F] hover:text-[#ECEBE7]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {item.isDefault && (
                            <span className="text-[10px] text-[#706E68] bg-[#242320] border border-[#33312E] px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                          {item.hasInfo && (
                            <Info className="w-3 h-3 text-[#706E68]" />
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Divider */}
                <div className="border-t border-[#262522] my-1" />

                {/* Thinking Toggle Switch */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-[#ECEBE7]">Thinking</div>
                    <p className="text-[11px] text-[#8C8A82]">Can think for more complex tasks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ thinkingEnabled: settings.thinkingEnabled === false ? true : false })}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      settings.thinkingEnabled !== false ? 'bg-sky-600' : 'bg-[#2E2D2A]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.thinkingEnabled !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MORE MODELS ROW */}
          <div
            className="relative"
            onMouseEnter={() => {
              clearTimeout(moreTimerRef.current);
              setActiveSubmenu('more-models');
            }}
            onMouseLeave={() => {
              moreTimerRef.current = setTimeout(() => {
                setActiveSubmenu((prev) => (prev === 'more-models' ? null : prev));
              }, 200);
            }}
          >
            <div
              onClick={() => setActiveSubmenu(activeSubmenu === 'more-models' ? null : 'more-models')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                activeSubmenu === 'more-models' ? 'bg-[#22211F] text-[#ECEBE7]' : 'hover:bg-[#22211F] text-[#9C9A92] hover:text-[#ECEBE7]'
              }`}
            >
              <span className="text-xs">More models</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#706E68]" />
            </div>

            {/* MORE MODELS NESTED SUBMENU */}
            {activeSubmenu === 'more-models' && (
              <div
                className={`absolute right-full mr-1.5 w-[220px] bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                  placement === 'bottom' ? 'top-0' : 'bottom-0'
                }`}
                onMouseEnter={() => clearTimeout(moreTimerRef.current)}
              >
                <div className="space-y-0.5">
                  {MORE_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;

                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors group ${
                          isSelected
                            ? 'bg-[#262522] text-[#ECEBE7]'
                            : 'hover:bg-[#22211F] text-[#ECEBE7]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-xs text-[#ECEBE7]">
                            {model.name}
                          </span>
                          {model.isPro && (
                            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-sky-950/70 border border-sky-800/60 text-sky-400">
                              Pro
                            </span>
                          )}
                        </div>

                        {/* Checkmark if selected */}
                        {isSelected && (
                          <Check className="w-3 h-3 text-sky-400 stroke-[2.5]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER NOTICE (matching screenshot) */}
          <div className="px-3 py-2 border-t border-[#262522] text-[11px] text-[#706E68] leading-tight">
            Fable 5 is included in Max plans, or available with usage credits on Pro.{' '}
            <span
              onClick={() => {
                setActivePageView('upgrade');
                setIsOpen(false);
              }}
              className="text-[#8C8A82] hover:text-[#ECEBE7] underline cursor-pointer"
            >
              Learn more
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
