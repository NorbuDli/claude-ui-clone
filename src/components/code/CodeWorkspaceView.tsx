import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Share2,
  Plus,
  Check,
  UploadCloud,
  FilePlus,
  X,
  Code2,
  FolderOpen,
  FileText,
  Download,
  Folder,
  Settings,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { ClaudeAssistantPanel } from './ClaudeAssistantPanel';
import { CodeSettingsDialog } from './CodeSettingsDialog';
import {
  openLocalFilesNative,
  openLocalFolderNative,
  buildTreeFromFileList,
  importZipProject,
  exportProjectAsZip,
  saveFileDirectToDisk
} from './fileSystemUtils';
import { DEFAULT_CODE_PROJECTS, findFileById, updateFileContentInTree } from './defaultProjects';
import { CodeProject, CodeFile, ConsoleLog, ProblemItem, CodeEditorSettings } from './types';

const STORAGE_KEY = 'claude_code_projects_v3';
const SETTINGS_KEY = 'claude_code_settings_v1';

export const CodeWorkspaceView: React.FC = () => {
  // Load saved projects from localStorage (starts empty if no saved projects)
  const [projects, setProjects] = useState<CodeProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return []; // No default demo project! Starts in State A (No Project Open)
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return null;
  });

  const [unsavedFileIds, setUnsavedFileIds] = useState<Set<string>>(new Set());

  // Editor Settings
  const [editorSettings, setEditorSettings] = useState<CodeEditorSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fontSize: 13,
      tabSize: 2,
      wordWrap: false,
      lineNumbers: true,
      autoFormat: true
    };
  });

  // Real Console Logs & Problems State
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    {
      id: 'init-log-1',
      type: 'info',
      message: 'Code Workspace initialized. Ready for local files or project import.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [problems, setProblems] = useState<ProblemItem[]>([]);

  // Modals & Dropdowns
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<'blank' | 'html' | 'react'>('react');

  // Fallback hidden inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Persist projects to localStorage (excluding FileSystemHandle objects which cannot be serialized)
  useEffect(() => {
    try {
      // Strip handles before serializing
      const cleanProjects = projects.map(p => ({
        ...p,
        directoryHandle: undefined,
        files: sanitizeTreeForStorage(p.files)
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanProjects));
    } catch (err) {
      console.warn('Could not persist projects:', err);
    }
  }, [projects]);

  function sanitizeTreeForStorage(nodes: any[]): any[] {
    return nodes.map(n => {
      if (n.isFolder) {
        return {
          id: n.id,
          name: n.name,
          path: n.path,
          isFolder: true,
          isOpen: n.isOpen,
          children: sanitizeTreeForStorage(n.children || [])
        };
      }
      return {
        id: n.id,
        name: n.name,
        path: n.path,
        content: n.content,
        language: n.language
      };
    });
  }

  // Persist settings
  const handleUpdateSettings = (updated: Partial<CodeEditorSettings>) => {
    setEditorSettings((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentProject = projects.find((p) => p.id === activeProjectId) || null;

  const activeFile = currentProject && currentProject.activeFileId
    ? findFileById(currentProject.files, currentProject.activeFileId)
    : null;

  const openFiles = currentProject
    ? currentProject.openFileIds
        .map((id) => findFileById(currentProject.files, id))
        .filter((f): f is CodeFile => Boolean(f))
    : [];

  // ─── 1. Open Local File(s) ───
  const handleOpenLocalFiles = async () => {
    const res = await openLocalFilesNative();
    if (res) {
      createAndSwitchToProject(res.name, res.files, true);
    } else {
      // Fallback
      fileInputRef.current?.click();
    }
  };

  // ─── 2. Open Local Folder ───
  const handleOpenLocalFolder = async () => {
    const res = await openLocalFolderNative();
    if (res) {
      createAndSwitchToProject(res.name, res.files, true, res.handle);
    } else {
      // Fallback
      folderInputRef.current?.click();
    }
  };

  // ─── 3. Import ZIP ───
  const handleImportZipClick = () => {
    zipInputRef.current?.click();
  };

  const handleZipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importZipProject(file);
      createAndSwitchToProject(res.name, res.files, false);
      e.target.value = '';
    } catch (err: any) {
      alert(`Could not extract ZIP file: ${err.message}`);
    }
  };

  // ─── 4. Fallback File Input Change ───
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const res = await buildTreeFromFileList(e.target.files);
    createAndSwitchToProject(res.name, res.files, false);
    e.target.value = '';
  };

  // ─── 5. Helper: Create & Switch to Project ───
  const createAndSwitchToProject = (
    name: string,
    files: any[],
    isLocalDisk: boolean,
    directoryHandle?: FileSystemDirectoryHandle
  ) => {
    // Pick active file (e.g. App.tsx, index.tsx, index.html, or first file)
    let firstFileId = '';
    const findFirst = (nodes: any[]): string => {
      for (const n of nodes) {
        if (!n.isFolder) return n.id;
        if (n.children) {
          const f = findFirst(n.children);
          if (f) return f;
        }
      }
      return '';
    };

    firstFileId = findFirst(files);

    const newProj: CodeProject = {
      id: `proj-${Date.now()}`,
      name,
      files,
      isLocalDisk,
      directoryHandle,
      activeFileId: firstFileId,
      openFileIds: firstFileId ? [firstFileId] : [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setUnsavedFileIds(new Set());

    setConsoleLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        message: `✓ Opened project "${name}" with ${countFiles(files)} files.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  function countFiles(nodes: any[]): number {
    let count = 0;
    for (const n of nodes) {
      if (!n.isFolder) count++;
      else if (n.children) count += countFiles(n.children);
    }
    return count;
  }

  // ─── 6. Load Sample Project (Optional for testing) ───
  const handleLoadSampleProject = () => {
    const sample = DEFAULT_CODE_PROJECTS[0];
    const newProj: CodeProject = {
      ...sample,
      id: `proj-sample-${Date.now()}`,
      name: 'Website Redesign (Sample)',
      isDemo: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
  };

  // ─── 7. Close Current Project (Return to State A) ───
  const handleCloseProject = () => {
    if (!currentProject) return;
    setProjects((prev) => prev.filter((p) => p.id !== currentProject.id));
    setActiveProjectId(null);
  };

  // ─── 8. Export Project as ZIP ───
  const handleExportProject = async () => {
    if (!currentProject) return;
    await exportProjectAsZip(currentProject);
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        message: `✓ Exported "${currentProject.name}.zip"`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // ─── File Navigation & Tab Operations ───
  const handleSelectFile = (fileId: string) => {
    if (!currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const openFileIds = proj.openFileIds.includes(fileId)
          ? proj.openFileIds
          : [...proj.openFileIds, fileId];
        return { ...proj, activeFileId: fileId, openFileIds };
      })
    );
  };

  const handleCloseTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const openFileIds = proj.openFileIds.filter((id) => id !== fileId);
        const newActiveId =
          proj.activeFileId === fileId
            ? openFileIds[openFileIds.length - 1] || ''
            : proj.activeFileId;
        return { ...proj, openFileIds, activeFileId: newActiveId };
      })
    );
  };

  // ─── In-Memory Code Editing ───
  const handleCodeChange = (fileId: string, newContent: string) => {
    if (!currentProject) return;
    setUnsavedFileIds((prev) => new Set(prev).add(fileId));
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedFiles = updateFileContentInTree(proj.files, fileId, newContent);
        return { ...proj, files: updatedFiles, updatedAt: Date.now() };
      })
    );
  };

  // ─── Save File (Real Disk Write or Workspace State) ───
  const handleSaveFile = async (fileId: string) => {
    if (!currentProject) return;
    const file = findFileById(currentProject.files, fileId);
    if (!file) return;

    let savedToDisk = false;
    if (file.handle) {
      savedToDisk = await saveFileDirectToDisk(file, file.content);
    }

    setUnsavedFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });

    setConsoleLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        message: savedToDisk
          ? `✓ Saved ${file.name} directly to local disk`
          : `✓ Saved ${file.name} to workspace (use Export to download)`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // ─── Apply Diff from Claude AI ───
  const handleApplyDiff = (filePath: string, newContent: string) => {
    if (!currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const findAndReplace = (nodes: any[]): any[] => {
          return nodes.map((node) => {
            if (!node.isFolder && node.path === filePath) {
              return { ...node, content: newContent };
            }
            if (node.isFolder && node.children) {
              return { ...node, children: findAndReplace(node.children) };
            }
            return node;
          });
        };
        return { ...proj, files: findAndReplace(proj.files), updatedAt: Date.now() };
      })
    );

    setConsoleLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        message: `✓ Applied AI modification to ${filePath}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // ─── File CRUD ───
  const handleCreateFile = (name: string) => {
    if (!currentProject) return;
    const ext = name.split('.').pop() || '';
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name,
      path: name,
      language: ext.includes('ts') || ext.includes('js') ? 'typescript' : ext.includes('css') ? 'css' : ext.includes('html') ? 'html' : 'plaintext',
      content: ''
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedFiles = [...proj.files, newFile];
        return {
          ...proj,
          files: updatedFiles,
          activeFileId: newFile.id,
          openFileIds: [...proj.openFileIds, newFile.id]
        };
      })
    );
  };

  const handleCreateFolder = (name: string) => {
    if (!currentProject) return;
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      path: name,
      isFolder: true as const,
      isOpen: true,
      children: []
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        return { ...proj, files: [...proj.files, newFolder] };
      })
    );
  };

  const handleDeleteNode = (id: string) => {
    if (!currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const filterTree = (nodes: any[]): any[] => {
          return nodes
            .filter((n) => n.id !== id)
            .map((n) => (n.isFolder ? { ...n, children: filterTree(n.children) } : n));
        };
        const files = filterTree(proj.files);
        const openFileIds = proj.openFileIds.filter((fid) => fid !== id);
        const activeFileId = proj.activeFileId === id ? openFileIds[0] || '' : proj.activeFileId;
        return { ...proj, files, openFileIds, activeFileId };
      })
    );
  };

  const handleRenameNode = (id: string, newName: string) => {
    if (!currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const renameInTree = (nodes: any[]): any[] => {
          return nodes.map((n) => {
            if (n.id === id) return { ...n, name: newName };
            if (n.isFolder && n.children) return { ...n, children: renameInTree(n.children) };
            return n;
          });
        };
        return { ...proj, files: renameInTree(proj.files) };
      })
    );
  };

  // ─── New Project Modal Submission ───
  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    let initialFiles: CodeFile[] = [];

    if (newProjectTemplate === 'blank') {
      initialFiles = [
        {
          id: `file-${Date.now()}-1`,
          name: 'README.md',
          path: 'README.md',
          language: 'markdown',
          content: `# ${newProjectName.trim()}\n\nProject created in Claude Code.`
        }
      ];
    } else if (newProjectTemplate === 'html') {
      initialFiles = [
        {
          id: `file-${Date.now()}-1`,
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>${newProjectName.trim()}</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div style="padding: 40px; text-align: center;">\n    <h1>Hello World</h1>\n    <p>Welcome to ${newProjectName.trim()}</p>\n  </div>\n  <script src="app.js"></script>\n</body>\n</html>`
        },
        {
          id: `file-${Date.now()}-2`,
          name: 'styles.css',
          path: 'styles.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  padding: 0;\n  background: #141413;\n  color: #ECEBE7;\n  font-family: sans-serif;\n}`
        },
        {
          id: `file-${Date.now()}-3`,
          name: 'app.js',
          path: 'app.js',
          language: 'javascript',
          content: `console.log('${newProjectName.trim()} ready.');`
        }
      ];
    } else {
      // React / Vite
      initialFiles = [
        {
          id: `file-${Date.now()}-1`,
          name: 'App.tsx',
          path: 'src/App.tsx',
          language: 'typescriptreact',
          content: `import React, { useState } from 'react';\n\nexport const App: React.FC = () => {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="min-h-screen bg-[#141413] text-[#ECEBE7] flex flex-col items-center justify-center p-8 text-center">\n      <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">\n        ${newProjectName.trim()}\n      </h1>\n      <p className="text-sm text-[#A5A39C] max-w-sm mb-6">\n        A modern React application. Edit App.tsx and see preview update live.\n      </p>\n      <button\n        onClick={() => setCount(c => c + 1)}\n        className="px-4 py-2 rounded-xl bg-[#DA7756] hover:bg-[#C86545] text-white font-medium text-xs shadow transition-all"\n      >\n        Clicked {count} times\n      </button>\n    </div>\n  );\n};\n\nexport default App;`
        },
        {
          id: `file-${Date.now()}-2`,
          name: 'styles.css',
          path: 'src/styles.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  padding: 0;\n  background: #141413;\n  color: #ECEBE7;\n}`
        }
      ];
    }

    createAndSwitchToProject(newProjectName.trim(), initialFiles, false);
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-hidden select-none">
      {/* Hidden File / Folder / ZIP Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: '', directory: '' } as any)}
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleZipFileSelected}
      />

      {/* ─── Top Header (Consistent in Both States) ─── */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#141413] border-b border-[#242320] select-none shrink-0">
        {/* Left: "Code | [Project Name ⌄]" */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-[#ECEBE7] tracking-tight">Code</span>

          {currentProject && (
            <>
              <span className="text-[#3A3834]">|</span>

              {/* Project Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs text-[#ECEBE7] hover:text-white px-2.5 py-1 rounded-xl hover:bg-[#1E1D1B] transition-colors font-medium"
                >
                  <span className="truncate max-w-[180px]">{currentProject.name}</span>
                  {currentProject.isDemo && (
                    <span className="text-[10px] bg-[#2A2926] text-[#DA7756] px-1.5 py-0.2 rounded font-mono border border-[#3A3834]">
                      Sample
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C8A82]" />
                </button>

                {isProjectDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-0.5">
                    <div className="px-2 py-1 text-[11px] text-[#706E68] font-semibold uppercase tracking-wider">
                      Workspaces
                    </div>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          p.id === currentProject.id
                            ? 'bg-[#262522] text-white font-medium'
                            : 'text-[#8C8A82] hover:bg-[#201F1D] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {p.id === currentProject.id && <Check className="w-3.5 h-3.5 text-[#DA7756]" />}
                      </button>
                    ))}
                    <div className="my-1 border-t border-[#262522]" />
                    <button
                      onClick={() => {
                        handleExportProject();
                        setIsProjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8C8A82]" />
                      <span>Export Project (ZIP)</span>
                    </button>
                    <button
                      onClick={() => {
                        handleCloseProject();
                        setIsProjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-left text-red-400"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Close Project</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {currentProject && (
            <button
              onClick={handleExportProject}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] text-xs font-medium text-[#ECEBE7] transition-colors"
              title="Export project as ZIP"
            >
              <Download className="w-3.5 h-3.5 text-[#8C8A82]" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Workspace link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] text-xs font-medium text-[#ECEBE7] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-[#8C8A82]" />
            <span>Share</span>
          </button>

          {/* New ⌄ Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow transition-all active:scale-95"
            >
              <span>New</span>
              <ChevronDown className="w-3.5 h-3.5 text-black/80" />
            </button>

            {isNewMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                <button
                  onClick={() => {
                    handleOpenLocalFolder();
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#DA7756]" />
                  <span>Open Folder</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenLocalFiles();
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FileText className="w-3.5 h-3.5 text-[#8C8A82]" />
                  <span>Open File</span>
                </button>
                <button
                  onClick={() => {
                    handleImportZipClick();
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#8C8A82]" />
                  <span>Import Project (ZIP)</span>
                </button>
                <div className="my-0.5 border-t border-[#262522]" />
                <button
                  onClick={() => {
                    setIsNewProjectModalOpen(true);
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#DA7756]" />
                  <span>New Project</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BODY: STATE A (NO PROJECT OPEN) vs STATE B (PROJECT OPEN) ─── */}
      {!currentProject ? (
        /* ══════════════════════════════════════════════════════════════════
           STATE A — NO PROJECT OPEN (Clean, Functional, Elegant Empty State)
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center overflow-y-auto">
          <div className="max-w-lg w-full space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1B19] border border-[#2B2A27] flex items-center justify-center mx-auto shadow-xl">
              <Code2 className="w-7 h-7 text-[#DA7756]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                No project open
              </h2>
              <p className="text-xs sm:text-sm text-[#8C8A82] leading-relaxed max-w-sm mx-auto">
                Open a local folder to start working with your code, import a ZIP project, or create a new workspace.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              <button
                onClick={handleOpenLocalFolder}
                className="p-4 rounded-2xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] hover:border-[#DA7756]/60 transition-all group flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <FolderOpen className="w-5 h-5 text-[#DA7756]" />
                  <ArrowRight className="w-4 h-4 text-[#706E68] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Open Folder</h4>
                  <p className="text-[11px] text-[#8C8A82] mt-0.5">Select a local project directory</p>
                </div>
              </button>

              <button
                onClick={handleOpenLocalFiles}
                className="p-4 rounded-2xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] hover:border-[#DA7756]/60 transition-all group flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-5 h-5 text-[#3178C6]" />
                  <ArrowRight className="w-4 h-4 text-[#706E68] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Open File</h4>
                  <p className="text-[11px] text-[#8C8A82] mt-0.5">Edit individual files directly</p>
                </div>
              </button>

              <button
                onClick={handleImportZipClick}
                className="p-4 rounded-2xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] hover:border-[#DA7756]/60 transition-all group flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <UploadCloud className="w-5 h-5 text-[#EAB308]" />
                  <ArrowRight className="w-4 h-4 text-[#706E68] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Import Project</h4>
                  <p className="text-[11px] text-[#8C8A82] mt-0.5">Upload and extract a ZIP archive</p>
                </div>
              </button>

              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-4 rounded-2xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] hover:border-[#DA7756]/60 transition-all group flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <FilePlus className="w-5 h-5 text-emerald-400" />
                  <ArrowRight className="w-4 h-4 text-[#706E68] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">New Project</h4>
                  <p className="text-[11px] text-[#8C8A82] mt-0.5">Create blank, HTML, or React app</p>
                </div>
              </button>
            </div>

            {/* Optional helper link for quick testing */}
            <div className="pt-4 border-t border-[#201F1D] flex items-center justify-center gap-2">
              <button
                onClick={handleLoadSampleProject}
                className="text-[11px] text-[#706E68] hover:text-[#DA7756] transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Or load sample project template for testing</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           STATE B — PROJECT OPEN (File Explorer + Editor + Preview + Claude)
           ══════════════════════════════════════════════════════════════════ */
        <>
          {/* Main 3-Column Area */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            {/* Left Column: File Explorer */}
            <FileExplorer
              files={currentProject.files}
              activeFileId={currentProject.activeFileId}
              unsavedFileIds={unsavedFileIds}
              isDemo={currentProject.isDemo}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onDeleteNode={handleDeleteNode}
              onRenameNode={handleRenameNode}
              onImportFiles={(files) => buildTreeFromFileList(files).then(res => {
                setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, files: [...p.files, ...res.files] } : p));
              })}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Center Column: Code Editor */}
            <CodeEditor
              activeFile={activeFile}
              openFiles={openFiles}
              unsavedFileIds={unsavedFileIds}
              settings={editorSettings}
              onSelectTab={handleSelectFile}
              onCloseTab={handleCloseTab}
              onCodeChange={handleCodeChange}
              onSaveFile={handleSaveFile}
              onNewTab={() => handleCreateFile('Component.tsx')}
            />

            {/* Right Column: Sandboxed Live Preview */}
            <LivePreview
              project={currentProject}
              onPreviewLog={(type, msg) => {
                setConsoleLogs((prev) => [
                  ...prev,
                  { id: String(Date.now()), type, message: msg, timestamp: new Date().toLocaleTimeString() }
                ]);
              }}
              onPreviewError={(err) => {
                setProblems([
                  {
                    id: String(Date.now()),
                    file: activeFile?.path || 'src/App.tsx',
                    line: err.line || 1,
                    column: err.column || 1,
                    message: err.message,
                    severity: 'error'
                  }
                ]);
              }}
              onClearErrors={() => setProblems([])}
            />
          </div>

          {/* Bottom Panel: Claude Assistant / Console / Problems */}
          <ClaudeAssistantPanel
            project={currentProject}
            activeFile={activeFile}
            consoleLogs={consoleLogs}
            problems={problems}
            onClearLogs={() => setConsoleLogs([])}
            onApplyDiff={handleApplyDiff}
            onSelectFileByPath={(path) => {
              const findByPath = (nodes: any[]): string | null => {
                for (const n of nodes) {
                  if (!n.isFolder && n.path === path) return n.id;
                  if (n.isFolder && n.children) {
                    const found = findByPath(n.children);
                    if (found) return found;
                  }
                }
                return null;
              };
              const fileId = findByPath(currentProject.files);
              if (fileId) handleSelectFile(fileId);
            }}
          />
        </>
      )}

      {/* ─── New Project Modal ─── */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#262522]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#DA7756]" />
                <h3 className="text-sm font-semibold text-[#ECEBE7]">Create New Project</h3>
              </div>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-[#8C8A82] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#ECEBE7] mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Website, Portfolio, React App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-[#141413] border border-[#2B2A27] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#DA7756]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#ECEBE7] mb-1.5">Template</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProjectTemplate('blank')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      newProjectTemplate === 'blank'
                        ? 'bg-[#2A2824] border-[#DA7756] text-white'
                        : 'bg-[#141413] border-[#2B2A27] text-[#8C8A82] hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs">Blank</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Empty</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProjectTemplate('html')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      newProjectTemplate === 'html'
                        ? 'bg-[#2A2824] border-[#DA7756] text-white'
                        : 'bg-[#141413] border-[#2B2A27] text-[#8C8A82] hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs">HTML/CSS</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Web page</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProjectTemplate('react')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      newProjectTemplate === 'react'
                        ? 'bg-[#2A2824] border-[#DA7756] text-white'
                        : 'bg-[#141413] border-[#2B2A27] text-[#8C8A82] hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs">React/Vite</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Component</p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#262522]">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#8C8A82] hover:bg-[#201F1D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Code Settings Modal ─── */}
      {isSettingsOpen && (
        <CodeSettingsDialog
          settings={editorSettings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
