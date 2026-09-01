import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Search,
  Download,
  Trash2,
  Edit2,
  Star,
  Check,
  X,
  Settings,
  Globe,
  HelpCircle,
  ArrowUpCircle,
  GraduationCap,
  LogOut,
  PanelLeftClose,
  Sparkles,
  FolderKanban,
  Code2,
  Sliders,
  SlidersHorizontal,
  MoreHorizontal,
  Palette
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Conversation } from '../types';
import { ClaudeProjectsIcon, ClaudeArtifactsIcon, ClaudeCustomizeIcon, ClaudeNewChatIcon, ClaudeCodeIcon } from './ClaudeIcons';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onOpenSearch }) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    activePageView,
    setActivePageView,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    toggleStarConversation,
    projects,
    activeProject,
    setActiveProject
  } = useChat();

  const { settings, setIsSettingsOpen } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState<boolean>(true);
  const [isChatsExpanded, setIsChatsExpanded] = useState<boolean>(true);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setContextMenuChatId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Standalone conversations (not belonging to any project)
  const standaloneConversations = conversations.filter((c) =>
    !c.projectId && c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleNewChatClick = () => {
    createNewConversation();
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleNavClick = (view: any) => {
    setActivePageView(view);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const startEditing = (chat: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
    setContextMenuChatId(null);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-[270px] bg-[#141413] border-r border-[#1f1e1c] transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:shrink-0 ${isOpen ? 'md:translate-x-0' : 'md:-translate-x-full md:w-0 md:border-0 md:overflow-hidden'}`}
      >
        {/* ─── Top Brand Header (matching Image 1) ─── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
          <button
            onClick={handleNewChatClick}
            className="font-serif text-[23px] font-medium text-[#ECEBE7] hover:text-white tracking-tight text-left cursor-pointer transition-colors focus:outline-none"
            aria-label="New chat"
            title="Start new chat"
          >
            Claude
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201f1d] transition-colors"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* ─── New Chat Button ─── */}
        <div className="px-3 mb-1">
          <button
            onClick={handleNewChatClick}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-normal transition-all group ${
              activePageView === 'chat' && !activeConversationId
                ? 'bg-[#282724] text-[#FFFFFF] font-medium'
                : 'text-[#E2E1DD] hover:bg-[#1E1D1B] hover:text-[#FFFFFF]'
            }`}
            aria-label="Start new conversation"
          >
            <ClaudeNewChatIcon size={21} />
            <span>New chat</span>
          </button>
        </div>

        {/* ─── Primary Navigation (matching Image 1) ─── */}
        <nav className="px-3 space-y-0.5 mb-2.5 text-[14.5px]" aria-label="Primary navigation">
          <button
            onClick={() => handleNavClick('projects')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-colors ${
              activePageView === 'projects'
                ? 'bg-[#282724] text-[#FFFFFF] font-medium'
                : 'text-[#E2E1DD] hover:text-[#FFFFFF] hover:bg-[#1E1D1B]'
            }`}
            aria-current={activePageView === 'projects' ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <ClaudeProjectsIcon
                size={20}
                color={activePageView === 'projects' ? '#DA7756' : '#A5A39C'}
              />
              <span>Projects</span>
            </div>
          </button>

          <button
            onClick={() => handleNavClick('artifacts')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-colors ${
              activePageView === 'artifacts'
                ? 'bg-[#282724] text-[#FFFFFF] font-medium'
                : 'text-[#E2E1DD] hover:text-[#FFFFFF] hover:bg-[#1E1D1B]'
            }`}
            aria-current={activePageView === 'artifacts' ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <ClaudeArtifactsIcon
                size={20}
                color={activePageView === 'artifacts' ? '#DA7756' : '#A5A39C'}
              />
              <span>Artifacts</span>
            </div>
          </button>

          <button
            onClick={() => handleNavClick('code')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-colors ${
              activePageView === 'code'
                ? 'bg-[#282724] text-[#FFFFFF] font-medium'
                : 'text-[#E2E1DD] hover:text-[#FFFFFF] hover:bg-[#1E1D1B]'
            }`}
            aria-current={activePageView === 'code' ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <ClaudeCodeIcon
                size={20}
                color={activePageView === 'code' ? '#DA7756' : '#A5A39C'}
              />
              <span>Code</span>
            </div>
          </button>

          <button
            onClick={() => handleNavClick('customize')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-colors ${
              activePageView === 'customize'
                ? 'bg-[#282724] text-[#FFFFFF] font-medium'
                : 'text-[#E2E1DD] hover:text-[#FFFFFF] hover:bg-[#1E1D1B]'
            }`}
            aria-current={activePageView === 'customize' ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <ClaudeCustomizeIcon
                size={20}
                color={activePageView === 'customize' ? '#DA7756' : '#A5A39C'}
              />
              <span>Customize</span>
            </div>
          </button>
        </nav>

        {/* ─── Dynamic Projects Section (matching reference images) ─── */}
        {projects && projects.length > 0 && (
          <div className="px-3 mb-2.5">
            <div className="flex items-center justify-between px-1.5 py-1 text-xs text-[#8C8A82]">
              <button
                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                className="flex items-center gap-1.5 font-medium text-[13px] text-[#8C8A82] hover:text-[#ECEBE7] transition-colors select-none"
              >
                <span>Projects</span>
                {isProjectsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C8A82]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C8A82]" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                {isProjectsExpanded && (
                  <button
                    onClick={() => {
                      setActiveProject(null);
                      setActivePageView('projects');
                    }}
                    className="p-1 rounded hover:text-[#ECEBE7] text-[#8C8A82] transition-colors"
                    title="View all projects"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveProject(null);
                    setActivePageView('projects');
                  }}
                  className="p-1 rounded hover:text-[#ECEBE7] text-[#8C8A82] transition-colors"
                  title="Create or view projects"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {isProjectsExpanded && (
              <div className="space-y-1 mt-0.5 animate-in fade-in duration-100">
                {projects.map((proj) => {
                  const projectChats = conversations.filter((c) => c.projectId === proj.id);
                  const isProjActive = activePageView === 'projects' && activeProject?.id === proj.id;

                  return (
                    <div key={proj.id} className="space-y-0.5">
                      <button
                        onClick={() => {
                          setActiveProject(proj);
                          setActivePageView('projects');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] text-left transition-colors ${
                          isProjActive
                            ? 'bg-[#282724] text-[#FFFFFF] font-medium'
                            : 'text-[#E2E1DD] hover:bg-[#1E1D1B] hover:text-[#FFFFFF]'
                        }`}
                      >
                        <ClaudeProjectsIcon size={16} color="#A5A39C" className="shrink-0" />
                        <span className="truncate">{proj.name}</span>
                      </button>

                      {/* Nested Project Chats Tree */}
                      {projectChats.length > 0 && (
                        <div className="ml-4 pl-3.5 border-l border-[#2B2A27] space-y-0.5 py-0.5">
                          {projectChats.map((chat) => {
                            const isChatActive = activePageView === 'chat' && chat.id === activeConversationId;
                            const isContextOpen = contextMenuChatId === chat.id;

                            return (
                              <div
                                key={chat.id}
                                onClick={() => handleSelectConversation(chat.id)}
                                className={`group relative flex items-center justify-between py-1.5 px-2 rounded-lg text-[13.5px] transition-colors cursor-pointer ${
                                  isChatActive
                                    ? 'text-[#FFFFFF] font-medium bg-[#282724]'
                                    : 'text-[#C4C3BE] hover:text-[#FFFFFF] hover:bg-[#1E1D1B]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden mr-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full border-[1.6px] shrink-0 transition-colors ${
                                    isChatActive
                                      ? 'border-[#B4B3AD] bg-[#B4B3AD]/40'
                                      : 'border-[#5E5C56]'
                                  }`} />
                                  <span className="truncate">{chat.title}</span>
                                </div>

                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setContextMenuChatId(isContextOpen ? null : chat.id);
                                    }}
                                    className="p-1 rounded text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#2D2C28]"
                                    aria-label="More actions"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {isContextOpen && (
                                  <div
                                    ref={contextMenuRef}
                                    className="absolute right-2 top-8 w-36 bg-[#1C1B19] border border-[#2E2D2A] rounded-xl shadow-2xl p-1 z-50 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                    role="menu"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStarConversation(chat.id);
                                        setContextMenuChatId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#23221F] text-left text-[#ECEBE7]"
                                      role="menuitem"
                                    >
                                      <Star className={`w-3.5 h-3.5 ${chat.isStarred ? 'text-[#DA7756] fill-[#DA7756]' : 'text-[#8C8A82]'}`} />
                                      <span>{chat.isStarred ? 'Unstar' : 'Star'}</span>
                                    </button>
                                    <button
                                      onClick={(e) => startEditing(chat, e)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#23221F] text-left text-[#ECEBE7]"
                                      role="menuitem"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-[#8C8A82]" />
                                      <span>Rename</span>
                                    </button>
                                    <div className="my-0.5 border-t border-[#262522]" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteConversation(chat.id);
                                        setContextMenuChatId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-left text-red-400"
                                      role="menuitem"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Chats and Tasks Header (matching reference images) ─── */}
        <div className="px-4 mb-1">
          <div className="flex items-center justify-between py-1.5 text-xs text-[#8C8A82]">
            <button
              onClick={() => setIsChatsExpanded(!isChatsExpanded)}
              className="flex items-center gap-1.5 font-medium text-[13px] text-[#8C8A82] hover:text-[#ECEBE7] transition-colors select-none"
            >
              <span>Chats and tasks</span>
              {!isChatsExpanded && (
                <ChevronRight className="w-3.5 h-3.5 text-[#8C8A82]" />
              )}
            </button>
            <button
              onClick={onOpenSearch}
              className="p-1 rounded hover:text-[#ECEBE7] text-[#8C8A82] transition-colors"
              title="Filter / Search (Ctrl+K)"
              aria-label="Filter chats"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* ─── Scrollable History List with Bullets (matching reference images) ─── */}
        {isChatsExpanded && (
          <div className="flex-1 overflow-y-auto px-2.5 pb-2 space-y-0.5 animate-in fade-in duration-100" role="list" aria-label="Conversation history">
            {standaloneConversations.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-[#8C8A82]">
                {searchQuery ? `No results for "${searchQuery}"` : 'No conversations yet'}
              </div>
            )}

            {standaloneConversations.map((chat) => {
              const isActive = activePageView === 'chat' && chat.id === activeConversationId;
              const isEditing = editingChatId === chat.id;
              const isContextOpen = contextMenuChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  role="listitem"
                  onClick={() => handleSelectConversation(chat.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-[14.5px] leading-normal cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#252422] text-[#FFFFFF] font-normal'
                      : 'text-[#E2E1DD] hover:bg-[#1C1B19] hover:text-[#FFFFFF]'
                  }`}
                  aria-selected={isActive}
                  aria-label={`Conversation: ${chat.title}`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(chat.id, e)}
                      className="flex items-center gap-1.5 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full bg-[#191816] text-sm text-[#ECEBE7] px-2.5 py-1 rounded-lg border border-[#DA7756] focus:outline-none"
                        aria-label="Rename conversation"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                      />
                      <button type="submit" className="p-1 hover:text-[#DA7756] text-[#A5A39C]" aria-label="Save">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingChatId(null)} className="p-1 text-[#8C8A82]" aria-label="Cancel">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 overflow-hidden mr-2 min-w-0">
                        {/* Bullet Circle (matching Claude) */}
                        <span className={`w-2 h-2 rounded-full border-[1.5px] shrink-0 transition-colors ${
                          isActive
                            ? 'border-[#B4B3AD] bg-[#B4B3AD]/40'
                            : 'border-[#5E5C56]'
                        }`} />
                        <span className="truncate">{chat.title}</span>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuChatId(isContextOpen ? null : chat.id);
                          }}
                          className="p-1 rounded text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#2D2C28]"
                          aria-label="More actions"
                          aria-haspopup="true"
                          aria-expanded={isContextOpen}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Context menu */}
                      {isContextOpen && (
                        <div
                          ref={contextMenuRef}
                          className="absolute right-2 top-8 w-36 bg-[#1C1B19] border border-[#2E2D2A] rounded-xl shadow-2xl p-1 z-50 text-xs"
                          onClick={(e) => e.stopPropagation()}
                          role="menu"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarConversation(chat.id);
                              setContextMenuChatId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#23221F] text-left text-[#ECEBE7]"
                            role="menuitem"
                          >
                            <Star className={`w-3.5 h-3.5 ${chat.isStarred ? 'text-[#DA7756] fill-[#DA7756]' : 'text-[#8C8A82]'}`} />
                            <span>{chat.isStarred ? 'Unstar' : 'Star'}</span>
                          </button>
                          <button
                            onClick={(e) => startEditing(chat, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#23221F] text-left text-[#ECEBE7]"
                            role="menuitem"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#8C8A82]" />
                            <span>Rename</span>
                          </button>
                          <div className="my-0.5 border-t border-[#262522]" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(chat.id);
                              setContextMenuChatId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-left text-red-400"
                            role="menuitem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Bottom Account Area (matching Image 1) ─── */}
        <div className="mt-auto border-t border-[#1F1E1C] p-2 space-y-1 relative" ref={profileMenuRef}>
          
          {/* Workspace indicator */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] text-[#ECEBE7] hover:bg-[#1E1D1B] hover:text-[#FFFFFF] cursor-pointer transition-colors">
            <Palette className="w-3.5 h-3.5 text-[#ECEBE7] stroke-[1.6]" />
            <span className="font-normal text-[14px] text-[#ECEBE7]">Design</span>
          </div>

          {/* User Profile Pill (matching Image 1) */}
          <div className="relative">
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                isProfileMenuOpen
                  ? 'bg-[#22211F] border-[#34332F]'
                  : 'bg-[#181816] hover:bg-[#201F1D] border-transparent hover:border-[#282725]'
              }`}
              role="button"
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
              aria-label="Account menu"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#2B2A27] border border-[#3A3935] text-[#ECEBE7] flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : settings.userName ? settings.userName.charAt(0).toUpperCase() : 'N'}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-normal text-[13.5px] text-[#ECEBE7]">{user?.name || settings.userName || 'Norbu'}</span>
                  <span className="text-xs text-[#8C8A82]">
                    · {user?.plan ? (user.plan.charAt(0).toUpperCase() + user.plan.slice(1)) : 'Pro'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C8A82]" />
                </div>
              </div>

              {/* Utility Icons (matching Image 1: Download with dot, Search, Collapse) */}
              <div className="flex items-center gap-2 text-[#8C8A82]" onClick={(e) => e.stopPropagation()}>
                {/* Download / Updates Icon with Blue Dot */}
                <div className="relative">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1 rounded hover:bg-[#282724] hover:text-[#ECEBE7] transition-colors"
                    title="Updates & Downloads"
                  >
                    <Download className="w-4 h-4 stroke-[2]" />
                  </button>
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-sky-500 ring-2 ring-[#181816]" />
                </div>

                {/* Search Icon */}
                <button
                  onClick={onOpenSearch}
                  className="p-1 rounded hover:bg-[#282724] hover:text-[#ECEBE7] transition-colors"
                  title="Search chats (Ctrl+K)"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Sidebar Collapse Icon */}
                <button
                  onClick={onToggle}
                  className="p-1 rounded hover:bg-[#282724] hover:text-[#ECEBE7] transition-colors"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                className="absolute bottom-full left-0 w-64 mb-2 bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 select-none text-xs text-[#ECEBE7]"
                role="menu"
                aria-label="Account menu"
              >
                <div className="px-3.5 py-2 text-[11px] text-[#8C8A82] border-b border-[#262522] truncate">
                  {user?.email || settings.userEmail || 'norbu@claude.ai'}
                </div>

                <div className="space-y-0.5 my-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
                      <span>Settings</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#7E7C76] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-[#252422] border border-[#33312E]">Ctrl</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#252422] border border-[#33312E]">⇧</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#252422] border border-[#33312E]">,</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
                    role="menuitem"
                  >
                    <Globe className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
                    <span>Language</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
                    role="menuitem"
                  >
                    <HelpCircle className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
                    <span>Get help</span>
                  </button>
                </div>

                <div className="border-t border-[#262522] my-1" />

                <div className="space-y-0.5 my-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActivePageView('upgrade');
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
                    role="menuitem"
                  >
                    <ArrowUpCircle className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
                    <span>Upgrade plan</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
                    role="menuitem"
                  >
                    <Download className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
                    <span>Apps & Extensions</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActivePageView('projects');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#23221F] text-left transition-colors group"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-[#8C8A82] group-hover:text-[#ECEBE7]" />
                      <span>Claude Academy</span>
                    </div>
                    <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded">
                      New
                    </span>
                  </button>
                </div>

                <div className="border-t border-[#262522] my-1" />

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#23221F] text-left text-[#A5A39C] hover:text-red-400 transition-colors group"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 group-hover:text-red-400" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
