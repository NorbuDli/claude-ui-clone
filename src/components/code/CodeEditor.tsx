import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Columns2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Copy,
  Check,
  Search,
  Code
} from 'lucide-react';
import { CodeFile } from './types';

interface CodeEditorProps {
  activeFile: CodeFile | null;
  openFiles: CodeFile[];
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  onCodeChange: (fileId: string, newContent: string) => void;
  onNewTab?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  openFiles,
  onSelectTab,
  onCloseTab,
  onCodeChange,
  onNewTab
}) => {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Update cursor line & column
  const handleCursorUpdate = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value.substring(0, textareaRef.current.selectionStart);
    const lines = text.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeFile || !textareaRef.current) return;

    // Support Tab indentation (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const val = activeFile.content;
      const updated = val.substring(0, start) + '  ' + val.substring(end);
      onCodeChange(activeFile.id, updated);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'tsx' || ext === 'jsx') return <span className="text-[#61DAFB] text-xs font-mono font-bold">⚛</span>;
    if (ext === 'ts') return <span className="text-[#3178C6] text-[10px] font-mono font-bold bg-[#1E293B] px-1 py-0.2 rounded">TS</span>;
    if (ext === 'css') return <span className="text-[#38BDF8] text-xs font-mono font-bold">#</span>;
    if (ext === 'json') return <span className="text-[#EAB308] text-xs font-mono font-bold">{'{ }'}</span>;
    return <Code className="w-3.5 h-3.5 text-[#8C8A82]" />;
  };

  const getLanguageLabel = (file: CodeFile | null) => {
    if (!file) return 'Plain Text';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'tsx') return 'TypeScript JSX';
    if (ext === 'ts') return 'TypeScript';
    if (ext === 'jsx') return 'JavaScript JSX';
    if (ext === 'js') return 'JavaScript';
    if (ext === 'css') return 'CSS';
    if (ext === 'json') return 'JSON';
    if (ext === 'md') return 'Markdown';
    return file.language || 'Plain Text';
  };

  // Syntax highlighter for rendered view behind textarea
  const renderHighlightedCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      // Tokenizer styling
      let processed = line
        // Comments
        .replace(/(\/\/.*$)/g, '<span style="color:#706E68;font-style:italic">$1</span>')
        // Keywords
        .replace(/\b(import|from|export|default|const|let|var|function|return|if|else|switch|case|async|await|try|catch|type|interface|class)\b/g, '<span style="color:#C678DD;font-weight:500">$1</span>')
        // Strings
        .replace(/(['"`][^'"`]*['"`])/g, '<span style="color:#98C379">$1</span>')
        // JSX Tags / Components
        .replace(/(&lt;|<)([A-Z][A-Za-z0-9]*)/g, '$1<span style="color:#61AFEF">$2</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span style="color:#D19A66">$1</span>');

      return (
        <div key={idx} className="h-5 leading-5 font-mono whitespace-pre text-[13px]">
          <span dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }} />
        </div>
      );
    });
  };

  const lineCount = activeFile ? activeFile.content.split('\n').length : 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181816] text-[#ECEBE7] relative overflow-hidden select-none min-w-0">
      
      {/* ─── Top Tabs Bar (matching Image) ─── */}
      <div className="flex items-center justify-between bg-[#141413] border-b border-[#242320] px-1 h-9 select-none">
        {/* Open File Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar h-full space-x-0.5">
          {openFiles.map((file) => {
            const isActive = activeFile?.id === file.id;
            return (
              <div
                key={file.id}
                onClick={() => onSelectTab(file.id)}
                className={`group flex items-center gap-2 px-3 h-full text-xs font-mono cursor-pointer border-r border-[#242320] transition-colors ${
                  isActive
                    ? 'bg-[#1E1E1C] text-white font-medium border-t-2 border-t-[#DA7756]'
                    : 'text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#1A1917]'
                }`}
              >
                {getFileIcon(file.name)}
                <span className="truncate max-w-[130px]">{file.name}</span>
                <button
                  onClick={(e) => onCloseTab(file.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#282725] text-[#8C8A82] hover:text-white transition-opacity"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {onNewTab && (
            <button
              onClick={onNewTab}
              className="p-1 text-[#8C8A82] hover:text-white hover:bg-[#1E1D1B] rounded ml-1"
              title="New tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Editor Controls */}
        <div className="flex items-center gap-1 text-[#8C8A82] px-2">
          <button
            onClick={handleCopyCode}
            className="p-1 hover:text-white rounded hover:bg-[#201F1D] transition-colors"
            title="Copy code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-[#201F1D]" title="Split Editor">
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-[#201F1D]" title="Maximize">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-[#201F1D]" title="More actions">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Editor Body (Line Numbers + Code Area) ─── */}
      {activeFile ? (
        <div className="flex-1 flex min-h-0 bg-[#1E1E1C] relative overflow-hidden font-mono">
          {/* Line Numbers Gutter */}
          <div className="w-12 py-3 bg-[#1A1A18] text-[#5E5C56] text-right pr-3 select-none text-[13px] font-mono leading-5 shrink-0 border-r border-[#262624]">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div
                key={i}
                className={`h-5 ${cursorPos.line === i + 1 ? 'text-[#ECEBE7] font-semibold' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Editable Text Area with Overlay */}
          <div className="flex-1 relative overflow-auto p-3">
            <textarea
              ref={textareaRef}
              value={activeFile.content}
              onChange={(e) => onCodeChange(activeFile.id, e.target.value)}
              onKeyUp={handleCursorUpdate}
              onClick={handleCursorUpdate}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-full bg-transparent text-[#ECEBE7] font-mono text-[13px] leading-5 outline-none resize-none selection:bg-[#DA7756]/40 tab-size-2"
              style={{
                tabSize: 2,
                caretColor: '#DA7756'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[#8C8A82]">
          No file selected. Select a file from the explorer on the left.
        </div>
      )}

      {/* ─── Bottom Status Bar (matching Image) ─── */}
      <div className="h-6 bg-[#161614] border-t border-[#242320] flex items-center justify-end px-4 gap-4 text-[11px] text-[#8C8A82] font-mono select-none">
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span className="text-[#ECEBE7]">{getLanguageLabel(activeFile)}</span>
      </div>
    </div>
  );
};
