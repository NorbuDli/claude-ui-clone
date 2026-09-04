export interface CodeFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isFolder?: false;
  handle?: FileSystemFileHandle;
}

export interface CodeFolder {
  id: string;
  name: string;
  path: string;
  isFolder: true;
  children: Array<CodeFile | CodeFolder>;
  isOpen?: boolean;
  handle?: FileSystemDirectoryHandle;
}

export type FileSystemNode = CodeFile | CodeFolder;

export interface CodeProject {
  id: string;
  name: string;
  description?: string;
  isDemo?: boolean;
  isLocalDisk?: boolean;
  directoryHandle?: FileSystemDirectoryHandle;
  files: FileSystemNode[];
  activeFileId: string;
  openFileIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

export interface DiffProposal {
  id: string;
  fileId: string;
  filePath: string;
  originalContent: string;
  proposedContent: string;
  explanation: string;
  lines: DiffLine[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ConsoleLog {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface ProblemItem {
  id: string;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  diff?: DiffProposal;
  isThinking?: boolean;
  thinkingContent?: string;
  timestamp: number;
}

export interface CodeEditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  autoFormat: boolean;
}
