import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  MessageSquare,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  Pin,
  FolderMinus,
  MoreVertical
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { Project, Attachment, Conversation } from '../types';
import { ClaudeProjectsIcon } from './ClaudeIcons';
import { ChatInput } from './ChatInput';

type ProjectTab = 'chats' | 'knowledge' | 'instructions' | 'settings';
type SortOption = 'last-updated' | 'date-created' | 'alphabetical' | 'group-type';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    setProjects,
    activeProject,
    setActiveProject,
    conversations,
    selectConversation,
    createNewConversation,
    setActivePageView,
    deleteConversation,
    renameConversation,
    toggleStarConversation,
    moveConversationToProject,
    setActiveConversationId
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('last-updated');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [projectColor, setProjectColor] = useState('#DA7756');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectTab>('chats');
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instructionsDraft, setInstructionsDraft] = useState('');

  // Conversation Context Menu states
  const [activeContextMenuConvId, setActiveContextMenuConvId] = useState<string | null>(null);
  const [isChangeProjectSubmenuOpen, setIsChangeProjectSubmenuOpen] = useState<string | null>(null);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameConvTitle, setRenameConvTitle] = useState<string>('');
  const [isProjectOptionsOpen, setIsProjectOptionsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const convContextMenuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setIsSortMenuOpen(false);
      }
      if (convContextMenuRef.current && !convContextMenuRef.current.contains(target)) {
        setActiveContextMenuConvId(null);
        setIsChangeProjectSubmenuOpen(null);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(target)) {
        setIsProjectOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabels: Record<SortOption, string> = {
    'last-updated': 'Last updated',
    'date-created': 'Date created',
    'alphabetical': 'Alphabetical',
    'group-type': 'Group by type'
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const sortedProjects = useMemo(() => {
    const list = projects.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return [...list].sort((a, b) => {
      if (sortBy === 'date-created') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'group-type') {
        return (a.color || '').localeCompare(b.color || '');
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [projects, searchQuery, sortBy]);

  // Derive selected project from activeProject if on detail view
  const currentProject = activeProject
    ? projects.find((p) => p.id === activeProject.id) || null
    : null;

  // Conversations in current project
  const projectConversations = currentProject
    ? conversations.filter((c) => c.projectId === currentProject.id)
    : [];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      description: projectDesc.trim(),
      customInstructions: projectPrompt.trim(),
      files: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: projectColor
    };

    setProjects((prev) => [newProj, ...prev]);
    setIsNewProjectModalOpen(false);
    setProjectName('');
    setProjectDesc('');
    setProjectPrompt('');
    setActiveProject(newProj);
    setActiveConversationId(null);
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !projectName.trim()) return;

    const updated: Project = {
      ...currentProject,
      name: projectName.trim(),
      description: projectDesc.trim(),
      customInstructions: projectPrompt.trim(),
      color: projectColor,
      updatedAt: Date.now()
    };

    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updated : p)));
    setActiveProject(updated);
    setIsEditProjectModalOpen(false);
  };

  const openEditModal = (proj: Project) => {
    setProjectName(proj.name);
    setProjectDesc(proj.description || '');
    setProjectPrompt(proj.customInstructions || '');
    setProjectColor(proj.color || '#DA7756');
    setIsEditProjectModalOpen(true);
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project? All associated knowledge files will be removed.')) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
    }
  };

  const handleStartChatInProject = (proj: Project) => {
    setActiveProject(proj);
    createNewConversation(proj.id);
    setActivePageView('chat');
  };

  const handleOpenExistingChat = (convId: string) => {
    selectConversation(convId);
    setActivePageView('chat');
  };

  // File Upload Handlers
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || !currentProject) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        reader.onload = () => {
          const newAtt: Attachment = {
            id: `proj-file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string
          };
          addFileToProject(newAtt);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const newAtt: Attachment = {
            id: `proj-file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            textContent: reader.result as string
          };
          addFileToProject(newAtt);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFileToProject = (fileAtt: Attachment) => {
    if (!currentProject) return;
    const updatedFiles = [...(currentProject.files || []), fileAtt];
    const updated: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: Date.now()
    };
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updated : p)));
    setActiveProject(updated);
  };

  const handleRemoveFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;
    const updatedFiles = (currentProject.files || []).filter((f) => f.id !== fileId);
    const updated: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: Date.now()
    };
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updated : p)));
    setActiveProject(updated);
  };

  const handleSaveInstructions = (instructionsText: string) => {
    if (!currentProject) return;
    const updated: Project = {
      ...currentProject,
      customInstructions: instructionsText,
      updatedAt: Date.now()
    };
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updated : p)));
    setActiveProject(updated);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: Attachment) => {
    if (file.type.startsWith('image/')) return <Eye className="w-4 h-4 text-emerald-400" />;
    if (file.name.endsWith('.json') || file.name.endsWith('.csv'))
      return <FileSpreadsheet className="w-4 h-4 text-amber-400" />;
    if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py'))
      return <FileCode className="w-4 h-4 text-[#DA7756]" />;
    return <FileText className="w-4 h-4 text-sky-400" />;
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ─────────────────────────────────────────────────────────────
  // 1. PROJECT DETAIL VIEW (Matching Image 1)
  // ─────────────────────────────────────────────────────────────
  if (currentProject) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-y-auto select-none">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
          accept=".txt,.md,.pdf,.json,.csv,.js,.jsx,.ts,.tsx,.py,.html,.css,.sql,.yaml,.yml,image/*"
        />

        {/* Top Breadcrumb Header (matching Image: Projects / [name]) */}
        <div className="px-6 lg:px-8 pt-5 pb-3 w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveProject(null)}
              className="text-[#8C8A82] hover:text-[#ECEBE7] transition-colors font-normal"
            >
              Projects
            </button>
            <span className="text-[#555450]">/</span>
            <span className="text-[#ECEBE7] font-medium truncate max-w-[240px]">
              {currentProject.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(currentProject)}
              className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
              title="Pin project"
            >
              <Pin className="w-4 h-4 rotate-45" />
            </button>
            <div className="relative" ref={projectMenuRef}>
              <button
                onClick={() => setIsProjectOptionsOpen(!isProjectOptionsOpen)}
                className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
                title="Project options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isProjectOptionsOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      openEditModal(currentProject);
                      setIsProjectOptionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>Edit details</span>
                  </button>
                  <div className="my-0.5 border-t border-[#262522]" />
                  <button
                    onClick={(e) => {
                      setIsProjectOptionsOpen(false);
                      handleDeleteProject(currentProject.id, e);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-left text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete project</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Main Content (matching Image 1) */}
        <div className="flex-1 w-full px-8 py-6 flex flex-col xl:flex-row justify-between items-start gap-12 max-w-7xl mx-auto">
          {/* Left / Main Workspace Column */}
          <div className="flex-1 w-full max-w-2xl space-y-6 pt-2">
            {/* Big Project Title */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#ECEBE7] font-normal tracking-tight">
                {currentProject.name}
              </h1>
              {currentProject.description && (
                <p className="text-xs text-[#8C8A82] mt-1.5 leading-relaxed max-w-xl">
                  {currentProject.description}
                </p>
              )}
            </div>

            {/* Embedded Chat Input Box */}
            <div className="w-full">
              <ChatInput fullWidth={true} hideQuickAnswer={true} forcePlaceholder="How can I help you today?" />
            </div>

            {/* Recents List (matching Claude reference image) */}
            {projectConversations.length > 0 ? (
              <div className="space-y-1.5 pt-2" ref={convContextMenuRef}>
                <div className="text-[13px] text-[#8C8A82] font-normal px-2 pb-1">
                  Recents
                </div>

                <div className="space-y-0.5">
                  {projectConversations.map((conv) => {
                    const isMenuOpen = activeContextMenuConvId === conv.id;
                    const isRenaming = renamingConvId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleOpenExistingChat(conv.id)}
                        className="group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-[#ECEBE7] hover:bg-[#1E1D1B] cursor-pointer transition-colors"
                      >
                        {isRenaming ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (renameConvTitle.trim()) {
                                renameConversation(conv.id, renameConvTitle.trim());
                              }
                              setRenamingConvId(null);
                            }}
                            className="flex items-center gap-2 w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={renameConvTitle}
                              onChange={(e) => setRenameConvTitle(e.target.value)}
                              autoFocus
                              className="w-full bg-[#161514] text-xs text-[#ECEBE7] px-2.5 py-1 rounded-lg border border-[#DA7756] outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setRenamingConvId(null);
                              }}
                            />
                            <button type="submit" className="p-1 text-[#DA7756] hover:text-white">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setRenamingConvId(null)} className="p-1 text-[#8C8A82]">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              {conv.isStarred && <Pin className="w-3.5 h-3.5 text-[#DA7756] shrink-0 fill-[#DA7756]" />}
                              <span className="truncate max-w-lg font-normal text-[#E2E1DD] group-hover:text-white transition-colors">
                                {conv.title}
                              </span>
                            </div>

                            <div className="relative shrink-0 flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveContextMenuConvId(isMenuOpen ? null : conv.id);
                                  setIsChangeProjectSubmenuOpen(null);
                                }}
                                className={`p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#282724] transition-all ${
                                  isMenuOpen ? 'opacity-100 bg-[#282724] text-[#ECEBE7]' : 'opacity-0 group-hover:opacity-100'
                                }`}
                                aria-label="Chat options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Claude Context Menu Popup matching media_1787978327829.png */}
                              {isMenuOpen && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-52 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-[13px] text-[#ECEBE7] animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* 1. Pin */}
                                  <button
                                    onClick={() => {
                                      toggleStarConversation(conv.id);
                                      setActiveContextMenuConvId(null);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#242320] text-left transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Pin className={`w-3.5 h-3.5 ${conv.isStarred ? 'text-[#DA7756] fill-[#DA7756]' : 'text-[#8C8A82]'}`} />
                                      <span>{conv.isStarred ? 'Unpin' : 'Pin'}</span>
                                    </div>
                                    <span className="text-[11px] text-[#706E68]">P</span>
                                  </button>

                                  {/* 2. Mark as unread */}
                                  <button
                                    onClick={() => {
                                      setActiveContextMenuConvId(null);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#242320] text-left transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <EyeOff className="w-3.5 h-3.5 text-[#8C8A82]" />
                                      <span>Mark as unread</span>
                                    </div>
                                    <span className="text-[11px] text-[#706E68]">U</span>
                                  </button>

                                  {/* 3. Rename */}
                                  <button
                                    onClick={() => {
                                      setRenamingConvId(conv.id);
                                      setRenameConvTitle(conv.title);
                                      setActiveContextMenuConvId(null);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#242320] text-left transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Edit2 className="w-3.5 h-3.5 text-[#8C8A82]" />
                                      <span>Rename</span>
                                    </div>
                                    <span className="text-[11px] text-[#706E68]">R</span>
                                  </button>

                                  {/* 4. Change project › */}
                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        setIsChangeProjectSubmenuOpen(isChangeProjectSubmenuOpen === conv.id ? null : conv.id);
                                      }}
                                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#242320] text-left transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <ClaudeProjectsIcon size={14} color="#8C8A82" />
                                        <span>Change project</span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-[#706E68]" />
                                    </button>

                                    {/* Submenu for target projects */}
                                    {isChangeProjectSubmenuOpen === conv.id && (
                                      <div className="absolute right-full top-0 mr-1.5 w-48 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-2.5 py-1.5 text-[11px] text-[#706E68] border-b border-[#262522]">Move to project</div>
                                        <div className="max-h-48 overflow-y-auto space-y-0.5 py-1">
                                          {projects.filter(p => p.id !== currentProject.id).map(p => (
                                            <button
                                              key={p.id}
                                              onClick={() => {
                                                moveConversationToProject(conv.id, p.id);
                                                setActiveContextMenuConvId(null);
                                                setIsChangeProjectSubmenuOpen(null);
                                              }}
                                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left truncate text-[#ECEBE7]"
                                            >
                                              <ClaudeProjectsIcon size={13} color="#8C8A82" className="shrink-0" />
                                              <span className="truncate">{p.name}</span>
                                            </button>
                                          ))}
                                          {projects.filter(p => p.id !== currentProject.id).length === 0 && (
                                            <div className="px-2.5 py-2 text-[11px] text-[#706E68] text-center">No other projects</div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 5. Remove from project */}
                                  <button
                                    onClick={() => {
                                      moveConversationToProject(conv.id, undefined);
                                      setActiveContextMenuConvId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#242320] text-left transition-colors"
                                  >
                                    <FolderMinus className="w-3.5 h-3.5 text-[#8C8A82]" />
                                    <span>Remove from project</span>
                                  </button>

                                  <div className="my-1 border-t border-[#262522]" />

                                  {/* 6. Delete */}
                                  <button
                                    onClick={() => {
                                      deleteConversation(conv.id);
                                      setActiveContextMenuConvId(null);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-red-950/30 text-left text-red-400 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      <span>Delete</span>
                                    </div>
                                    <span className="text-[11px] text-red-400/70">D</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Central Claude Knowledge Helper (when no recents yet) */
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 max-w-md mx-auto">
                <div className="w-9 h-9 rounded-full bg-[#1C1B19] border border-[#2B2A27] flex items-center justify-center text-[#8C8A82]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.5"/>
                  </svg>
                </div>
                <p className="text-xs text-[#8C8A82] max-w-xs leading-relaxed">
                  Claude references the same knowledge every time you talk to it in this project.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Instructions & Context Card (matching Image 1) */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="bg-[#181715] border border-[#262522] rounded-2xl p-4 space-y-5 shadow-sm">
              {/* 1. Instructions Section */}
              <div className="space-y-2">
                <div
                  onClick={() => {
                    setInstructionsDraft(currentProject.customInstructions || '');
                    setIsEditingInstructions(true);
                  }}
                  className="flex items-center justify-between cursor-pointer group select-none"
                >
                  <span className="text-xs font-medium text-[#ECEBE7] group-hover:text-white transition-colors">
                    Instructions
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInstructionsDraft(currentProject.customInstructions || '');
                      setIsEditingInstructions(true);
                    }}
                    className="p-1 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#22211F] transition-colors"
                    title="Edit instructions"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#8C8A82]" />
                  </button>
                </div>

                {currentProject.customInstructions ? (
                  <div
                    onClick={() => {
                      setInstructionsDraft(currentProject.customInstructions || '');
                      setIsEditingInstructions(true);
                    }}
                    className="p-3 rounded-xl bg-[#131211] border border-[#201F1D] hover:border-[#2C2B28] cursor-pointer text-xs text-[#B4B3AD] font-mono leading-relaxed max-h-32 overflow-y-auto"
                  >
                    {currentProject.customInstructions}
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setInstructionsDraft('');
                      setIsEditingInstructions(true);
                    }}
                    className="cursor-pointer hover:bg-[#1E1D1B] p-1.5 -mx-1.5 rounded-lg transition-colors group"
                  >
                    <p className="text-[11px] text-[#7E7C76] group-hover:text-[#A5A39C] leading-relaxed">
                      Add instructions to tailor Claude's responses
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[#22211F]" />

              {/* 2. Context Section (matching Image 1) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#ECEBE7]">Context</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#22211F] transition-colors"
                    title="Add files"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#8C8A82]" />
                  </button>
                </div>

                {(!currentProject.files || currentProject.files.length === 0) ? (
                  /* Empty state matching Image 1: dark container with document illustration */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#131211] border border-[#201F1D] hover:border-[#2C2B28] rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all group"
                  >
                    {/* Document stack illustration */}
                    <div className="w-12 h-10 relative flex items-center justify-center text-[#555450] group-hover:text-[#8C8A82] transition-colors">
                      <svg width="40" height="34" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="22" height="26" rx="3" fill="#1C1B19" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="9" y="4" width="22" height="26" rx="3" fill="#22211F" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="16" y="6" width="22" height="26" rx="3" fill="#282724" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M27 15V23M23 19H31" stroke="#ECEBE7" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>

                    <p className="text-[11px] text-[#8C8A82] max-w-[190px] leading-relaxed">
                      Add PDFs, documents, or other text to reference in this project.
                    </p>
                  </div>
                ) : (
                  /* Uploaded files list */
                  <div className="space-y-2">
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {currentProject.files.map((file) => (
                        <div
                          key={file.id}
                          className="group p-2.5 rounded-xl bg-[#131211] border border-[#201F1D] hover:border-[#2C2B28] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 mr-2">
                            <div className="shrink-0">{getFileIcon(file)}</div>
                            <span className="text-[11px] text-[#ECEBE7] truncate">{file.name}</span>
                          </div>
                          <button
                            onClick={(e) => handleRemoveFile(file.id, e)}
                            className="p-1 rounded text-[#7E7C76] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Remove file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 rounded-lg bg-[#131211] hover:bg-[#1E1D1B] text-[11px] text-[#8C8A82] hover:text-[#ECEBE7] border border-[#201F1D] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add more files</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className="w-full max-w-2xl bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#262522]">
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(previewFile)}
                  <span className="font-semibold text-xs text-[#ECEBE7] truncate">{previewFile.name}</span>
                </div>
                <button onClick={() => setPreviewFile(null)} className="text-[#7E7C76] hover:text-[#ECEBE7] p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-[#141413]">
                {previewFile.dataUrl ? (
                  <img src={previewFile.dataUrl} alt={previewFile.name} className="max-w-full rounded-xl mx-auto" />
                ) : (
                  <pre className="text-xs font-mono text-[#B4B3AD] whitespace-pre-wrap leading-relaxed">
                    {previewFile.textContent || 'No text content in file.'}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {isEditProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className="w-full max-w-md bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#262522]">
                <h3 className="text-xs font-semibold text-[#ECEBE7]">Edit Project</h3>
                <button onClick={() => setIsEditProjectModalOpen(false)} className="text-[#7E7C76] hover:text-[#ECEBE7]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateProject} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#ECEBE7] mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    className="w-full bg-[#141413] border border-[#282724] rounded-xl px-3.5 py-2 text-xs text-[#ECEBE7] focus:outline-none focus:border-[#DA7756]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#ECEBE7] mb-1">Description</label>
                  <input
                    type="text"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="w-full bg-[#141413] border border-[#282724] rounded-xl px-3.5 py-2 text-xs text-[#ECEBE7] focus:outline-none focus:border-[#DA7756]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditProjectModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-[#8C8A82] hover:bg-[#201F1D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Set Project Instructions Modal (Claude-style) ─── */}
        {isEditingInstructions && currentProject && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setIsEditingInstructions(false);
              }
            }}
          >
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsEditingInstructions(false)}
            />

            {/* Dialog Card (matching Claude screenshot) */}
            <div
              className="relative z-10 w-full max-w-2xl bg-[#1E1E1C] border border-[#2E2E2B] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden select-text"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-2 space-y-1.5">
                <h2 className="text-base sm:text-lg font-medium text-[#ECEBE7] tracking-tight">
                  Set project instructions
                </h2>
                <p className="text-xs text-[#9C9A92] leading-relaxed">
                  Provide Claude with relevant instructions and information for chats within{' '}
                  <span className="text-[#ECEBE7] font-medium">{currentProject.name}</span>.{' '}
                  This will work alongside your{' '}
                  <span className="text-[#5B8EE5] hover:text-[#78A6F0] underline cursor-pointer transition-colors">
                    profile instructions
                  </span>{' '}
                  and the selected style in a chat.
                </p>
              </div>

              {/* Textarea Container */}
              <div className="px-6 py-3">
                <textarea
                  rows={10}
                  value={instructionsDraft}
                  onChange={(e) => setInstructionsDraft(e.target.value)}
                  placeholder="Think step by step and show reasoning for complex problems. Use specific examples."
                  className="w-full h-64 bg-[#252523] border border-[#343430] focus:border-[#4E4E48] rounded-xl p-4 text-xs sm:text-[13px] text-[#ECEBE7] placeholder-[#73726D] outline-none resize-none leading-relaxed transition-colors font-sans"
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingInstructions(false)}
                  className="px-4 py-2 rounded-xl bg-[#282725] hover:bg-[#32312E] text-xs font-medium text-[#ECEBE7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveInstructions(instructionsDraft);
                    setIsEditingInstructions(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8A8985] hover:bg-[#9E9D99] text-xs font-medium text-[#141413] transition-colors shadow-sm font-semibold"
                >
                  Save Instructions
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PROJECTS CATALOG / GRID VIEW (When no project is selected)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-y-auto select-none">
      {/* Top Header matching Image 2 */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4 max-w-5xl mx-auto w-full">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-[#ECEBE7]">
          Projects
        </h1>

        <div className="flex items-center gap-2.5">
          {/* Search button / input */}
          {isSearchOpen ? (
            <div className="relative w-52 animate-in fade-in zoom-in-95 duration-100">
              <Search className="w-3.5 h-3.5 text-[#7E7C76] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#1C1B19] text-xs text-[#ECEBE7] pl-8 pr-8 py-2 rounded-xl border border-[#2B2A27] focus:outline-none focus:border-[#DA7756]"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E7C76] hover:text-[#ECEBE7]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] flex items-center justify-center text-[#8C8A82] hover:text-[#ECEBE7] transition-colors"
              title="Search projects"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Sort Dropdown (matching Image 2) */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1C1B19] hover:bg-[#22211F] text-xs text-[#ECEBE7] border border-[#2B2A27] transition-colors select-none"
            >
              <span className="text-[#8C8A82]">Sort by</span>
              <span>{sortLabels[sortBy]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#7E7C76] transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-[#ECEBE7] animate-in fade-in zoom-in-95 duration-100 space-y-0.5 select-none">
                {(['last-updated', 'date-created', 'alphabetical', 'group-type'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      sortBy === opt
                        ? 'bg-[#262522] text-[#ECEBE7] font-medium'
                        : 'text-[#9C9A92] hover:bg-[#22211F] hover:text-[#ECEBE7]'
                    }`}
                  >
                    <span>{sortLabels[opt]}</span>
                    {sortBy === opt && (
                      <Check className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Project White Pill Button (matching Image 2) */}
          <button
            onClick={() => {
              setProjectName('');
              setProjectDesc('');
              setProjectPrompt('');
              setIsNewProjectModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            New project
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-8 pt-4 pb-8 max-w-5xl mx-auto w-full">
        {projects.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center text-center space-y-4 max-w-sm my-auto">
            <div className="w-16 h-16 relative flex items-center justify-center text-[#9E9C94] mb-1">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="7" y="7" width="15" height="15" rx="1.5" />
                <rect x="26" y="7" width="15" height="15" rx="1.5" />
                <rect x="7" y="26" width="15" height="15" rx="1.5" />
                <rect x="26" y="26" width="15" height="15" rx="1.5" />
                <path d="M22 22L33 33M33 26V33H26" stroke="#DA7756" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-medium text-[#ECEBE7]">Looking to start a project?</h2>
              <p className="text-xs text-[#8C8A82] leading-relaxed">
                Upload materials, set custom instructions, and organize conversations in one space.
              </p>
            </div>

            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-[#201F1D] hover:bg-[#282724] text-xs font-normal text-[#ECEBE7] border border-[#2D2C28] shadow-sm transition-all"
            >
              New project
            </button>

            {/* Claude Academy Card */}
            <div className="w-full text-left p-4 rounded-2xl bg-[#191816] border border-[#242320] space-y-1 mt-6">
              <div className="text-[11px] text-[#706E68]">Claude Academy</div>
              <h3 className="text-xs font-semibold text-[#ECEBE7]">Intro to Projects</h3>
              <p className="text-[11px] text-[#8C8A82] leading-relaxed">
                Projects keep the chats, files, and instructions for one piece of work together, so the assistant always has the full picture.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="px-3 py-1 rounded-lg bg-[#201F1D] hover:bg-[#282724] text-xs font-normal text-[#ECEBE7] border border-[#2D2C28] transition-colors"
                >
                  Watch video
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Projects Grid View (matching Image 2) */
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProjects.map((proj) => {
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setActiveProject(proj);
                      setActiveConversationId(null);
                    }}
                    className="group p-5 rounded-2xl bg-[#1C1B19]/80 border border-[#282724] hover:border-[#383734] hover:bg-[#201F1D] cursor-pointer transition-all flex flex-col justify-between min-h-[110px] shadow-sm relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-normal text-[14px] text-[#ECEBE7] group-hover:text-white transition-colors truncate max-w-[200px]">
                          {proj.name}
                        </h3>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#7E7C76] group-hover:text-[#ECEBE7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                      </div>

                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="p-1 rounded text-[#7E7C76] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[12px] text-[#706E68]">
                      {formatTimeAgo(proj.updatedAt || proj.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create a Project Modal (Matching Image 1) */}
      {isNewProjectModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <div
            className="w-full max-w-[480px] bg-[#1F1E1C] border border-[#2E2D2A] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-xs animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-medium text-[#ECEBE7] tracking-tight">Create a project</h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#282724] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[13px] font-normal text-[#ECEBE7] mb-2">
                  What are you working on?
                </label>
                <input
                  type="text"
                  placeholder="Name your project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#262522] border border-[#3A3935] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#ECEBE7] placeholder-[#706E68] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-normal text-[#ECEBE7] mb-2">
                  What are you trying to achieve?
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your project, goals, subject, etc..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full bg-[#262522] border border-[#3A3935] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#ECEBE7] placeholder-[#706E68] outline-none transition-all resize-y min-h-[90px]"
                />
              </div>

              <div className="flex justify-end items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#2A2926] hover:bg-[#343330] text-[13px] font-normal text-[#ECEBE7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!projectName.trim()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-black text-[13px] font-semibold transition-all shadow-sm"
                >
                  Create project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#262522]">
              <span className="font-semibold text-xs text-[#ECEBE7]">Claude Academy: Intro to Projects</span>
              <button onClick={() => setShowVideoModal(false)} className="text-[#7E7C76] hover:text-[#ECEBE7]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-6 bg-[#141413] rounded-xl border border-[#242320] flex flex-col items-center justify-center space-y-2">
              <ClaudeProjectsIcon size={40} color="#DA7756" />
              <p className="text-xs text-[#ECEBE7] font-medium">Projects Keep Your Work In Sync</p>
              <p className="text-[11px] text-[#8C8A82] max-w-xs leading-relaxed">
                Set project instructions and upload context documents once. Claude will automatically reference them for every conversation inside the project.
              </p>
            </div>
            <button
              onClick={() => setShowVideoModal(false)}
              className="px-4 py-1.5 rounded-xl bg-[#201F1D] text-xs text-[#ECEBE7]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
