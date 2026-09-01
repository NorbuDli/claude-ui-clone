import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Share2,
  Plus,
  Check,
  UploadCloud,
  FolderGit2,
  FilePlus,
  X,
  Code2,
  FolderPlus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { ClaudeAssistantPanel } from './ClaudeAssistantPanel';
import { CodeSettingsDialog } from './CodeSettingsDialog';
import { DEFAULT_CODE_PROJECTS, findFileById, updateFileContentInTree } from './defaultProjects';
import { CodeProject, CodeFile, ConsoleLog, ProblemItem, CodeEditorSettings } from './types';

const STORAGE_KEY = 'claude_code_projects_v2';
const SETTINGS_KEY = 'claude_code_settings_v1';

export const CodeWorkspaceView: React.FC = () => {
  // Load or initialize projects from localStorage
  const [projects, setProjects] = useState<CodeProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Initial with clearly labeled Demo Project
    return DEFAULT_CODE_PROJECTS.map(p => ({ ...p, isDemo: true, name: p.name + ' (Demo)' }));
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || 'project-website-redesign';
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
      message: 'Workspace initialized. Ready for development.',
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

  // Persist projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

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

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const activeFile = currentProject ? findFileById(currentProject.files, currentProject.activeFileId) : null;

  const openFiles = currentProject
    ? currentProject.openFileIds
        .map((id) => findFileById(currentProject.files, id))
        .filter((f): f is CodeFile => Boolean(f))
    : [];

  // Switch Active File
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

  // Close Editor Tab
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

  // Code Modification in In-Memory State
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

  // Save File
  const handleSaveFile = (fileId: string) => {
    setUnsavedFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });

    const file = findFileById(currentProject.files, fileId);
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        message: `✓ Saved ${file?.name || fileId}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Apply Diff from Claude
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

  // Create File
  const handleCreateFile = (name: string) => {
    if (!currentProject) return;
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name,
      path: `src/${name}`,
      language: name.endsWith('.tsx') || name.endsWith('.ts') ? 'typescript' : name.endsWith('.css') ? 'css' : 'plaintext',
      content: `// ${name}\nexport default function () {\n  return null;\n}\n`
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

  // Create Folder
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

  // Delete Node
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

  // Rename Node
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

  // Real Project File Import
  const handleImportFiles = async (fileList: FileList) => {
    const imported: CodeFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const text = await file.text();
      const ext = file.name.split('.').pop() || '';
      imported.push({
        id: `file-imported-${Date.now()}-${i}`,
        name: file.name,
        path: file.webkitRelativePath || file.name,
        content: text,
        language: ext.includes('ts') || ext.includes('js') ? 'typescript' : ext.includes('css') ? 'css' : 'plaintext'
      });
    }

    if (imported.length > 0) {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== currentProject.id) return proj;
          return {
            ...proj,
            files: [...proj.files, ...imported],
            activeFileId: imported[0].id,
            openFileIds: Array.from(new Set([...proj.openFileIds, ...imported.map(f => f.id)]))
          };
        })
      );
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'success',
          message: `✓ Imported ${imported.length} files into project`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  // Create New Project
  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: CodeProject = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: 'Custom React Project',
      isDemo: false,
      files: [
        {
          id: `file-app-${Date.now()}`,
          name: 'App.tsx',
          path: 'src/App.tsx',
          language: 'typescript',
          content: `import React from 'react';\n\nexport const App: React.FC = () => {\n  return (\n    <div className="min-h-screen bg-[#141413] text-[#ECEBE7] flex flex-col items-center justify-center p-8 text-center">\n      <h1 className="text-4xl font-bold mb-3">${newProjectName.trim()}</h1>\n      <p className="text-sm text-[#A5A39C]">Start writing your application code in App.tsx.</p>\n    </div>\n  );\n};\n\nexport default App;`
        },
        {
          id: `file-styles-${Date.now()}`,
          name: 'styles.css',
          path: 'src/styles.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  padding: 0;\n  background: #141413;\n  color: #ECEBE7;\n}`
        }
      ],
      activeFileId: `file-app-${Date.now()}`,
      openFileIds: [`file-app-${Date.now()}`, `file-styles-${Date.now()}`],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setNewProjectName('');
    setIsNewProjectModalOpen(false);

    setConsoleLogs([
      {
        id: String(Date.now()),
        type: 'success',
        message: `Created new project "${newProj.name}"`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-hidden select-none">
      {/* ─── Top Code Workspace Header (matching Image 100%) ─── */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#141413] border-b border-[#242320] select-none shrink-0">
        {/* Left: "Code  |  [Project Name] ⌄" */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-[#ECEBE7] tracking-tight">Code</span>
          <span className="text-[#3A3834]">|</span>

          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-1.5 text-xs text-[#ECEBE7] hover:text-white px-2.5 py-1 rounded-xl hover:bg-[#1E1D1B] transition-colors font-medium"
            >
              <span>{currentProject ? currentProject.name : 'Select Project'}</span>
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
                      p.id === currentProject?.id
                        ? 'bg-[#262522] text-white font-medium'
                        : 'text-[#8C8A82] hover:bg-[#201F1D] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.id === currentProject?.id && <Check className="w-3.5 h-3.5 text-[#DA7756]" />}
                  </button>
                ))}
                <div className="my-1 border-t border-[#262522]" />
                <button
                  onClick={() => {
                    setIsNewProjectModalOpen(true);
                    setIsProjectDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <Plus className="w-3.5 h-3.5 text-[#DA7756]" />
                  <span>New project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: "Share" and "New ⌄" */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Code workspace link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1B19] hover:bg-[#22211F] border border-[#2B2A27] text-xs font-medium text-[#ECEBE7] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-[#8C8A82]" />
            <span>Share</span>
          </button>

          {/* New ⌄ Button */}
          <div className="relative">
            <button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow transition-all active:scale-95"
            >
              <span>New</span>
              <ChevronDown className="w-3.5 h-3.5 text-black/80" />
            </button>

            {isNewMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                <button
                  onClick={() => {
                    setIsNewProjectModalOpen(true);
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#DA7756]" />
                  <span>New project</span>
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e: any) => {
                      if (e.target.files) handleImportFiles(e.target.files);
                    };
                    input.click();
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#8C8A82]" />
                  <span>Upload files</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Workspace Columns (Explorer + Editor + Preview) ─── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {currentProject ? (
          <>
            {/* Left Column: File Explorer */}
            <FileExplorer
              files={currentProject.files}
              activeFileId={currentProject.activeFileId}
              isDemo={currentProject.isDemo}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onDeleteNode={handleDeleteNode}
              onRenameNode={handleRenameNode}
              onImportFiles={handleImportFiles}
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

            {/* Right Column: Live Sandboxed Preview */}
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <Code2 className="w-12 h-12 text-[#555]" />
            <h2 className="text-lg font-medium text-white">No Project Open</h2>
            <p className="text-xs text-[#8C8A82] max-w-sm">Create a new project or import files to start coding.</p>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#DA7756] text-white text-xs font-semibold shadow"
            >
              Create New Project
            </button>
          </div>
        )}
      </div>

      {/* ─── Bottom Panel: Claude Assistant / Console / Problems ─── */}
      {currentProject && (
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
      )}

      {/* ─── New Project Modal ─── */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#262522]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#DA7756]" />
                <h3 className="text-sm font-semibold text-[#ECEBE7]">Create New Code Project</h3>
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
                  placeholder="e.g. My Website, Dashboard App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-[#141413] border border-[#2B2A27] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#DA7756]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
