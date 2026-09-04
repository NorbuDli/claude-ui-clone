import JSZip from 'jszip';
import { CodeFile, CodeFolder, FileSystemNode, CodeProject } from './types';

const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  '.next',
  '.vscode',
  '__MACOSX',
  '.DS_Store'
]);

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return 'typescriptreact';
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
    case 'java':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'hpp':
      return 'cpp';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'xml':
    case 'svg':
      return 'xml';
    default:
      return 'plaintext';
  }
}

export function shouldIgnore(name: string): boolean {
  return IGNORED_NAMES.has(name) || name.startsWith('.git');
}

/**
 * Open local files using native window.showOpenFilePicker if available
 */
export async function openLocalFilesNative(): Promise<{ name: string; files: FileSystemNode[] } | null> {
  if (!('showOpenFilePicker' in window)) {
    return null;
  }

  try {
    const handles: FileSystemFileHandle[] = await (window as any).showOpenFilePicker({
      multiple: true
    });

    if (!handles || handles.length === 0) return null;

    const files: FileSystemNode[] = [];
    for (const handle of handles) {
      const file = await handle.getFile();
      const content = await file.text();
      files.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        path: file.name,
        content,
        language: detectLanguage(file.name),
        handle
      });
    }

    const projectName = handles.length === 1 ? handles[0].name : 'Local Files';
    return { name: projectName, files };
  } catch (err: any) {
    if (err.name === 'AbortError') return null;
    console.warn('Native open file error, falling back:', err);
    return null;
  }
}

/**
 * Open local folder using native window.showDirectoryPicker if available
 */
export async function openLocalFolderNative(): Promise<{ name: string; files: FileSystemNode[]; handle: FileSystemDirectoryHandle } | null> {
  if (!('showDirectoryPicker' in window)) {
    return null;
  }

  try {
    const dirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });

    if (!dirHandle) return null;

    async function scanDirectory(
      handle: FileSystemDirectoryHandle,
      currentPath: string
    ): Promise<FileSystemNode[]> {
      const nodes: FileSystemNode[] = [];

      for await (const [name, entry] of (handle as any).entries()) {
        if (shouldIgnore(name)) continue;

        const itemPath = currentPath ? `${currentPath}/${name}` : name;

        if (entry.kind === 'directory') {
          const children = await scanDirectory(entry as FileSystemDirectoryHandle, itemPath);
          nodes.push({
            id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            path: itemPath,
            isFolder: true,
            children,
            isOpen: false,
            handle: entry as FileSystemDirectoryHandle
          });
        } else if (entry.kind === 'file') {
          try {
            const file = await (entry as FileSystemFileHandle).getFile();
            // Skip large binary files (> 2MB)
            if (file.size > 2 * 1024 * 1024) continue;

            const content = await file.text();
            nodes.push({
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name,
              path: itemPath,
              content,
              language: detectLanguage(name),
              handle: entry as FileSystemFileHandle
            });
          } catch (readErr) {
            console.warn(`Could not read file ${name}:`, readErr);
          }
        }
      }

      // Sort: folders first, then files alphabetically
      return nodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    const files = await scanDirectory(dirHandle, '');
    return {
      name: dirHandle.name,
      files,
      handle: dirHandle
    };
  } catch (err: any) {
    if (err.name === 'AbortError') return null;
    console.warn('Native open directory error:', err);
    return null;
  }
}

/**
 * Build hierarchical FileSystemNode tree from standard FileList (e.g. input webkitdirectory or multiple)
 */
export async function buildTreeFromFileList(
  fileList: FileList
): Promise<{ name: string; files: FileSystemNode[] }> {
  const rootMap = new Map<string, any>();
  let rootProjectName = 'Imported Project';

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/').filter(Boolean);

    // Skip ignored directories
    if (parts.some((p) => shouldIgnore(p))) continue;

    // Detect project folder name from first part if webkitRelativePath
    if (file.webkitRelativePath && parts.length > 1 && rootProjectName === 'Imported Project') {
      rootProjectName = parts[0];
    }

    // Skip root folder name if all files share it
    const pathParts = file.webkitRelativePath && parts.length > 1 ? parts.slice(1) : parts;
    if (pathParts.length === 0) continue;

    const content = await file.text();
    const fileName = pathParts[pathParts.length - 1];
    const itemPath = pathParts.join('/');

    // Insert into tree map
    let currentLevel = rootMap;
    for (let p = 0; p < pathParts.length - 1; p++) {
      const segment = pathParts[p];
      if (!currentLevel.has(segment)) {
        currentLevel.set(segment, {
          isFolder: true,
          name: segment,
          path: pathParts.slice(0, p + 1).join('/'),
          children: new Map()
        });
      }
      currentLevel = currentLevel.get(segment).children;
    }

    currentLevel.set(fileName, {
      isFolder: false,
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: fileName,
      path: itemPath,
      content,
      language: detectLanguage(fileName)
    });
  }

  function mapToNodes(map: Map<string, any>): FileSystemNode[] {
    const nodes: FileSystemNode[] = [];
    for (const [name, item] of map.entries()) {
      if (item.isFolder) {
        nodes.push({
          id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          path: item.path,
          isFolder: true,
          children: mapToNodes(item.children),
          isOpen: false
        });
      } else {
        nodes.push(item as CodeFile);
      }
    }
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  const files = mapToNodes(rootMap);
  return { name: rootProjectName, files };
}

/**
 * Import and unzip a project using JSZip
 */
export async function importZipProject(
  file: File
): Promise<{ name: string; files: FileSystemNode[] }> {
  const zip = await JSZip.loadAsync(file);
  const rootMap = new Map<string, any>();
  const projectName = file.name.replace(/\.zip$/i, '');

  const entries: { path: string; isDir: boolean; entry: any }[] = [];
  zip.forEach((relPath, entry) => {
    entries.push({ path: relPath, isDir: entry.dir, entry });
  });

  for (const { path, isDir, entry } of entries) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0 || parts.some((p) => shouldIgnore(p))) continue;

    if (isDir) {
      let currentLevel = rootMap;
      for (let p = 0; p < parts.length; p++) {
        const seg = parts[p];
        if (!currentLevel.has(seg)) {
          currentLevel.set(seg, {
            isFolder: true,
            name: seg,
            path: parts.slice(0, p + 1).join('/'),
            children: new Map()
          });
        }
        currentLevel = currentLevel.get(seg).children;
      }
    } else {
      let currentLevel = rootMap;
      for (let p = 0; p < parts.length - 1; p++) {
        const seg = parts[p];
        if (!currentLevel.has(seg)) {
          currentLevel.set(seg, {
            isFolder: true,
            name: seg,
            path: parts.slice(0, p + 1).join('/'),
            children: new Map()
          });
        }
        currentLevel = currentLevel.get(seg).children;
      }

      const fileName = parts[parts.length - 1];
      const content = await entry.async('string');

      currentLevel.set(fileName, {
        isFolder: false,
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: fileName,
        path: parts.join('/'),
        content,
        language: detectLanguage(fileName)
      });
    }
  }

  function mapToNodes(map: Map<string, any>): FileSystemNode[] {
    const nodes: FileSystemNode[] = [];
    for (const [name, item] of map.entries()) {
      if (item.isFolder) {
        nodes.push({
          id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          path: item.path,
          isFolder: true,
          children: mapToNodes(item.children),
          isOpen: false
        });
      } else {
        nodes.push(item as CodeFile);
      }
    }
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  const files = mapToNodes(rootMap);
  return { name: projectName, files };
}

/**
 * Export project as a downloadable ZIP file
 */
export async function exportProjectAsZip(project: CodeProject): Promise<void> {
  const zip = new JSZip();

  function addNodesToZip(nodes: FileSystemNode[]) {
    for (const node of nodes) {
      if (node.isFolder) {
        addNodesToZip(node.children);
      } else {
        zip.file(node.path, node.content);
      }
    }
  }

  addNodesToZip(project.files);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Save file directly to local disk if FileSystemFileHandle is available
 */
export async function saveFileDirectToDisk(file: CodeFile, newContent: string): Promise<boolean> {
  if (file.handle && 'createWritable' in file.handle) {
    try {
      const writable = await (file.handle as any).createWritable();
      await writable.write(newContent);
      await writable.close();
      return true;
    } catch (err) {
      console.warn('Direct disk write failed, falling back to state save:', err);
      return false;
    }
  }
  return false;
}
