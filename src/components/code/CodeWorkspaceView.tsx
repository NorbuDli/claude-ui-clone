import React, { useState } from 'react';
import {
  ChevronDown,
  Share2,
  Plus,
  Check,
  UploadCloud,
  FolderGit2,
  FilePlus,
  X,
  Code2
} from 'lucide-react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { ClaudeAssistantPanel } from './ClaudeAssistantPanel';
import { DEFAULT_CODE_PROJECTS, findFileById, updateFileContentInTree } from './defaultProjects';
import { CodeProject, CodeFile } from './types';

export const CodeWorkspaceView: React.FC = () => {
  const [projects, setProjects] = useState<CodeProject[]>(DEFAULT_CODE_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('project-website-redesign');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const activeFile = findFileById(currentProject.files, currentProject.activeFileId);

  const openFiles = currentProject.openFileIds
    .map((id) => findFileById(currentProject.files, id))
    .filter((f): f is CodeFile => Boolean(f));

  // Switch Active File
  const handleSelectFile = (fileId: string) => {
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

  // Code Content Modification
  const handleCodeChange = (fileId: string, newContent: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedFiles = updateFileContentInTree(proj.files, fileId, newContent);
        return { ...proj, files: updatedFiles, updatedAt: Date.now() };
      })
    );
  };

  // Apply Diff from Claude
  const handleApplyDiff = (filePath: string, newContent: string) => {
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
  };

  // Create File
  const handleCreateFile = (name: string) => {
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

  // Create New Project
  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: CodeProject = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: 'New custom React project',
      files: [
        {
          id: `file-app-${Date.now()}`,
          name: 'App.tsx',
          path: 'src/App.tsx',
          language: 'typescript',
          content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 text-white">\n      <h1 className="text-3xl font-bold">${newProjectName.trim()}</h1>\n    </div>\n  );\n}`
        }
      ],
      activeFileId: `file-app-${Date.now()}`,
      openFileIds: [`file-app-${Date.now()}`],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-hidden select-none">
      
      {/* ─── Top Code Workspace Header (matching Image 100%) ─── */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#141413] border-b border-[#242320] select-none shrink-0">
        
        {/* Left: "Code  |  Website Redesign ⌄" */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-[#ECEBE7] tracking-tight">Code</span>
          <span className="text-[#3A3834]">|</span>

          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-1.5 text-xs text-[#ECEBE7] hover:text-white px-2.5 py-1 rounded-xl hover:bg-[#1E1D1B] transition-colors font-medium"
            >
              <span>{currentProject.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C8A82]" />
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-0.5">
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
                    <span>{p.name}</span>
                    {p.id === currentProject.id && <Check className="w-3.5 h-3.5 text-[#DA7756]" />}
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

        {/* Right: "Share"  and  "New ⌄" (White Pill Button) */}
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

          {/* New ⌄ White Pill Button */}
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
                    alert('Import from GitHub repository is ready for connection.');
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-[#8C8A82]" />
                  <span>Import repository</span>
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e: any) => {
                      if (e.target.files?.length) {
                        alert(`${e.target.files.length} files imported into project!`);
                      }
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
        {/* Left Column: File Explorer */}
        <FileExplorer
          files={currentProject.files}
          activeFileId={currentProject.activeFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteNode={handleDeleteNode}
          onRenameNode={handleRenameNode}
          onOpenSettings={() => alert('Code Editor Settings: Font Size 13px, Tab Size 2, Format on Save Enabled.')}
        />

        {/* Center Column: Code Editor */}
        <CodeEditor
          activeFile={activeFile}
          openFiles={openFiles}
          onSelectTab={handleSelectFile}
          onCloseTab={handleCloseTab}
          onCodeChange={handleCodeChange}
          onNewTab={() => handleCreateFile('Component.tsx')}
        />

        {/* Right Column: Live Sandboxed Preview */}
        <LivePreview project={currentProject} />
      </div>

      {/* ─── Bottom Panel: Claude Assistant / Console / Problems ─── */}
      <ClaudeAssistantPanel
        project={currentProject}
        activeFile={activeFile}
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

      {/* ─── New Project Modal Dialog ─── */}
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
                  placeholder="e.g. Mobile App, E-Commerce Store"
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
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
