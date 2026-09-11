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
  // Supports CRLF, trailing spaces, and various path formats
  const fenceRegex = /```([a-zA-Z0-9_-]+)?(?::([^\s\r\n]+)|\s+(?:file|filename|title)=["']?([^"' \r\n]+)["']?|\s+([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+))?[ \t]*\r?\n([\s\S]*?)```/g;
  let match;

  while ((match = fenceRegex.exec(response)) !== null) {
    const lang = (match[1] || 'plaintext').toLowerCase();
    let filename = match[2] || match[3] || match[4] || '';
    let code = match[5]?.trim() || '';

    // Check first line comments: // File: src/components/Navbar.tsx or <!-- index.html --> or /* style.css */
    if (!filename && code) {
      const firstLineMatch = code.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:file|filepath|path)?:\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)/i);
      if (firstLineMatch) {
        filename = firstLineMatch[1].trim();
      } else {
        const simpleCommentMatch = code.match(/^(?:\/\/|#|<!--|\/\*)\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]{1,4})(?:\s|-->|\*\/|$)/);
        if (simpleCommentMatch) {
          filename = simpleCommentMatch[1].trim();
        }
      }
    }

    if (filename) {
      filename = filename.replace(/[`"'*]/g, '').trim();
    }

    if (code && code.length > 5) {
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

  // 3. Unclosed trailing code fence at the end of response (when token limit hit or incomplete fence)
  const unclosedRegex = /(?:^|\r?\n)```([a-zA-Z0-9_-]+)?(?::([^\s\r\n]+)|\s+(?:file|filename|title)=["']?([^"' \r\n]+)["']?|\s+([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+))?[ \t]*\r?\n([\s\S]+)$/;
  const unclosedMatch = response.match(unclosedRegex);
  if (unclosedMatch) {
    const trailingCode = unclosedMatch[5].trim();
    if (trailingCode.length > 20 && !blocks.some(b => b.code.includes(trailingCode.slice(0, 40)))) {
      const lang = (unclosedMatch[1] || 'plaintext').toLowerCase();
      const filename = unclosedMatch[2] || unclosedMatch[3] || unclosedMatch[4] || '';
      blocks.push({
        explanation: filename ? `File: ${filename}` : 'Proposed code',
        code: trailingCode,
        language: lang,
        filename: filename ? filename.replace(/[`"'*]/g, '').trim() : undefined
      });
    }
  }

  // 4. Raw code fallback if no fenced code blocks were found
  if (blocks.length === 0) {
    const trimmed = response.trim();
    const htmlMatch = trimmed.match(/(<!DOCTYPE html[\s\S]*?(?:<\/html>|$)|<html[\s\S]*?(?:<\/html>|$)|<div[\s\S]*?<script[\s\S]*?<\/script>|<canvas[\s\S]*?<script[\s\S]*?<\/script>)/i);
    if (htmlMatch && htmlMatch[1].length > 30) {
      blocks.push({
        explanation: 'Web Application / Game',
        code: htmlMatch[1].trim(),
        language: 'html',
        filename: 'index.html'
      });
    } else if (trimmed.includes('function startGame') || trimmed.includes('canvas.getContext') || trimmed.includes('document.getElementById') || trimmed.includes('requestAnimationFrame')) {
      blocks.push({
        explanation: 'Game Script',
        code: trimmed,
        language: 'javascript',
        filename: 'game.js'
      });
    } else if (trimmed.includes('import React') || trimmed.includes('export default') || trimmed.includes('export const')) {
      blocks.push({
        explanation: 'React Component',
        code: trimmed,
        language: 'typescript',
        filename: 'src/App.tsx'
      });
    }
  }

  // 5. Intelligent filename assignment for any block that didn't have an explicit filename
  const usedNames = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b.filename) {
      const code = b.code;
      const lowerCode = code.toLowerCase();
      const lang = b.language.toLowerCase();

      const isHtml =
        lang === 'html' ||
        lang === 'htm' ||
        lowerCode.includes('<!doctype html') ||
        lowerCode.includes('<!doctype') ||
        lowerCode.includes('<html') ||
        lowerCode.includes('<body') ||
        lowerCode.includes('<canvas') ||
        (lowerCode.includes('<style') && lowerCode.includes('<script')) ||
        (lowerCode.includes('<div') && (lowerCode.includes('<script') || lowerCode.includes('canvas')));

      const isCss =
        lang === 'css' ||
        lowerCode.includes('@keyframes') ||
        (lowerCode.includes('{') && lowerCode.includes(':') && !lowerCode.includes('function') && !lowerCode.includes('const ') && !lowerCode.includes('let ') && !isHtml);

      const isReact =
        lang === 'typescript' ||
        lang === 'tsx' ||
        lang === 'jsx' ||
        code.includes('import React') ||
        code.includes('React.FC') ||
        code.includes('export default function') ||
        (code.includes('export default') && code.includes('return ('));

      const isJs =
        lang === 'javascript' ||
        lang === 'js' ||
        lowerCode.includes('getcontext(') ||
        lowerCode.includes('requestanimationframe(') ||
        lowerCode.includes('addeventlistener(') ||
        (lowerCode.includes('function ') && lowerCode.includes('document.')) ||
        (lowerCode.includes('const ') && lowerCode.includes('document.'));

      if (isHtml) {
        b.filename = usedNames.has('index.html') ? `page-${i + 1}.html` : 'index.html';
        b.language = 'html';
      } else if (isCss) {
        b.filename = usedNames.has('style.css') ? `style-${i + 1}.css` : 'style.css';
        b.language = 'css';
      } else if (isReact) {
        const compMatch = code.match(/export\s+(?:default\s+)?(?:const|function|class)\s+([A-Z][a-zA-Z0-9_]*)/);
        const compName = compMatch ? compMatch[1] : (usedNames.has('src/App.tsx') ? `Component${i + 1}` : 'App');
        b.filename = `src/${compName}.tsx`;
        b.language = 'typescriptreact';
      } else if (isJs) {
        if (lowerCode.includes('snake') || lowerCode.includes('canvas') || lowerCode.includes('game') || lowerCode.includes('score') || lowerCode.includes('startgame')) {
          b.filename = usedNames.has('game.js') ? `game-${i + 1}.js` : 'game.js';
        } else {
          b.filename = usedNames.has('script.js') ? `script-${i + 1}.js` : 'script.js';
        }
        b.language = 'javascript';
      } else if (lang === 'python' || lang === 'py') {
        b.filename = 'main.py';
        b.language = 'python';
      } else if (lang === 'json') {
        b.filename = 'data.json';
        b.language = 'json';
      } else {
        // Fallback: If code contains tags or looks like markup, make it index.html, never .txt
        if (code.trim().startsWith('<') || lowerCode.includes('<div') || lowerCode.includes('<script')) {
          b.filename = usedNames.has('index.html') ? `page-${i + 1}.html` : 'index.html';
          b.language = 'html';
        } else {
          b.filename = usedNames.has('index.html') ? `game.js` : 'index.html';
          b.language = b.filename.endsWith('.html') ? 'html' : 'javascript';
        }
      }
    }
    usedNames.add(b.filename);
  }

  return blocks;
}

/**
 * Simple content similarity check using Jaccard similarity on token sets.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function computeContentSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const tokenize = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9_$]/gi, ' ').split(/\s+/).filter(t => t.length > 1));
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

/**
 * Generate a unique filename by appending a numeric suffix.
 * E.g., "index.html" -> "index-2.html", "game.js" -> "game-2.js"
 */
function generateUniqueFilename(baseName: string, existingFiles: CodeFile[]): string {
  const dotIndex = baseName.lastIndexOf('.');
  const namePart = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName;
  const extPart = dotIndex > 0 ? baseName.slice(dotIndex) : '';
  const existingNames = new Set(existingFiles.map(f => f.name.toLowerCase()));
  
  for (let i = 2; i <= 50; i++) {
    const candidate = `${namePart}-${i}${extPart}`;
    if (!existingNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return `${namePart}-${Date.now()}${extPart}`;
}

/**
 * Match an extracted code block to existing project files, determining whether it is a
 * new file creation or an edit/diff to an existing file.
 * 
 * If the matched file's content is very different from the proposed code (similarity < 0.3),
 * we create a new file with a unique name instead of overwriting.
 */
export function inferFileOperation(
  block: ExtractedCodeBlock,
  allFiles: CodeFile[],
  activeFile: CodeFile | null
): FileOperationProposal {
  let targetFile: CodeFile | null = null;
  const rawPath = block.filename || (activeFile ? activeFile.path : 'index.html');
  const cleanPath = rawPath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  const baseName = cleanPath.split('/').pop() || cleanPath;

  // 1. Try exact path match
  targetFile = allFiles.find(f => f.path === cleanPath || f.path === rawPath) || null;

  // 2. Try basename match
  if (!targetFile) {
    targetFile = allFiles.find(f => f.name === baseName) || null;
  }

  // 3. Fallback to activeFile ONLY if activeFile has matching extension/type
  if (!targetFile && !block.filename && activeFile) {
    const activeExt = activeFile.name.split('.').pop() || '';
    const blockExt = baseName.split('.').pop() || '';
    if (activeExt === blockExt) {
      targetFile = activeFile;
    }
  }

  if (targetFile) {
    // Check content similarity — if the content is very different, the AI likely generated
    // a completely new app/page rather than modifying the existing file
    const similarity = computeContentSimilarity(targetFile.content, block.code);
    
    if (similarity < 0.3 && targetFile.content.length > 50 && block.code.length > 50) {
      // Content is too different — treat as a NEW file with a unique name
      const uniqueName = generateUniqueFilename(baseName, allFiles);
      const dirPrefix = cleanPath.includes('/') ? cleanPath.substring(0, cleanPath.lastIndexOf('/') + 1) : '';
      const newPath = `${dirPrefix}${uniqueName}`;
      
      const diffLines = block.code.split('\n').map((line, idx) => ({
        type: 'added' as const,
        content: line,
        lineNumberNew: idx + 1
      }));

      return {
        id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'create',
        filePath: newPath,
        fileName: uniqueName,
        proposedContent: block.code,
        language: block.language || targetFile.language,
        explanation: `Create new file: ${newPath} (content differs significantly from existing ${baseName})`,
        diffLines,
        status: 'pending'
      };
    }

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
    let resolvedPath = cleanPath;
    if (!resolvedPath.includes('/')) {
      const hasSrcFolder = allFiles.some(f => f.path.startsWith('src/'));
      if (hasSrcFolder && (resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.jsx'))) {
        resolvedPath = `src/components/${resolvedPath}`;
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

