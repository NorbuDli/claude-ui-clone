import React, { useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  ChevronDown,
  Eye,
  Code2,
  Download,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  Copy,
  AlertCircle
} from 'lucide-react';

export interface CustomSkillItem {
  id: string;
  type: 'skill' | 'connector' | 'plugin';
  name: string;
  badge?: string;
  author: string;
  description: string;
  timeAgo: string;
  isEnabled: boolean;
  instructions?: string;
  skillMdContent?: string;
}

interface SkillDetailViewProps {
  skill: CustomSkillItem;
  onBack: () => void;
  onUpdate: (updated: CustomSkillItem) => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
}

export const SkillDetailView: React.FC<SkillDetailViewProps> = ({
  skill,
  onBack,
  onUpdate,
  onDelete,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contents'>('contents');
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const initialContent =
    skill.skillMdContent ||
    skill.instructions ||
    `# ${skill.name}

${skill.description}

## Ground rules — read these first

Check for required tools before executing workflows. When the user invokes this skill, format structured output according to Anthropic best practices.

### Instructions

1. Parse the user request thoroughly.
2. Formulate clear step-by-step logic.
3. Deliver high quality markdown responses.`;

  const [markdownContent, setMarkdownContent] = useState<string>(initialContent);

  const handleContentChange = (newContent: string) => {
    setMarkdownContent(newContent);
    onUpdate({
      ...skill,
      skillMdContent: newContent,
      instructions: newContent
    });
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${skill.name.toLowerCase().replace(/\s+/g, '-')}-SKILL.md`;
    link.click();
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Basic Markdown Renderer for SKILL.md
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // H1
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl sm:text-2xl font-bold text-[#ECEBE7] mt-3 mb-4 tracking-tight">
            {line.replace('# ', '')}
          </h1>
        );
      }
      // H2
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base sm:text-lg font-semibold text-[#ECEBE7] mt-6 mb-3 tracking-tight">
            {line.replace('## ', '')}
          </h2>
        );
      }
      // H3
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-[#ECEBE7] mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || /^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-2 text-xs text-[#C4C3BE] leading-relaxed">
            <span className="text-[#DA7756] mt-0.5">•</span>
            <span>{parseInlineStyles(line.replace(/^[-•]\s+|^\d+\.\s+/, ''))}</span>
          </div>
        );
      }
      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-[#C4C3BE] leading-relaxed">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  // Helper for inline backticks, bold, links
  const parseInlineStyles = (content: string) => {
    const parts = content.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="font-mono text-[11px] text-[#DA7756] bg-[#22211F] px-1.5 py-0.5 rounded border border-[#2F2E2B]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[#ECEBE7]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full px-6 sm:px-8 py-6 space-y-5">
        
        {/* Back Link (matching Image 1) */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-[#8C8A82] hover:text-[#ECEBE7] transition-colors w-fit group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Skills</span>
        </button>

        {/* Skill Main Header Card (matching Image 1) */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#1C1B19] border border-[#282725] flex items-center justify-center text-[#9C9A92]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10" />
                <path d="M7 12h10" />
                <path d="M7 17h6" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-medium text-[#ECEBE7] font-mono">{skill.name}</h1>
                {skill.badge && (
                  <span className="text-[10.5px] text-[#8C8A82] bg-[#201F1D] px-2 py-0.5 rounded-md border border-[#2B2A27]">
                    {skill.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8C8A82] mt-0.5">
                by {skill.author} · updated {skill.timeAgo}
              </p>
            </div>
          </div>

          {/* Right Action Switch + Options Menu */}
          <div className="flex items-center gap-3">
            {/* Blue Toggle Switch matching Image 1 */}
            <button
              role="switch"
              aria-checked={skill.isEnabled}
              onClick={onToggle}
              className={`w-10 h-5 rounded-full relative transition-colors p-0.5 ${
                skill.isEnabled ? 'bg-[#3B82F6]' : 'bg-[#2B2A27]'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  skill.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
                aria-label="Skill options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>Download SKILL.md</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCopy();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>{isCopied ? 'Copied!' : 'Copy raw content'}</span>
                  </button>
                  <div className="my-0.5 border-t border-[#262522]" />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-left text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete skill</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Overview / Contents · 1) */}
        <div className="flex items-center gap-6 border-b border-[#201F1D] text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors relative ${
              activeTab === 'overview'
                ? 'text-[#ECEBE7]'
                : 'text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('contents')}
            className={`pb-2.5 transition-colors relative ${
              activeTab === 'contents'
                ? 'text-[#ECEBE7]'
                : 'text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            Contents · 1
            {activeTab === 'contents' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* ─── TAB: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-3xl pt-2">
            <div>
              <h3 className="text-xs font-medium text-[#706E68] uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-[#ECEBE7] leading-relaxed">{skill.description}</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-[#706E68] uppercase tracking-wider mb-2">Author & Source</h3>
              <p className="text-xs text-[#ECEBE7]">{skill.author}</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-[#706E68] uppercase tracking-wider mb-2">Capabilities Included</h3>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[#DA7756] bg-[#22211F] px-2.5 py-1 rounded-lg border border-[#2E2D2A]">
                  Custom Prompts
                </span>
                <span className="text-xs text-[#3B82F6] bg-[#22211F] px-2.5 py-1 rounded-lg border border-[#2E2D2A]">
                  Tool Integration
                </span>
                <span className="text-xs text-emerald-400 bg-[#22211F] px-2.5 py-1 rounded-lg border border-[#2E2D2A]">
                  Memory Sync
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: CONTENTS · 1 (matching Image 1) ─── */}
        {activeTab === 'contents' && (
          <div className="space-y-3">
            {/* Version dropdown button */}
            <div>
              <button className="px-3 py-1.5 rounded-xl bg-[#1C1B19] border border-[#282725] text-xs text-[#ECEBE7] flex items-center gap-2 hover:bg-[#22211F] transition-colors">
                <span>{skill.name} · current</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C8A82]" />
              </button>
            </div>

            {/* Split Workspace Box */}
            <div className="flex flex-col md:flex-row rounded-2xl border border-[#282725] bg-[#141413] min-h-[520px] overflow-hidden shadow-xl">
              
              {/* Left File Explorer Column */}
              <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-[#201F1D] p-3 space-y-1 bg-[#161514]">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#201F1D] text-[#ECEBE7] text-xs font-mono font-medium shadow-xs">
                  <span>SKILL.md</span>
                </div>
              </div>

              {/* Right Document / Editor Column */}
              <div className="flex-1 flex flex-col bg-[#141413]">
                
                {/* File Header Bar */}
                <div className="h-10 px-5 border-b border-[#201F1D] flex items-center justify-between text-xs bg-[#161514]">
                  <span className="font-mono text-xs text-[#8C8A82]">/SKILL.md</span>

                  <div className="flex items-center bg-[#1C1B19] p-0.5 rounded-lg border border-[#282725]">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-[#282725] text-white shadow-xs'
                          : 'text-[#8C8A82] hover:text-[#ECEBE7]'
                      }`}
                      title="Preview formatted markdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'raw'
                          ? 'bg-[#282725] text-white shadow-xs'
                          : 'text-[#8C8A82] hover:text-[#ECEBE7]'
                      }`}
                      title="Edit raw markdown"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Render Area */}
                <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-h-[600px]">
                  {viewMode === 'raw' ? (
                    <div className="space-y-3 h-full">
                      <div className="text-[11px] text-[#706E68] flex items-center justify-between">
                        <span>Editing mode · changes auto-save</span>
                        <button
                          onClick={handleCopy}
                          className="text-[#8C8A82] hover:text-white flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <textarea
                        value={markdownContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="w-full h-[450px] bg-[#161514] border border-[#262522] rounded-xl p-4 text-[#ECEBE7] font-mono text-xs leading-relaxed outline-none focus:border-[#DA7756] resize-none"
                        placeholder="# Skill Name&#10;&#10;Write markdown instructions here..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-3xl">
                      {renderMarkdown(markdownContent)}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h2 className="text-sm font-semibold text-[#ECEBE7]">Delete {skill.name}?</h2>
            </div>

            <p className="text-xs text-[#8C8A82] leading-relaxed">
              Are you sure you want to remove <strong className="text-[#ECEBE7]">{skill.name}</strong>? This action will permanently remove it from your skills list.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#262522]">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-[#8C8A82] hover:bg-[#201F1D] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  onDelete(skill.id);
                }}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};