import { DiffLine, DiffProposal } from './types';

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
      // Find if line exists later
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
        // Lines were added in proposed
        while (j < nextMatchInProp) {
          result.push({
            type: 'added',
            content: propLines[j],
            lineNumberNew: j + 1
          });
          j++;
        }
      } else if (nextMatchInOrig !== -1) {
        // Lines were removed from original
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

export function extractCodeBlocksFromAIResponse(response: string): { explanation: string; code: string; language: string; filename?: string }[] {
  const blocks: { explanation: string; code: string; language: string; filename?: string }[] = [];
  const regex = /```([a-zA-Z0-9_-]+)?(?:\s*file=([^\n]+))?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    const lang = match[1] || 'typescript';
    const filename = match[2]?.trim();
    const code = match[3]?.trim();
    if (code && code.length > 5) {
      blocks.push({
        explanation: 'Proposed code modification based on your request.',
        code,
        language: lang,
        filename
      });
    }
  }

  return blocks;
}
