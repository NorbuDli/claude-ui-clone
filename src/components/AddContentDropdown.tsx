import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Camera,
  FolderPlus,
  Bookmark,
  Puzzle,
  Sparkles,
  Globe,
  ChevronRight,
  Check,
  Code2,
  FileText,
  Database,
  Search,
  Plus
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { Project } from '../types';

interface AddContentDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
  onScreenshotCapture: () => void;
}

export const AddContentDropdown: React.FC<AddContentDropdownProps> = ({
  isOpen,
  onClose,
  onUploadClick,
  onScreenshotCapture
}) => {
  const { projects, activeProject, setActiveProject } = useChat();
  const { setIsSettingsOpen } = useSettings();

  const [activeSubmenu, setActiveSubmenu] = useState<'project' | 'skills' | 'connector' | null>(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(true);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const [submenuSide, setSubmenuSide] = useState<'right' | 'left'>('right');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smart placement: check if it fits above, otherwise display below, and vice versa
  useEffect(() => {
    if (!isOpen) return;

    const calculatePosition = () => {
      if (!dropdownRef.current) return;
      const parentEl = dropdownRef.current.parentElement;
      const rect = parentEl?.getBoundingClientRect() || dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight || 320;

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // If it doesn't fit on top and there's more space below, display below (and vice versa)
      if (spaceAbove < dropdownHeight + 16 && spaceBelow > spaceAbove) {
        setPlacement('bottom');
      } else {
        setPlacement('top');
      }

      // Check horizontal room for submenus
      if (window.innerWidth - (rect.left + 260) < 240) {
        setSubmenuSide('left');
      } else {
        setSubmenuSide('right');
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
        setActiveSubmenu(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectProject = (proj: Project) => {
    setActiveProject(proj);
    onClose();
    setActiveSubmenu(null);
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute left-0 w-64 bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 duration-75 select-none text-xs text-[#ECEBE7] ${
        placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Add files or photos */}
      <button
        type="button"
        onClick={() => {
          onUploadClick();
          onClose();
        }}
        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <Paperclip className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
          <span>Add files or photos</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#7E7C76] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-[#252422] border border-[#33312E]">Ctrl</span>
          <span className="px-1.5 py-0.5 rounded bg-[#252422] border border-[#33312E]">U</span>
        </div>
      </button>

      {/* 2. Take a screenshot */}
      <button
        type="button"
        onClick={() => {
          onScreenshotCapture();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
      >
        <Camera className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
        <span>Take a screenshot</span>
      </button>

      {/* 3. Add to project (with submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('project')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div
          onClick={() => setActiveSubmenu(activeSubmenu === 'project' ? null : 'project')}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
            <span>Add to project</span>
          </div>
          <div className="flex items-center gap-1 text-[#8C8A82]">
            {activeProject && <span className="text-[10px] text-[#DA7756] truncate max-w-[70px]">{activeProject.name}</span>}
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Project Submenu */}
        {activeSubmenu === 'project' && (
          <div
            className={`absolute w-56 bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150 space-y-0.5 ${
              placement === 'bottom' ? 'top-0' : 'bottom-0'
            } ${submenuSide === 'left' ? 'right-full mr-2' : 'left-full ml-2'}`}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7E7C76]">
              Choose Project
            </div>
            {projects.length === 0 ? (
              <div className="p-2 text-[11px] text-[#7E7C76] text-center">
                No projects created yet
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                    activeProject?.id === proj.id
                      ? 'bg-[#262522] text-[#ECEBE7] font-medium'
                      : 'hover:bg-[#23221F] text-[#B4B3AD] hover:text-[#ECEBE7]'
                  }`}
                >
                  <span className="truncate">{proj.name}</span>
                  {activeProject?.id === proj.id && <Check className="w-3.5 h-3.5 text-[#DA7756]" />}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#2A2926] my-1" />

      {/* 4. Skills (with submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('skills')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div
          onClick={() => setActiveSubmenu(activeSubmenu === 'skills' ? null : 'skills')}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
            <span>Skills</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#8C8A82]" />
        </div>

        {/* Skills Submenu */}
        {activeSubmenu === 'skills' && (
          <div
            className={`absolute w-56 bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150 space-y-0.5 ${
              placement === 'bottom' ? 'top-0' : 'bottom-0'
            } ${submenuSide === 'left' ? 'right-full mr-2' : 'left-full ml-2'}`}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7E7C76]">
              Active Skills
            </div>
            {[
              { label: 'Code Execution & Artifacts', active: true },
              { label: 'Deep Technical Analysis', active: true },
              { label: 'Mathematical Derivation', active: true },
              { label: 'Interactive UI Generation', active: true }
            ].map((skill, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] text-xs text-[#ECEBE7]"
              >
                <span>{skill.label}</span>
                <Check className="w-3.5 h-3.5 text-sky-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Add connector (with submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('connector')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div
          onClick={() => setActiveSubmenu(activeSubmenu === 'connector' ? null : 'connector')}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Puzzle className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
            <span>Add connector</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#8C8A82]" />
        </div>

        {/* Connector Submenu */}
        {activeSubmenu === 'connector' && (
          <div
            className={`absolute w-52 bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150 space-y-0.5 ${
              placement === 'bottom' ? 'top-0' : 'bottom-0'
            } ${submenuSide === 'left' ? 'right-full mr-2' : 'left-full ml-2'}`}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7E7C76]">
              Available Connectors
            </div>
            {['GitHub Repo', 'Google Drive', 'Notion Workspace', 'Figma Files', 'Slack Channels'].map((c, i) => (
              <div
                key={i}
                onClick={() => {
                  alert(`Connecting to ${c}...`);
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] cursor-pointer text-xs text-[#B4B3AD] hover:text-[#ECEBE7]"
              >
                <span>{c}</span>
                <Plus className="w-3 h-3 text-[#7E7C76]" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Add plugins... */}
      <button
        type="button"
        onClick={() => {
          setIsSettingsOpen(true);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
      >
        <Sparkles className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
        <span>Add plugins...</span>
      </button>

      <div className="border-t border-[#2A2926] my-1" />

      {/* 7. Web search (toggleable with blue checkmark matching screenshot 1) */}
      <button
        type="button"
        onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
          <span>Web search</span>
        </div>
        {isWebSearchEnabled && (
          <Check className="w-4 h-4 text-sky-400 stroke-[2.5]" />
        )}
      </button>

    </div>
  );
};
