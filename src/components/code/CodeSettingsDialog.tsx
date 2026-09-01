import React from 'react';
import { X, Settings, Check } from 'lucide-react';
import { CodeEditorSettings } from './types';

interface CodeSettingsDialogProps {
  settings: CodeEditorSettings;
  onUpdateSettings: (newSettings: Partial<CodeEditorSettings>) => void;
  onClose: () => void;
}

export const CodeSettingsDialog: React.FC<CodeSettingsDialogProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 text-xs text-[#ECEBE7]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262522]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#DA7756]" />
            <h3 className="text-sm font-semibold text-[#ECEBE7]">Code Editor Settings</h3>
          </div>
          <button onClick={onClose} className="text-[#8C8A82] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Font Size</p>
              <p className="text-[11px] text-[#8C8A82]">Editor code font size in pixels</p>
            </div>
            <div className="flex items-center gap-1 bg-[#141413] border border-[#2B2A27] rounded-xl p-0.5">
              {[12, 13, 14, 16].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    settings.fontSize === size
                      ? 'bg-[#2A2824] text-white font-semibold'
                      : 'text-[#8C8A82] hover:text-white'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Tab Indentation</p>
              <p className="text-[11px] text-[#8C8A82]">Number of spaces per tab</p>
            </div>
            <div className="flex items-center gap-1 bg-[#141413] border border-[#2B2A27] rounded-xl p-0.5">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ tabSize: size })}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                    settings.tabSize === size
                      ? 'bg-[#2A2824] text-white font-semibold'
                      : 'text-[#8C8A82] hover:text-white'
                  }`}
                >
                  {size} spaces
                </button>
              ))}
            </div>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Word Wrap</p>
              <p className="text-[11px] text-[#8C8A82]">Wrap long code lines in editor</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.wordWrap ? 'bg-[#DA7756]' : 'bg-[#2B2A27]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.wordWrap ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Line Numbers */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Line Numbers</p>
              <p className="text-[11px] text-[#8C8A82]">Show line number gutter</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ lineNumbers: !settings.lineNumbers })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.lineNumbers ? 'bg-[#DA7756]' : 'bg-[#2B2A27]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.lineNumbers ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#262522]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
