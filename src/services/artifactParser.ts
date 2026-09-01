import { Artifact, ArtifactType } from '../types';

export interface ParseResult {
  cleanedText: string;
  artifacts: Artifact[];
  thinkingContent?: string;
}

/**
 * Helper to clean chat text in real-time during streaming.
 * Strips out opening/closing artifact tags and raw code blocks so code never flashes in chat.
 */
export function cleanStreamingChatText(rawText: string): { cleanText: string; isCrafting: boolean; artifactTitle?: string } {
  let text = rawText;
  let isCrafting = false;
  let artifactTitle: string | undefined;

  // 1. Check for <antArtifact ...>
  const antMatch = text.match(/<antArtifact\s+([^>]*?)>/i);
  if (antMatch) {
    isCrafting = true;
    const titleMatch = antMatch[1].match(/title=["']([^"']+)["']/i);
    if (titleMatch) artifactTitle = titleMatch[1];
    text = text.replace(/<antArtifact[\s\S]*$/i, '').trim();
  }

  // 2. Check for markdown code blocks (e.g. ```html, ```javascript, ```python, etc.)
  if (/```(?:html|htm|tsx|jsx|javascript|typescript|js|ts|css|svg|python|py|cpp|c|java|game)[\s\S]*$/i.test(text)) {
    isCrafting = true;
    text = text.replace(/```(?:html|htm|tsx|jsx|javascript|typescript|js|ts|css|svg|python|py|cpp|c|java|game)[\s\S]*$/i, '').trim();
  }

  // 3. Strip raw standalone code blocks that are over 4 lines
  text = text.replace(/```[\s\S]*?```/g, (codeBlock) => {
    if (codeBlock.split('\n').length > 4) {
      isCrafting = true;
      return '';
    }
    return codeBlock;
  }).trim();

  // 4. Strip any dangling unclosed code fences
  text = text.replace(/```[\w-]*\s*$/i, '').trim();

  return { cleanText: text, isCrafting, artifactTitle };
}

/**
 * Extracts <antArtifact> tags or complete renderable code blocks from the assistant response,
 * strips the code from the chat text so chat stays clean, and produces structured Artifact objects.
 */
export function extractArtifactsAndThinking(rawText: string, messageId: string = ''): ParseResult {
  const artifacts: Artifact[] = [];
  let cleanedText = rawText;
  let thinkingContent = '';

  // 1. Extract <thinking>...</thinking> or <antThinking>...</antThinking> tags if present in text
  const thinkingMatch = cleanedText.match(/<(?:thinking|antThinking)>([\s\S]*?)<\/(?:thinking|antThinking)>/i);
  if (thinkingMatch) {
    thinkingContent = thinkingMatch[1].trim();
    cleanedText = cleanedText.replace(/<(?:thinking|antThinking)>[\s\S]*?<\/(?:thinking|antThinking)>/i, '').trim();
  }

  // 2. Extract <antArtifact ...>...</antArtifact>
  const artifactRegex = /<antArtifact\s+([^>]*?)>([\s\S]*?)(?:<\/antArtifact>|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = artifactRegex.exec(rawText)) !== null) {
    const attrString = match[1];
    const content = match[2].trim();

    // Parse attributes
    const identifierMatch = attrString.match(/identifier=["']([^"']+)["']/i);
    const typeMatch = attrString.match(/type=["']([^"']+)["']/i);
    const titleMatch = attrString.match(/title=["']([^"']+)["']/i);
    const languageMatch = attrString.match(/language=["']([^"']+)["']/i);

    const identifier = identifierMatch ? identifierMatch[1] : `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const type = (typeMatch ? typeMatch[1] : 'application/vnd.ant.code') as ArtifactType;
    const title = titleMatch ? titleMatch[1] : 'Interactive Application';
    const language = languageMatch ? languageMatch[1] : undefined;

    artifacts.push({
      id: `${messageId}-${identifier}`,
      identifier,
      type,
      title,
      language,
      content,
      messageId,
      createdAt: Date.now()
    });
  }

  // Strip all <antArtifact> blocks from the chat text
  cleanedText = cleanedText.replace(/<antArtifact[\s\S]*?(?:<\/antArtifact>|$)/gi, '').trim();

  // 3. If no <antArtifact> tags were found, check for substantial standalone code blocks (HTML/React/SVG/Python)
  if (artifacts.length === 0) {
    // Check for complete HTML documents
    const htmlRegex = /```(?:html|htm)\s*\n([\s\S]*?(?:<!DOCTYPE html>|<html)[\s\S]*?<\/html>[\s\S]*?)```/i;
    const htmlBlock = cleanedText.match(htmlRegex);
    if (htmlBlock) {
      artifacts.push({
        id: `${messageId}-html-auto`,
        identifier: 'interactive-html',
        type: 'text/html',
        title: 'Interactive Web Application',
        language: 'html',
        content: htmlBlock[1].trim(),
        messageId,
        createdAt: Date.now()
      });
      cleanedText = cleanedText.replace(htmlRegex, '').trim();
    }

    // Check for standalone SVG
    const svgRegex = /```(?:svg|xml)\s*\n([\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?)```/i;
    const svgBlock = cleanedText.match(svgRegex);
    if (svgBlock) {
      artifacts.push({
        id: `${messageId}-svg-auto`,
        identifier: 'vector-svg',
        type: 'image/svg+xml',
        title: 'Vector Graphic',
        language: 'svg',
        content: svgBlock[1].trim(),
        messageId,
        createdAt: Date.now()
      });
      cleanedText = cleanedText.replace(svgRegex, '').trim();
    }

    // Check for complete React components
    const reactRegex = /```(?:tsx|jsx|javascript|typescript)\s*\n([\s\S]*?(?:import React|export default function|const [A-Z]\w+ = \(\) =>)[\s\S]*?)```/i;
    const reactBlock = cleanedText.match(reactRegex);
    if (reactBlock && (reactBlock[1].includes('return (') || reactBlock[1].includes('return <'))) {
      artifacts.push({
        id: `${messageId}-react-auto`,
        identifier: 'interactive-react-component',
        type: 'application/vnd.ant.react',
        title: 'Interactive React Component',
        language: 'tsx',
        content: reactBlock[1].trim(),
        messageId,
        createdAt: Date.now()
      });
      cleanedText = cleanedText.replace(reactRegex, '').trim();
    }

    // Generic code block extractor for code >= 6 lines
    const genericCodeRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    let codeMatch: RegExpExecArray | null;
    while ((codeMatch = genericCodeRegex.exec(cleanedText)) !== null) {
      const lang = (codeMatch[1] || 'javascript').toLowerCase();
      const code = codeMatch[2].trim();
      if (code.split('\n').length >= 6) {
        const isHtml = lang === 'html' || code.includes('<canvas') || code.includes('<!DOCTYPE') || code.includes('<script');
        const isReact = lang === 'tsx' || lang === 'jsx' || (code.includes('import React') || code.includes('export default'));
        const isSvg = lang === 'svg' || code.startsWith('<svg');
        const artType: ArtifactType = isHtml ? 'text/html' : isReact ? 'application/vnd.ant.react' : isSvg ? 'image/svg+xml' : 'application/vnd.ant.code';
        const title = isHtml ? 'Interactive Application' : isReact ? 'React Component' : isSvg ? 'Vector SVG' : `${lang.toUpperCase()} Script`;

        artifacts.push({
          id: `${messageId}-code-${Date.now()}`,
          identifier: 'interactive-code',
          type: artType,
          title,
          language: lang,
          content: code,
          messageId,
          createdAt: Date.now()
        });
        cleanedText = cleanedText.replace(codeMatch[0], '').trim();
      }
    }
  }

  // Strip any remaining large code fences from cleanedText
  cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '').trim();

  return {
    cleanedText: cleanedText || (artifacts.length > 0 ? '' : rawText),
    artifacts,
    thinkingContent: thinkingContent || undefined
  };
}
