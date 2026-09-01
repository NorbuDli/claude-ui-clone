import React, { useState } from 'react';
import {
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  X,
  Copy,
  Sparkles,
  PanelLeftOpen
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { ClaudeArtifactsIcon } from './ClaudeIcons';

interface ActiveChatHeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ActiveChatHeader: React.FC<ActiveChatHeaderProps> = ({
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const {
    activeConversation,
    isArtifactPaneOpen,
    setIsArtifactPaneOpen,
    activeArtifact,
    renameConversation,
    deleteConversation,
    projects,
    setActiveProject,
    setActivePageView
  } = useChat();

  const [isTitleMenuOpen, setIsTitleMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  if (!activeConversation) return null;

  const currentProject = activeConversation.projectId
    ? projects.find((p) => p.id === activeConversation.projectId)
    : null;

  const handleStartRename = () => {
    setTitleInput(activeConversation.title);
    setIsEditingTitle(true);
    setIsTitleMenuOpen(false);
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      renameConversation(activeConversation.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  return (
    <>
      <header className="h-12 bg-[#141413] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none border-b border-[#1f1e1c]">
        
        {/* TOP LEFT: Sidebar open toggle button (when collapsed) & Conversation Name ˅ */}
        <div className="flex items-center gap-2">
          {!isSidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                className="bg-[#1C1B19] text-xs font-medium text-[#ECEBE7] px-2.5 py-1 rounded-lg border border-[#DA7756] focus:outline-none"
              />
              <button type="submit" className="p-1 text-[#DA7756] hover:text-white" title="Save">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-1 text-[#8C8A82] hover:text-[#ECEBE7]"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              {currentProject && (
                <>
                  <button
                    onClick={() => {
                      setActiveProject(currentProject);
                      setActivePageView('projects');
                    }}
                    className="text-xs text-[#8C8A82] hover:text-[#ECEBE7] transition-colors truncate max-w-[160px] font-normal"
                    title={`Back to ${currentProject.name}`}
                  >
                    {currentProject.name}
                  </button>
                  <span className="text-xs text-[#555450]">/</span>
                </>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsTitleMenuOpen(!isTitleMenuOpen)}
                  className="flex items-center gap-1.5 text-xs font-normal text-[#9C9A92] hover:text-[#ECEBE7] hover:bg-[#201F1D] px-2 py-1 rounded-lg transition-colors group"
                >
                  <span className="truncate max-w-[240px] sm:max-w-md text-[#ECEBE7] font-medium">
                    {activeConversation.title}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#706E68] group-hover:text-[#ECEBE7]" />
                </button>

                {/* Title Context Menu */}
                {isTitleMenuOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-44 bg-[#1C1B19] border border-[#2E2D2A] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setIsTitleMenuOpen(false)}
                  >
                    <button
                      onClick={handleStartRename}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#B4B3AD] hover:bg-[#242320] hover:text-[#ECEBE7] text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Rename chat</span>
                    </button>
                    <button
                      onClick={() => deleteConversation(activeConversation.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT: Share Button ONLY (and optional Artifacts split pane toggle if active) */}
        <div className="flex items-center gap-3">
          {activeArtifact && (
            <button
              onClick={() => setIsArtifactPaneOpen(!isArtifactPaneOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isArtifactPaneOpen
                  ? 'bg-[#DA7756]/15 border-[#DA7756]/50 text-[#DA7756]'
                  : 'bg-[#1C1B19] border-[#2E2D2A] text-[#B4B3AD] hover:text-[#ECEBE7]'
              }`}
            >
              <ClaudeArtifactsIcon size={14} color="#DA7756" />
              <span className="hidden sm:inline">Artifacts</span>
            </button>
          )}

          {/* Share Button (matching reference) */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1 rounded-lg bg-[#201F1D] hover:bg-[#282724] border border-[#2D2C28] text-xs font-normal text-[#ECEBE7] transition-colors"
          >
            Share
          </button>
        </div>
      </header>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-6 space-y-4 text-xs select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#262522]">
              <span className="font-semibold text-sm text-[#ECEBE7]">Share Conversation</span>
              <button onClick={() => setIsShareModalOpen(false)} className="text-[#7E7C76] hover:text-[#ECEBE7]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#8C8A82] leading-relaxed">
              Anyone with this link will be able to view and fork this conversation in their workspace.
            </p>
            <button
              onClick={handleCopyShare}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#DA7756] hover:bg-[#C86545] text-white font-medium text-xs transition-all shadow"
            >
              {isCopiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Public Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
