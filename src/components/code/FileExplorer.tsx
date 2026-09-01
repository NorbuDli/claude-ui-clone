import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Plus,
  MoreHorizontal,
  Search,
  ChevronRight,
  ChevronDown,
  Settings,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
  X
} from 'lucide-react';
import { FileSystemNode, CodeFile, CodeFolder } from './types';

interface FileExplorerProps {
  files: FileSystemNode[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, parentPath?: string) => void;
  onCreateFolder: (name: string, parentPath?: string) => void;
  onDeleteNode: (id: string) => void;
  onRenameNode: (id: string, newName: string) => void;
  onOpenSettings?: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
  onOpenSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/components': false,
    'src/pages': false,
    'public': false
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newDialogType, setNewDialogType] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [contextNode, setContextNode] = useState<{ id: string; name: string } | null>(null);
  const [isRenamingId, setIsRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'tsx' || ext === 'jsx') {
      return <span className="text-[#61DAFB] text-xs font-mono font-bold shrink-0">⚛</span>;
    }
    if (ext === 'ts') {
      return <span className="text-[#3178C6] text-[10px] font-mono font-bold shrink-0 bg-[#1E293B] px-1 py-0.2 rounded">TS</span>;
    }
    if (ext === 'js') {
      return <span className="text-[#F7DF1E] text-[10px] font-mono font-bold shrink-0 bg-[#2D2810] px-1 py-0.2 rounded">JS</span>;
    }
    if (ext === 'css') {
      return <span className="text-[#38BDF8] text-xs font-mono font-bold shrink-0">#</span>;
    }
    if (ext === 'json') {
      return <span className="text-[#EAB308] text-xs font-mono font-bold shrink-0">{'{ }'}</span>;
    }
    if (ext === 'md') {
      return <span className="text-[#60A5FA] text-xs font-mono font-bold shrink-0">M↓</span>;
    }
    if (fileName.startsWith('.git')) {
      return <span className="text-[#9CA3AF] text-xs font-mono shrink-0">⊘</span>;
    }
    return <FileText className="w-3.5 h-3.5 text-[#8C8A82] shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    if (newDialogType === 'file') {
      onCreateFile(newItemName.trim());
    } else if (newDialogType === 'folder') {
      onCreateFolder(newItemName.trim());
    }
    setNewItemName('');
    setNewDialogType(null);
  };

  const handleRenameSubmit = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim()) {
      onRenameNode(id, renameValue.trim());
    }
    setIsRenamingId(null);
  };

  const renderNode = (node: FileSystemNode, depth: number = 0) => {
    if (node.isFolder) {
      const isOpen = openFolders[node.path] ?? false;
      const isRenaming = isRenamingId === node.id;

      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        const hasMatchingChild = (n: FileSystemNode): boolean => {
          if (!n.isFolder) return n.name.toLowerCase().includes(searchQuery.toLowerCase());
          return n.children.some(hasMatchingChild);
        };
        if (!node.children.some(hasMatchingChild)) return null;
      }

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            className="group flex items-center justify-between py-1 px-2 rounded-lg text-xs text-[#C4C3BE] hover:text-white hover:bg-[#1E1D1B] cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="text-[#706E68] text-[10px]">
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-[#EAB308] shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-[#EAB308] shrink-0" />
              )}
              {isRenaming ? (
                <form onSubmit={(e) => handleRenameSubmit(node.id, e)} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                    className="bg-[#141413] border border-[#DA7756] rounded px-1 text-xs text-white outline-none w-24"
                    onBlur={() => setIsRenamingId(null)}
                  />
                </form>
              ) : (
                <span className="font-normal truncate">{node.name}</span>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenamingId(node.id);
                  setRenameValue(node.name);
                }}
                className="p-0.5 hover:text-white text-[#706E68]"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="p-0.5 hover:text-red-400 text-[#706E68]"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isOpen && node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Code File Node
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }

    const isActive = activeFileId === node.id;
    const isRenaming = isRenamingId === node.id;

    return (
      <div
        key={node.id}
        onClick={() => onSelectFile(node.id)}
        className={`group flex items-center justify-between py-1.5 px-2 rounded-lg text-xs cursor-pointer transition-colors select-none ${
          isActive
            ? 'bg-[#242320] text-white font-medium shadow-xs'
            : 'text-[#B4B3AD] hover:text-white hover:bg-[#1E1D1B]'
        }`}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {getFileIcon(node.name)}
          {isRenaming ? (
            <form onSubmit={(e) => handleRenameSubmit(node.id, e)} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="bg-[#141413] border border-[#DA7756] rounded px-1 text-xs text-white outline-none w-28"
                onBlur={() => setIsRenamingId(null)}
              />
            </form>
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenamingId(node.id);
              setRenameValue(node.name);
            }}
            className="p-0.5 hover:text-white text-[#706E68]"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
            }}
            className="p-0.5 hover:text-red-400 text-[#706E68]"
            title="Delete file"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-60 h-full bg-[#141413] border-r border-[#242320] flex flex-col select-none shrink-0">
      {/* Top Explorer Header matching Image */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#242320]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9C9A92]">Files</span>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-md text-[#8C8A82] hover:text-white hover:bg-[#201F1D] transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setNewDialogType('file');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#8C8A82]" />
                  <span>New file</span>
                </button>
                <button
                  onClick={() => {
                    setNewDialogType('folder');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#8C8A82]" />
                  <span>New folder</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setNewDialogType('file')}
            className="p-1 rounded-md text-[#8C8A82] hover:text-white hover:bg-[#201F1D] transition-colors"
            title="Create new file"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search files box (matching Image) */}
      <div className="p-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#706E68] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1C1B19] border border-[#262522] rounded-xl pl-8 pr-6 py-1.5 text-xs text-[#ECEBE7] placeholder-[#666] focus:outline-none focus:border-[#DA7756]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#706E68] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Create Input if active */}
      {newDialogType && (
        <form onSubmit={handleCreateSubmit} className="mx-2.5 mb-2 p-2 bg-[#1C1B19] border border-[#DA7756] rounded-xl flex items-center gap-2">
          {newDialogType === 'file' ? <FilePlus className="w-3.5 h-3.5 text-[#DA7756]" /> : <FolderPlus className="w-3.5 h-3.5 text-[#EAB308]" />}
          <input
            type="text"
            placeholder={newDialogType === 'file' ? 'filename.tsx' : 'folder name'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white outline-none"
          />
          <button type="submit" className="text-[11px] font-semibold text-[#DA7756] hover:underline">Add</button>
          <button type="button" onClick={() => setNewDialogType(null)} className="text-[#8C8A82] hover:text-white"><X className="w-3 h-3" /></button>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {files.map((node) => renderNode(node, 0))}
      </div>

      {/* Bottom Code Settings (matching Image) */}
      <div className="p-3 border-t border-[#242320]">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#1C1B19] transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Code settings</span>
        </button>
      </div>
    </div>
  );
};
