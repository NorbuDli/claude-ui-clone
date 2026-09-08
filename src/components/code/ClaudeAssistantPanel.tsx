import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  AlertTriangle,
  Sparkles,
  Paperclip,
  AtSign,
  Code,
  ArrowUp,
  History,
  X,
  ChevronDown,
  Trash2,
  Check,
  FilePlus,
  Edit2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { computeUnifiedDiff, extractCodeBlocksFromAIResponse, inferFileOperation } from './diffUtils';
import { CodeProject, CodeFile, DiffProposal, ConsoleLog, ProblemItem, AssistantMessage, FileOperationProposal } from './types';
import { ChatApiClient } from '../../services/apiClient';

interface ClaudeAssistantPanelProps {
  project: CodeProject;
  activeFile: CodeFile | null;
  consoleLogs: ConsoleLog[];
  problems: ProblemItem[];
  onClearLogs: () => void;
  onApplyDiff: (filePath: string, newContent: string) => void;
  onApplyFile?: (filePath: string, newContent: string) => void;
  onApplyMultipleFiles?: (files: Array<{ filePath: string; content: string }>) => void;
  onSelectFileByPath?: (filePath: string) => void;
}

const FileOperationCard: React.FC<{
  operation: FileOperationProposal;
  onAccept: (op: FileOperationProposal, customPath?: string) => void;
  onReject: (op: FileOperationProposal) => void;
}> = ({ operation, onAccept, onReject }) => {
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [currentPath, setCurrentPath] = useState(operation.filePath);
  const [showCode, setShowCode] = useState(operation.type === 'create');

  if (operation.status === 'accepted') {
    return (
      <div className="w-full max-w-xl p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {operation.type === 'create' ? 'Created file:' : 'Updated file:'}{' '}
            <strong className="font-mono text-white">{currentPath}</strong>
          </span>
        </div>
        <span className="text-[10px] bg-emerald-900/40 px-2 py-0.5 rounded font-medium">Applied</span>
      </div>
    );
  }

  if (operation.status === 'rejected') {
    return (
      <div className="w-full max-w-xl p-2.5 bg-[#1C1B19] border border-[#2B2A27] rounded-xl flex items-center justify-between text-xs text-[#706E68]">
        <div className="flex items-center gap-2">
          <X className="w-3.5 h-3.5" />
          <span>
            Dismissed {operation.type === 'create' ? 'new file' : 'changes to'}{' '}
            <span className="font-mono text-[#8C8A82]">{currentPath}</span>
          </span>
        </div>
      </div>
    );
  }

  if (operation.type === 'edit' && operation.diffLines && operation.diffLines.length > 0) {
    const diff: DiffProposal = {
      id: operation.id,
      fileId: operation.id,
      filePath: currentPath,
      originalContent: operation.originalContent || '',
      proposedContent: operation.proposedContent,
      explanation: operation.explanation,
      lines: operation.diffLines,
      status: operation.status
    };
    return (
      <div className="w-full max-w-xl space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[11px] text-[#8C8A82]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Modify file: <strong className="font-mono text-white">{currentPath}</strong></span>
          </span>
        </div>
        <DiffViewer
          diff={diff}
          onAccept={() => onAccept(operation, currentPath)}
          onReject={() => onReject(operation)}
        />
      </div>
    );
  }

  // New File Creation Card
  return (
    <div className="w-full max-w-xl bg-[#1C1B19] border border-[#2B2A27] rounded-xl overflow-hidden text-xs shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#22211F] border-b border-[#2B2A27]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <FilePlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          {isEditingPath ? (
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onBlur={() => setIsEditingPath(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingPath(false);
              }}
              autoFocus
              className="bg-[#141413] border border-[#DA7756] rounded px-1.5 py-0.5 text-xs text-white outline-none font-mono"
            />
          ) : (
            <span className="font-mono font-medium text-white truncate" title={currentPath}>
              {currentPath}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsEditingPath(!isEditingPath)}
            className="text-[#706E68] hover:text-white p-0.5"
            title="Edit target path / filename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded font-sans font-medium">
            New File
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="text-[11px] text-[#8C8A82] hover:text-white"
          >
            {showCode ? 'Hide Code' : 'View Code'}
          </button>
          <button
            type="button"
            onClick={() => onReject(operation)}
            className="px-2 py-1 text-[11px] rounded-lg text-[#8C8A82] hover:text-white hover:bg-[#2A2926] transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => onAccept(operation, currentPath)}
            className="px-3 py-1 rounded-lg bg-[#DA7756] hover:bg-[#C86545] text-white font-medium text-[11px] shadow flex items-center gap-1 transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>Create File</span>
          </button>
        </div>
      </div>

      {/* Code preview block */}
      {showCode && (
        <div className="p-3 bg-[#141413] max-h-48 overflow-auto font-mono text-[11px] text-[#C4C3BE] leading-relaxed border-t border-[#201F1D]">
          <pre className="whitespace-pre">{operation.proposedContent}</pre>
        </div>
      )}
    </div>
  );
};

export const ClaudeAssistantPanel: React.FC<ClaudeAssistantPanelProps> = ({
  project,
  activeFile,
  consoleLogs,
  problems,
  onClearLogs,
  onApplyDiff,
  onApplyFile,
  onApplyMultipleFiles,
  onSelectFileByPath
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'problems' | 'claude'>('claude');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Auto (Best Free Coding Model)');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Messages in Code Assistant
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `I am your Claude coding assistant for **${project.name}**. I have context on your project files and currently active file (\`${activeFile?.path || 'none'}\`). Ask me to write features, modify styling, debug errors, or generate diffs!`,
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiClient = useRef(new ChatApiClient());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isStreaming) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const assistantMsg: AssistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isThinking: true,
      thinkingContent: 'Analyzing project codebase and formulating solution...',
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Flatten files helper
    const getAllFiles = (nodes: any[]): CodeFile[] => {
      let list: CodeFile[] = [];
      for (const n of nodes) {
        if (!n.isFolder) {
          list.push(n);
        } else if (n.children) {
          list = list.concat(getAllFiles(n.children));
        }
      }
      return list;
    };

    const allProjectFiles = getAllFiles(project.files);
    const fileListStr = allProjectFiles.map(f => f.path).join(', ');

    // Build context with current active file and project structure
    const codeContext = activeFile
      ? `Active File: ${activeFile.path}\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``
      : `Project: ${project.name}`;

    const systemPrompt = `You are Claude Code Assistant, an expert AI software engineer pair programming on the project "${project.name}".

Project files:
${fileListStr || 'None yet'}

${codeContext}

CRITICAL RULES FOR CODE AND FILE GENERATION:
1. When creating or updating files, ALWAYS specify the target file path in the code block header.
   Examples:
   \`\`\`html:index.html
   \`\`\`css:style.css
   \`\`\`javascript:game.js
   \`\`\`tsx:src/App.tsx
2. For web games (like Snake, Pong, Breakout, Tetris) or vanilla web applications:
   - Provide complete, self-contained files: \`index.html\`, \`style.css\`, and \`game.js\` (or a complete standalone \`index.html\`).
   - If using \`index.html\`, include the HTML structure, canvas or container elements, and script/style tags.
3. For React components:
   - Provide complete, runnable components in \`src/App.tsx\` or subcomponents in \`src/components/...\`.
4. All code blocks you output are automatically parsed and immediately created/updated as files in the active project directory, and instantly executed in the Live Preview!
5. Provide complete, working, bug-free code with no placeholders or missing functions.`;

    let accumulatedText = '';
    let accumulatedThinking = '';

    try {
      await apiClient.current.streamChat(
        [
          { id: '1', role: 'user', content: `${userText}\n\n[Context]\n${codeContext}`, createdAt: Date.now() }
        ],
        'sonnet-5',
        systemPrompt,
        {
          onThinkingChunk: (chunk) => {
            accumulatedThinking += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, thinkingContent: accumulatedThinking, isThinking: true }
                  : m
              )
            );
          },
          onTextChunk: (chunk) => {
            accumulatedText += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: accumulatedText, isThinking: false }
                  : m
              )
            );
          },
          onDone: () => {
            setIsStreaming(false);

            if (accumulatedText) {
              const currentFiles = getAllFiles(project.files);
              const codeBlocks = extractCodeBlocksFromAIResponse(accumulatedText);
              if (codeBlocks.length > 0) {
                const operations: FileOperationProposal[] = codeBlocks.map((block) =>
                  inferFileOperation(block, currentFiles, activeFile)
                );

                // Auto-apply all generated files immediately to the project
                const filesToApply = operations.map((op) => ({
                  filePath: op.filePath,
                  content: op.proposedContent
                }));

                if (onApplyMultipleFiles) {
                  onApplyMultipleFiles(filesToApply);
                } else {
                  for (const f of filesToApply) {
                    if (onApplyFile) {
                      onApplyFile(f.filePath, f.content);
                    } else {
                      onApplyDiff(f.filePath, f.content);
                    }
                  }
                }

                // Mark the operations as accepted since they are now applied
                const acceptedOps: FileOperationProposal[] = operations.map((op) => ({
                  ...op,
                  status: 'accepted'
                }));

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, fileOperations: acceptedOps }
                      : m
                  )
                );
              }
            }
          },
          onError: (err) => {
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: `Error: ${err.message}`, isThinking: false }
                  : m
              )
            );
          }
        }
      );
    } catch (err: any) {
      setIsStreaming(false);
    }
  };

  const handleAcceptOperation = (op: FileOperationProposal, customPath?: string) => {
    const targetPath = customPath || op.filePath;
    if (onApplyFile) {
      onApplyFile(targetPath, op.proposedContent);
    } else {
      onApplyDiff(targetPath, op.proposedContent);
    }

    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        fileOperations: m.fileOperations?.map((o) =>
          o.id === op.id ? { ...o, status: 'accepted' as const, filePath: targetPath } : o
        )
      }))
    );
  };

  const handleRejectOperation = (op: FileOperationProposal) => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        fileOperations: m.fileOperations?.map((o) =>
          o.id === op.id ? { ...o, status: 'rejected' as const } : o
        )
      }))
    );
  };

  const handleApplyAllOperations = (operations: FileOperationProposal[]) => {
    for (const op of operations) {
      if (op.status === 'pending') {
        if (onApplyFile) {
          onApplyFile(op.filePath, op.proposedContent);
        } else {
          onApplyDiff(op.filePath, op.proposedContent);
        }
      }
    }
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        fileOperations: m.fileOperations?.map((o) => ({ ...o, status: 'accepted' as const }))
      }))
    );
  };

  const handleAcceptDiff = (diff: DiffProposal) => {
    if (onApplyFile) {
      onApplyFile(diff.filePath, diff.proposedContent);
    } else {
      onApplyDiff(diff.filePath, diff.proposedContent);
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.diff?.id === diff.id
          ? { ...m, diff: { ...m.diff, status: 'accepted' } }
          : m
      )
    );
  };

  const handleRejectDiff = (diff: DiffProposal) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.diff?.id === diff.id
          ? { ...m, diff: { ...m.diff, status: 'rejected' } }
          : m
      )
    );
  };

  if (isCollapsed) {
    return (
      <div className="h-9 bg-[#141413] border-t border-[#242320] flex items-center justify-between px-4 text-xs select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveTab('claude');
              setIsCollapsed(false);
            }}
            className="flex items-center gap-1.5 text-[#DA7756] font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Claude Assistant</span>
          </button>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-xs text-[#8C8A82] hover:text-white"
        >
          Expand Panel ▲
        </button>
      </div>
    );
  }

  return (
    <div className="h-64 sm:h-72 lg:h-80 bg-[#141413] border-t border-[#242320] flex flex-col select-none shrink-0">
      {/* ─── Top Tabs Bar (matching Image) ─── */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-[#242320] bg-[#141413]">
        {/* Tabs: Console, Problems, Claude */}
        <div className="flex items-center gap-6 text-xs">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 h-9 border-b-2 transition-colors ${
              activeTab === 'console'
                ? 'border-[#DA7756] text-white font-medium'
                : 'border-transparent text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
            {consoleLogs.length > 0 && (
              <span className="text-[10px] bg-[#22211F] text-[#8C8A82] px-1.5 py-0.2 rounded-full font-mono">
                {consoleLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center gap-1.5 h-9 border-b-2 transition-colors ${
              activeTab === 'problems'
                ? 'border-[#DA7756] text-white font-medium'
                : 'border-transparent text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Problems</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              problems.length > 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-[#22211F] text-[#8C8A82]'
            }`}>
              {problems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('claude')}
            className={`flex items-center gap-1.5 h-9 border-b-2 transition-colors ${
              activeTab === 'claude'
                ? 'border-[#DA7756] text-white font-medium'
                : 'border-transparent text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DA7756]" />
            <span>Claude</span>
          </button>
        </div>

        {/* Right Tools (History, Minimize) */}
        <div className="flex items-center gap-2 text-[#8C8A82]">
          <button
            onClick={() => alert('Code Assistant Conversation History')}
            className="p-1 hover:text-white rounded hover:bg-[#1E1D1B]"
            title="History"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:text-white rounded hover:bg-[#1E1D1B]"
            title="Collapse panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Tab Content Area ─── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* 1. CONSOLE TAB (Real Logs) */}
        {activeTab === 'console' && (
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 bg-[#10100F] text-[#ECEBE7]">
            <div className="flex justify-between items-center pb-2 border-b border-[#201F1D]">
              <span className="text-[11px] text-[#706E68]">Project Runtime & Preview Console</span>
              <button
                onClick={onClearLogs}
                className="text-[11px] text-[#8C8A82] hover:text-white flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear logs
              </button>
            </div>
            {consoleLogs.length === 0 ? (
              <div className="py-6 text-center text-[#666] text-xs">No console logs yet. Logs from preview and builds appear here.</div>
            ) : (
              consoleLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[#555] select-none text-[11px] shrink-0">{log.timestamp}</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-[#C4C3BE]'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. PROBLEMS TAB (Real Diagnostics) */}
        {activeTab === 'problems' && (
          <div className="flex-1 p-4 overflow-y-auto text-xs bg-[#10100F] space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#201F1D]">
              <p className="text-xs text-[#8C8A82]">
                {problems.length === 0 ? 'No problems detected in project files' : `${problems.length} problem(s) detected`}
              </p>
            </div>

            {problems.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#666]">
                ✓ All project files compiled with zero errors.
              </div>
            ) : (
              problems.map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => onSelectFileByPath?.(prob.file)}
                  className="p-2.5 rounded-xl bg-[#1C1B19] border border-[#2B2A27] hover:border-[#DA7756]/60 cursor-pointer flex items-start gap-3 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-white">{prob.message}</p>
                    <p className="text-[11px] text-[#8C8A82] font-mono mt-0.5">
                      {prob.file} [Line {prob.line}, Col {prob.column}]
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. CLAUDE CODING ASSISTANT TAB */}
        {activeTab === 'claude' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#141413]">
            {/* Header prompt suggestion (matching Image) */}
            <div className="px-4 pt-2 pb-1 text-xs text-[#8C8A82] flex items-center gap-1.5 select-none shrink-0">
              <span className="text-[#DA7756] font-bold">»</span>
              <span>How can Claude help you with your code?</span>
            </div>

            {/* Chat Turn Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.isThinking && (
                    <div className="text-xs text-[#DA7756] animate-pulse flex items-center gap-1.5 mb-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{msg.thinkingContent || 'Thinking...'}</span>
                    </div>
                  )}

                  {msg.content && (
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-[#2C2A26] text-white border border-[#3A3834]/60'
                          : 'bg-[#1C1B19] text-[#ECEBE7] border border-[#2B2A27]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}

                  {/* Multi-File Operations & Creation Cards */}
                  {msg.fileOperations && msg.fileOperations.length > 0 && (
                    <div className="w-full max-w-xl space-y-2 mt-2">
                      {msg.fileOperations.filter(o => o.status === 'pending').length > 1 && (
                        <div className="flex items-center justify-between p-2.5 bg-[#1C1B19] border border-[#DA7756]/40 rounded-xl">
                          <span className="text-xs text-[#ECEBE7] font-medium flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#DA7756]" />
                            <span>Claude proposed {msg.fileOperations.length} files</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyAllOperations(msg.fileOperations || [])}
                            className="px-3 py-1 rounded-lg bg-[#DA7756] hover:bg-[#C86545] text-white font-medium text-[11px] shadow transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Apply All Files</span>
                          </button>
                        </div>
                      )}
                      {msg.fileOperations.map((op) => (
                        <FileOperationCard
                          key={op.id}
                          operation={op}
                          onAccept={handleAcceptOperation}
                          onReject={handleRejectOperation}
                        />
                      ))}
                    </div>
                  )}

                  {/* Fallback Diff Viewer if singular diff proposal */}
                  {!msg.fileOperations && msg.diff && (
                    <div className="w-full max-w-xl mt-2">
                      <DiffViewer
                        diff={msg.diff}
                        onAccept={handleAcceptDiff}
                        onReject={handleRejectDiff}
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Input Container (matching Image 100%) */}
            <form onSubmit={handleSendMessage} className="p-3 pt-1 border-t border-[#201F1D]">
              <div className="bg-[#1C1B19] border border-[#2B2A27] focus-within:border-[#DA7756]/60 rounded-2xl p-2.5 flex flex-col gap-2 shadow-xs transition-colors">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask Claude to modify your code, explain something, or debug an issue..."
                  className="w-full bg-transparent text-xs text-[#ECEBE7] placeholder-[#706E68] outline-none font-sans"
                />

                <div className="flex items-center justify-between pt-1">
                  {/* Left Attachment / Context Tools */}
                  <div className="flex items-center gap-1 text-[#8C8A82]">
                    <button
                      type="button"
                      onClick={() => alert(`Active file context attached: ${activeFile?.path || 'No active file'}`)}
                      className="p-1.5 hover:text-[#ECEBE7] hover:bg-[#262522] rounded-lg transition-colors"
                      title="Attach file context"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputPrompt(prev => prev + ' @' + (activeFile?.name || 'src/App.tsx'))}
                      className="p-1.5 hover:text-[#ECEBE7] hover:bg-[#262522] rounded-lg transition-colors"
                      title="Mention file or symbol (@)"
                    >
                      <AtSign className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputPrompt(prev => prev + '\n```tsx\n\n```')}
                      className="p-1.5 hover:text-[#ECEBE7] hover:bg-[#262522] rounded-lg transition-colors"
                      title="Insert code snippet"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right Model Selector & Send Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-1 text-xs text-[#8C8A82] hover:text-[#ECEBE7] px-2 py-1 rounded-lg hover:bg-[#262522] transition-colors"
                      >
                        <span>{selectedModel}</span>
                        <ChevronDown className="w-3 h-3 text-[#706E68]" />
                      </button>

                      {isModelDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-1 w-56 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs">
                          {['Auto (Best Free Coding Model)', 'Poolside Laguna S 2.1 (Free)', 'Cohere North Mini Code (Free)', 'MiniMax M3 (Free)'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSelectedModel(m);
                                setIsModelDropdownOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-[#ECEBE7] flex items-center justify-between"
                            >
                              <span>{m}</span>
                              {selectedModel === m && <Check className="w-3 h-3 text-[#DA7756]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!inputPrompt.trim() || isStreaming}
                      className="w-7 h-7 rounded-xl bg-[#DA7756] hover:bg-[#C86545] disabled:opacity-40 text-white flex items-center justify-center shadow transition-all active:scale-95"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
