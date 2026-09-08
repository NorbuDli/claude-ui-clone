import React, { useState, useRef, useEffect, useMemo } from 'react';
import hljs from 'highlight.js';
import {
  X,
  Plus,
  Columns2,
  Maximize2,
  MoreHorizontal,
  Copy,
  Check,
  Save,
  Code
} from 'lucide-react';
import { CodeFile, CodeEditorSettings } from './types';

function getHljsLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'tsx':
      return 'tsx';
    case 'jsx':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'xml':
    case 'svg':
      return 'xml';
    default:
      return 'plaintext';
  }
}

interface CodeEditorProps {
  activeFile: CodeFile | null;
  openFiles: CodeFile[];
  unsavedFileIds: Set<string>;
  settings?: CodeEditorSettings;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  onCodeChange: (fileId: string, newContent: string) => void;
  onSaveFile: (fileId: string) => void;
  onNewTab?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  openFiles,
  unsavedFileIds,
  settings = { fontSize: 13, tabSize: 2, wordWrap: false, lineNumbers: true, autoFormat: true },
  onSelectTab,
  onCloseTab,
  onCodeChange,
  onSaveFile,
  onNewTab
}) => {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedFlash, setIsSavedFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Compute syntax highlighted HTML using highlight.js
  const highlightedCode = useMemo(() => {
    if (!activeFile) return '';
    const lang = getHljsLanguage(activeFile.name);
    try {
      if (lang !== 'plaintext' && hljs.getLanguage(lang)) {
        return hljs.highlight(activeFile.content, { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(activeFile.content).value;
    } catch {
      return activeFile.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [activeFile?.content, activeFile?.name]);

  // Synchronize scrolling of code highlight layer, textarea, and gutter
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = scrollTop;
      }
    }
  };

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

  const handleSave = () => {
    if (!activeFile) return;
    onSaveFile(activeFile.id);
    setIsSavedFlash(true);
    setTimeout(() => setIsSavedFlash(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeFile || !textareaRef.current) return;

    // Ctrl+S / Cmd+S to Save
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Support Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const val = activeFile.content;
      const spaces = ' '.repeat(settings.tabSize || 2);
      const updated = val.substring(0, start) + spaces + val.substring(end);
      onCodeChange(activeFile.id, updated);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + (settings.tabSize || 2);
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

  const lineCount = activeFile ? activeFile.content.split('\n').length : 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181816] text-[#ECEBE7] relative overflow-hidden select-none min-w-0">
      {/* ─── Top Tabs Bar (matching Image) ─── */}
      <div className="flex items-center justify-between bg-[#141413] border-b border-[#242320] px-1 h-9 select-none">
        {/* Open File Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar h-full space-x-0.5">
          {openFiles.map((file) => {
            const isActive = activeFile?.id === file.id;
            const isUnsaved = unsavedFileIds.has(file.id);

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
                {isUnsaved && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DA7756] shrink-0" title="Unsaved changes" />
                )}
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
            onClick={handleSave}
            className={`p-1 rounded hover:bg-[#201F1D] transition-colors flex items-center gap-1 text-xs ${
              isSavedFlash ? 'text-emerald-400' : 'text-[#8C8A82] hover:text-white'
            }`}
            title="Save file (Ctrl+S)"
          >
            {isSavedFlash ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          </button>
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
        <div className="flex-1 flex min-h-0 bg-[#1A1A18] relative overflow-hidden font-mono">
          {/* Line Numbers Gutter */}
          {settings.lineNumbers && (
            <div
              ref={gutterRef}
              className="w-12 py-3 bg-[#151513] text-[#55534E] text-right pr-3 select-none text-[13px] font-mono leading-5 shrink-0 border-r border-[#262522] overflow-hidden"
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div
                  key={i}
                  className={`h-5 ${cursorPos.line === i + 1 ? 'text-[#DA7756] font-semibold' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          {/* Code Container with Syntax Highlight Overlay and Editable Textarea */}
          <div className="flex-1 relative overflow-hidden h-full">
            {/* Syntax Highlighted View Layer */}
            <pre
              ref={preRef}
              className={`code-editor-syntax absolute inset-0 m-0 p-3 pointer-events-none font-mono leading-5 overflow-hidden select-none ${
                settings.wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
              }`}
              style={{
                tabSize: settings.tabSize || 2,
                fontSize: `${settings.fontSize}px`,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                lineHeight: '20px'
              }}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
            />

            {/* Editable Text Area (Directly on top, transparent text, colorful highlight shows through) */}
            <textarea
              ref={textareaRef}
              value={activeFile.content}
              onChange={(e) => onCodeChange(activeFile.id, e.target.value)}
              onKeyUp={handleCursorUpdate}
              onClick={handleCursorUpdate}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              className={`absolute inset-0 w-full h-full m-0 p-3 bg-transparent text-transparent caret-[#DA7756] font-mono leading-5 outline-none resize-none overflow-auto selection:bg-[#DA7756]/30 selection:text-transparent ${
                settings.wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
              }`}
              style={{
                tabSize: settings.tabSize || 2,
                fontSize: `${settings.fontSize}px`,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                lineHeight: '20px'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[#8C8A82]">
          No file selected. Select or create a file from the explorer on the left.
        </div>
      )}

      {/* ─── Bottom Status Bar (matching Image) ─── */}
      <div className="h-6 bg-[#161614] border-t border-[#242320] flex items-center justify-end px-4 gap-4 text-[11px] text-[#8C8A82] font-mono select-none">
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>Spaces: {settings.tabSize || 2}</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span className="text-[#ECEBE7]">{getLanguageLabel(activeFile)}</span>
      </div>
    </div>
  );
};
