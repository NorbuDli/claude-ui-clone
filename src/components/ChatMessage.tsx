import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import {
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCheck,
  FileText,
  AlertCircle,
  Edit2,
  Terminal,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Download
} from 'lucide-react';
import { Message, Artifact } from '../types';
import { useChat } from '../context/ChatContext';
import { ClaudeStarburst } from './ClaudeIcons';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

const THINKING_WORDS = [
  'Thinking',
  'Sleuthing',
  'Cooking',
  'Pondering',
  'Synthesizing',
  'Crafting',
  'Brewing',
  'Calculating',
  'Refining'
];

/**
 * Step-by-step execution timeline tree (matching Image 1 & 2)
 * Rendered dynamically for actual generated artifacts
 */
interface ExecutionTreeProps {
  artifacts: Artifact[];
}

export const ExecutionStepsTree: React.FC<ExecutionTreeProps> = ({ artifacts }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!artifacts || artifacts.length === 0) return null;

  const firstArtifact = artifacts[0];
  const fileTypeLabel = firstArtifact.type.includes('html')
    ? 'HTML'
    : firstArtifact.type.includes('react')
    ? 'React'
    : firstArtifact.language?.toUpperCase() || 'source';

  return (
    <div className="mb-3 text-xs select-none">
      {/* Expandable Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-[#8C8A82] hover:text-[#ECEBE7] transition-colors py-0.5 font-sans group"
        aria-expanded={isOpen}
      >
        <span className="text-[#8C8A82] group-hover:text-[#ECEBE7]">Ran a command, created a file, read a file</span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#706E68]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#706E68]" />
        )}
      </button>

      {/* Vertical Steps Tree */}
      {isOpen && (
        <div className="mt-3 ml-0.5 space-y-0 text-xs animate-in fade-in duration-150">
          {/* Step 1: Command */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-[#1D1C1A] border border-[#2B2A27] flex items-center justify-center text-[#8C8A82] shrink-0">
              <Terminal className="w-3 h-3" />
            </div>
            <span className="text-[#9C9A92] font-sans text-xs">Ensure workspace output directory exists</span>
          </div>

          {/* Connector Line 1 */}
          <div className="w-5 flex justify-center py-0.5">
            <div className="w-[1px] h-3.5 bg-[#2C2B28]" />
          </div>

          {/* Step 2: Real Generated Artifact File */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-[#1D1C1A] border border-[#2B2A27] flex items-center justify-center text-[#DA7756] shrink-0">
              <Code2 className="w-3 h-3" />
            </div>
            <span className="text-[#ECEBE7] font-medium font-sans text-xs">
              {firstArtifact.title} as a self-contained {fileTypeLabel} file
            </span>
          </div>

          {/* Connector Line 2 */}
          <div className="w-5 flex justify-center py-0.5">
            <div className="w-[1px] h-3.5 bg-[#2C2B28]" />
          </div>

          {/* Step 3: Presentation */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-[#1D1C1A] border border-[#2B2A27] flex items-center justify-center text-[#8C8A82] shrink-0">
              <FileCheck className="w-3 h-3" />
            </div>
            <span className="text-[#9C9A92] font-sans text-xs">Presented file</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface ClaudeThinkingStatusProps {
  customStatus?: string;
}

export const ClaudeThinkingStatus: React.FC<ClaudeThinkingStatusProps> = ({ customStatus }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % THINKING_WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const displayStatus = customStatus ? (customStatus.endsWith('...') ? customStatus : `${customStatus}...`) : `${THINKING_WORDS[index]}...`;

  return (
    <div className="flex items-center gap-2.5 py-2 text-xs text-[#9C9A92] select-none animate-in fade-in duration-300">
      <div className="animate-[spin_4s_linear_infinite] origin-center shrink-0">
        <ClaudeStarburst size={18} color="#DA7756" />
      </div>
      <span className="font-serif italic text-sm text-[#B4B3AD]">
        {displayStatus}
      </span>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast = false }) => {
  const {
    setActiveArtifact,
    setIsArtifactPaneOpen,
    activeArtifact,
    regenerateResponse,
    editUserMessage,
    retryLastRequest,
    isStreaming
  } = useChat();

  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const isUser = message.role === 'user';
  const hasArtifacts = Boolean(message.artifacts && message.artifacts.length > 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const cleanText = message.content.replace(/<[^>]*>/g, '').replace(/```[\s\S]*?```/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleDownloadArtifact = (art: Artifact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ext = art.type.includes('html') ? 'html' : art.type.includes('react') ? 'tsx' : art.type.includes('svg') ? 'svg' : 'txt';
    const blob = new Blob([art.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${art.identifier || 'artifact'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedContent.trim()) {
      editUserMessage(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleOpenArtifact = (art: Artifact) => {
    setActiveArtifact(art);
    setIsArtifactPaneOpen(true);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`py-4 px-3 sm:px-6 w-full max-w-3xl mx-auto group ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
      
      {/* 1. USER MESSAGE */}
      {isUser ? (
        <div className="flex flex-col items-end max-w-[85%] space-y-2">
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end mb-1">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 bg-[#1C1B19] border border-[#2B2A27] rounded-xl text-xs text-[#ECEBE7]"
                >
                  {att.dataUrl ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-12 h-12 object-cover rounded-lg border border-[#333]"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-[#DA7756]" />
                  )}
                  <span className="truncate max-w-[140px] text-xs font-mono">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="w-full min-w-[280px] bg-[#22211F] p-3 rounded-2xl border border-[#DA7756] space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-xs text-[#ECEBE7] focus:outline-none resize-none font-sans leading-relaxed"
                autoFocus
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg text-[#8C8A82] hover:bg-[#2A2926]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-[#DA7756] hover:bg-[#C86545] text-white font-medium shadow"
                >
                  Save & Submit
                </button>
              </div>
            </form>
          ) : (
            <div className="relative group/msg">
              <div className="bg-[#2C2A26] text-[#ECEBE7] px-4 py-2.5 rounded-2xl rounded-tr-md text-[14.5px] leading-relaxed whitespace-pre-wrap selection:bg-[#DA7756]/40 border border-[#3A3834]/60 shadow-xs">
                {message.content}
              </div>

              {/* Edit button on hover */}
              {!isStreaming && (
                <button
                  onClick={() => {
                    setEditedContent(message.content);
                    setIsEditing(true);
                  }}
                  className="opacity-0 group-hover/msg:opacity-100 absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#22211F] text-[#706E68] hover:text-[#ECEBE7] transition-all"
                  title="Edit message"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 2. ASSISTANT MESSAGE */
        <div className="w-full space-y-3 min-w-0">
          
          {/* Step-by-Step Execution Tree (for generated artifacts) */}
          {hasArtifacts && message.artifacts && (
            <ExecutionStepsTree artifacts={message.artifacts} />
          )}

          {/* Error Banner */}
          {message.error && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{message.error}</span>
              </div>
              <button
                onClick={retryLastRequest}
                className="px-2.5 py-1 rounded-lg bg-red-900/50 hover:bg-red-800/60 text-white font-medium text-[11px] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Main Conversational Markdown Text (matching Image 2 font style) */}
          {message.content && (
            <div className="claude-prose text-sm sm:text-base text-[#ECEBE7] font-serif leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }], rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    // If code has >= 6 lines or contains full app markup, hide code dump from chat bubble
                    if (!inline && (codeString.split('\n').length >= 6 || codeString.includes('<!DOCTYPE') || codeString.includes('<html') || codeString.includes('<canvas'))) {
                      return null;
                    }

                    if (!inline && match) {
                      return (
                        <div className="relative my-3 rounded-xl overflow-hidden bg-[#121211] border border-[#242320] group/code font-sans">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#181816] border-b border-[#242320] text-[11px] text-[#8C8A82]">
                            <span className="font-mono">{match[1]}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(codeString)}
                              className="flex items-center gap-1 hover:text-[#ECEBE7] transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code className="bg-[#242320] px-1.5 py-0.5 rounded text-xs font-mono text-[#DA7756]" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Active Thinking / Crafting Status during streaming */}
          {message.isStreaming && (
            <ClaudeThinkingStatus customStatus={message.thinkingStatus} />
          )}

          {/* Claude Artifact Card (matching Image 2) */}
          {message.artifacts && message.artifacts.length > 0 && (
            <div className="space-y-2 pt-1">
              {message.artifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleOpenArtifact(art)}
                  className="w-full rounded-2xl border border-[#2B2A27] bg-[#171615] hover:bg-[#1C1B19] hover:border-[#383733] transition-all p-3.5 flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Left Thumbnail icon box */}
                    <div className="w-11 h-11 rounded-xl bg-[#201F1D] border border-[#2D2C28] flex items-center justify-center text-[#DA7756] shrink-0 group-hover:scale-105 transition-transform">
                      <Code2 className="w-5 h-5" />
                    </div>
                    {/* Title & Subtitle */}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#ECEBE7] group-hover:text-[#DA7756] transition-colors truncate">
                        {art.title || 'Code Artifact'}
                      </div>
                      <div className="text-xs text-[#7E7C76] font-sans mt-0.5">
                        Code · {art.type.includes('html') ? 'HTML' : art.type.includes('react') ? 'React' : art.language?.toUpperCase() || 'Script'}
                      </div>
                    </div>
                  </div>

                  {/* Right Download Action Button */}
                  <button
                    onClick={(e) => handleDownloadArtifact(art, e)}
                    className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-xs font-medium text-[#ECEBE7] border border-[#302F2B] transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Toolbar (matching Image 2 bottom toolbar) */}
          {!message.isStreaming && (message.content || hasArtifacts) && (
            <div className="flex items-center gap-3 pt-2 text-[#706E68] text-xs select-none">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
                title="Copy message"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Read Aloud */}
              <button
                onClick={handleSpeak}
                className={`p-1 rounded-lg transition-colors ${
                  isSpeaking ? 'text-[#DA7756] bg-[#DA7756]/10' : 'hover:text-[#ECEBE7] hover:bg-[#201F1D]'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Thumbs Up */}
              <button
                onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                className={`p-1 rounded-lg transition-colors ${
                  feedback === 'like' ? 'text-emerald-400 bg-emerald-950/30' : 'hover:text-[#ECEBE7] hover:bg-[#201F1D]'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              {/* Thumbs Down */}
              <button
                onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                className={`p-1 rounded-lg transition-colors ${
                  feedback === 'dislike' ? 'text-red-400 bg-red-950/30' : 'hover:text-[#ECEBE7] hover:bg-[#201F1D]'
                }`}
                title="Poor response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {/* Regenerate */}
              {isLast && (
                <button
                  onClick={() => regenerateResponse(message.id)}
                  className="p-1 rounded-lg hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
                  title="Retry response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Timestamp */}
              <span className="text-[11px] text-[#555] font-sans ml-1">
                {formatTimeAgo(message.createdAt)}
              </span>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
