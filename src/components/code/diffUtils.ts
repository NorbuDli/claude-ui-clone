import { DiffLine, DiffProposal, FileOperationProposal, CodeFile, FileSystemNode } from './types';

export function computeUnifiedDiff(original: string, proposed: string): DiffLine[] {
  const origLines = original.split('\n');
  const propLines = proposed.split('\n');
  const result: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < origLines.length || j < propLines.length) {
    if (i < origLines.length && j < propLines.length && origLines[i] === propLines[j]) {
      result.push({
        type: 'unchanged',
        content: origLines[i],
        lineNumberOld: i + 1,
        lineNumberNew: j + 1
      });
      i++;
      j++;
    } else {
      let nextMatchInProp = -1;
      let nextMatchInOrig = -1;

      for (let lookahead = 1; lookahead < 5; lookahead++) {
        if (j + lookahead < propLines.length && origLines[i] === propLines[j + lookahead]) {
          nextMatchInProp = j + lookahead;
          break;
        }
        if (i + lookahead < origLines.length && origLines[i + lookahead] === propLines[j]) {
          nextMatchInOrig = i + lookahead;
          break;
        }
      }

      if (nextMatchInProp !== -1) {
        while (j < nextMatchInProp) {
          result.push({
            type: 'added',
            content: propLines[j],
            lineNumberNew: j + 1
          });
          j++;
        }
      } else if (nextMatchInOrig !== -1) {
        while (i < nextMatchInOrig) {
          result.push({
            type: 'removed',
            content: origLines[i],
            lineNumberOld: i + 1
          });
          i++;
        }
      } else {
        if (i < origLines.length) {
          result.push({
            type: 'removed',
            content: origLines[i],
            lineNumberOld: i + 1
          });
          i++;
        }
        if (j < propLines.length) {
          result.push({
            type: 'added',
            content: propLines[j],
            lineNumberNew: j + 1
          });
          j++;
        }
      }
    }
  }

  return result;
}

export interface ExtractedCodeBlock {
  explanation: string;
  code: string;
  language: string;
  filename?: string;
}

export function extractCodeBlocksFromAIResponse(response: string): ExtractedCodeBlock[] {
  const blocks: ExtractedCodeBlock[] = [];

  // 1. Ant Artifact tag format (<antArtifact title="Navbar.tsx" identifier="navbar" ...>)
  const artifactRegex = /<antArtifact[^>]*title=["']([^"']+)["'][^>]*>([\s\S]*?)<\/antArtifact>/gi;
  let artifactMatch;
  while ((artifactMatch = artifactRegex.exec(response)) !== null) {
    const filename = artifactMatch[1]?.trim();
    let code = artifactMatch[2]?.trim() || '';
    if (code.startsWith('```')) {
      code = code.replace(/^```[a-zA-Z0-9_-]*\n/, '').replace(/\n```$/, '').trim();
    }
    if (code && code.length > 5) {
      const ext = filename.split('.').pop() || 'tsx';
      blocks.push({
        explanation: `Artifact file: ${filename}`,
        code,
        language: ext.includes('ts') || ext.includes('js') ? 'typescript' : ext,
        filename
      });
    }
  }

  // 2. Standard Markdown Code Fences:
  // ```lang:filepath, ```lang file="filepath", ```lang filename="filepath", ```lang filepath.ext
  const fenceRegex = /```([a-zA-Z0-9_-]+)?(?::([^\s\n]+)|\s+(?:file|filename|title)=["']?([^"'\n]+)["']?|\s+([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+))?\n([\s\S]*?)```/g;
  let match;

  while ((match = fenceRegex.exec(response)) !== null) {
    const lang = match[1] || 'typescript';
    let filename = match[2] || match[3] || match[4] || '';
    let code = match[5]?.trim() || '';

    // If filename was in first line comments: // File: src/components/Navbar.tsx or // filepath: ...
    if (!filename && code) {
      const firstLineMatch = code.match(/^(?:\/\/|#|\/\*)\s*(?:file|filepath|path)?:\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)/i);
      if (firstLineMatch) {
        filename = firstLineMatch[1].trim();
      } else {
        const simpleCommentMatch = code.match(/^(?:\/\/|#)\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]{1,4})(?:\s|$)/);
        if (simpleCommentMatch) {
          filename = simpleCommentMatch[1].trim();
        }
      }
    }

    // Infer filename from component export if not found
    if (!filename && code) {
      const componentMatch = code.match(/export\s+(?:default\s+)?(?:const|function|class)\s+([A-Z][a-zA-Z0-9_]*)/);
      if (componentMatch) {
        const compName = componentMatch[1];
        const ext = lang.includes('tsx') || lang.includes('typescript') ? 'tsx' : lang.includes('jsx') ? 'jsx' : 'tsx';
        filename = `${compName}.${ext}`;
      }
    }

    // Clean filename
    if (filename) {
      filename = filename.replace(/[`"'*]/g, '').trim();
    }

    if (code && code.length > 5) {
      // Avoid duplicate blocks
      const isDuplicate = blocks.some(b => b.code === code);
      if (!isDuplicate) {
        blocks.push({
          explanation: filename ? `File: ${filename}` : 'Proposed code modification',
          code,
          language: lang,
          filename: filename || undefined
        });
      }
    }
  }

  return blocks;
}

/**
 * Match an extracted code block to existing project files, determining whether it is a
 * new file creation or an edit/diff to an existing file.
 */
export function inferFileOperation(
  block: ExtractedCodeBlock,
  allFiles: CodeFile[],
  activeFile: CodeFile | null
): FileOperationProposal {
  let targetFile: CodeFile | null = null;
  const rawPath = block.filename || (activeFile ? activeFile.path : 'src/Component.tsx');
  const cleanPath = rawPath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  const baseName = cleanPath.split('/').pop() || cleanPath;

  // 1. Try exact path match
  targetFile = allFiles.find(f => f.path === cleanPath || f.path === rawPath) || null;

  // 2. Try basename match
  if (!targetFile) {
    targetFile = allFiles.find(f => f.name === baseName) || null;
  }

  // 3. Fallback to activeFile if no explicit filename was provided on the block
  if (!targetFile && !block.filename && activeFile) {
    targetFile = activeFile;
  }

  if (targetFile) {
    // Existing file -> Edit operation with unified diff
    const diffLines = computeUnifiedDiff(targetFile.content, block.code);
    return {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'edit',
      filePath: targetFile.path,
      fileName: targetFile.name,
      originalContent: targetFile.content,
      proposedContent: block.code,
      language: block.language || targetFile.language,
      explanation: `Update ${targetFile.name} with proposed changes.`,
      diffLines,
      status: 'pending'
    };
  } else {
    // New file -> Create operation
    // If the path doesn't specify a folder and looks like a React component, put it in src/ or src/components/
    let resolvedPath = cleanPath;
    if (!resolvedPath.includes('/')) {
      const hasSrcFolder = allFiles.some(f => f.path.startsWith('src/'));
      if (hasSrcFolder) {
        if (resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.jsx')) {
          resolvedPath = `src/components/${resolvedPath}`;
        } else {
          resolvedPath = `src/${resolvedPath}`;
        }
      }
    }

    const diffLines = block.code.split('\n').map((line, idx) => ({
      type: 'added' as const,
      content: line,
      lineNumberNew: idx + 1
    }));

    return {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'create',
      filePath: resolvedPath,
      fileName: baseName,
      proposedContent: block.code,
      language: block.language || 'typescript',
      explanation: `Create new file: ${resolvedPath}`,
      diffLines,
      status: 'pending'
    };
  }
}

