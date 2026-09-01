import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2,
  Eye,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Artifact } from '../types';
import { useChat } from '../context/ChatContext';
import { ClaudeArtifactsIcon } from './ClaudeIcons';

interface ArtifactViewerProps {
  artifact: Artifact;
  onClose: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); // for forcing iframe reload

  // Build the sandboxed iframe HTML payload
  const iframeSrcDoc = useMemo(() => {
    if (artifact.type === 'application/vnd.ant.react') {
      // Build React bundle with Babel Standalone, React 18, and Tailwind CSS
      // Clean up common imports in the code so Babel can evaluate it cleanly
      let cleanCode = artifact.content
        .replace(/import\s+React\s*,\s*\{[^}]*\}\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/import\s+React\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/import\s+\{[^}]*\}\s+from\s+['"]lucide-react['"];?/g, '')
        .replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, 'function $1')
        .replace(/export\s+default\s+([A-Za-z0-9_]+);?/, '')
        .trim();

      // Find the main component name (e.g. PomodoroApp or App)
      const funcMatch = cleanCode.match(/function\s+([A-Z][A-Za-z0-9_]*)/);
      const constMatch = cleanCode.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=/);
      const componentName = funcMatch ? funcMatch[1] : constMatch ? constMatch[1] : 'App';

      return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            claude: {
              bg: '#191816',
              card: '#22211f',
              coral: '#DA7756',
              border: '#33312e'
            }
          }
        }
      }
    }
  </script>
  <!-- React 18 & Babel Standalone -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Lucide Icons via unpkg for script tags -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      background-color: #191816;
      color: #ECEBE7;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    // Helper to mock Lucide icons inside standalone sandbox
    const IconMock = ({ name, className = "w-4 h-4", size, ...props }) => (
      <span className={\`inline-flex items-center justify-center \${className}\`} {...props}>
        <i data-lucide={name || 'circle'}></i>
      </span>
    );

    // Provide standard lucide-react icon component stubs
    const Play = (p) => <IconMock name="play" {...p} />;
    const Pause = (p) => <IconMock name="pause" {...p} />;
    const RotateCcw = (p) => <IconMock name="rotate-ccw" {...p} />;
    const Coffee = (p) => <IconMock name="coffee" {...p} />;
    const Zap = (p) => <IconMock name="zap" {...p} />;
    const CheckCircle2 = (p) => <IconMock name="check-circle-2" {...p} />;
    const Plus = (p) => <IconMock name="plus" {...p} />;
    const Trash2 = (p) => <IconMock name="trash-2" {...p} />;
    const Check = (p) => <IconMock name="check" {...p} />;
    const Sparkles = (p) => <IconMock name="sparkles" {...p} />;
    const Heart = (p) => <IconMock name="heart" {...p} />;
    const Star = (p) => <IconMock name="star" {...p} />;
    const ArrowRight = (p) => <IconMock name="arrow-right" {...p} />;
    const Search = (p) => <IconMock name="search" {...p} />;
    const Settings = (p) => <IconMock name="settings" {...p} />;
    const User = (p) => <IconMock name="user" {...p} />;

    ${cleanCode}

    // Mount to DOM
    const rootElement = document.getElementById('root');
    const root = ReactDOM.createRoot(rootElement);
    if (typeof ${componentName} !== 'undefined') {
      root.render(<${componentName} />);
    } else {
      root.render(<div className="p-8 text-center text-red-400">Failed to identify entry component: ${componentName}</div>);
    }

    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  </script>
</body>
</html>`;
    }

    if (artifact.type === 'text/html') {
      return artifact.content;
    }

    if (artifact.type === 'image/svg+xml') {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #191816;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    svg { max-width: 100%; max-height: 90vh; }
  </style>
</head>
<body>
  ${artifact.content}
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #191816; color: #ECEBE7; font-family: monospace; padding: 20px; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <pre>${artifact.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  }, [artifact, key]);

  const copyCode = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadArtifact = () => {
    const ext =
      artifact.type === 'application/vnd.ant.react'
        ? '.tsx'
        : artifact.type === 'text/html'
        ? '.html'
        : artifact.type === 'image/svg+xml'
        ? '.svg'
        : '.txt';

    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.identifier || 'artifact'}${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col bg-[#1A1917] border-l border-[#2D2C28] h-full transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'w-full md:w-[50vw] lg:w-[55vw]'
      }`}
    >
      {/* Artifact Top Bar */}
      <div className="h-13 px-4 border-b border-[#2C2B27] bg-[#1F1E1C] flex items-center justify-between shrink-0">
        
        {/* Title & Type */}
        <div className="flex items-center gap-2.5 overflow-hidden mr-2">
          <div className="p-1.5 rounded-lg bg-[#DA7756]/15 text-[#DA7756] border border-[#DA7756]/30 shrink-0">
            <ClaudeArtifactsIcon size={14} color="#DA7756" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-semibold text-[#ECEBE7] truncate">
              {artifact.title}
            </h3>
            <span className="text-[10px] text-[#8C8A82] font-mono">
              {artifact.identifier}
            </span>
          </div>
        </div>

        {/* Center Tabs: Preview vs Code */}
        <div className="flex items-center bg-[#141312] p-0.5 rounded-lg border border-[#2B2A27]">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-[#282724] text-[#ECEBE7] shadow-sm'
                : 'text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-[#282724] text-[#ECEBE7] shadow-sm'
                : 'text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 text-[#8C8A82]">
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className="p-1.5 rounded-lg hover:bg-[#2A2926] hover:text-[#ECEBE7] transition-colors"
            title="Reload sandbox"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={copyCode}
            className="p-1.5 rounded-lg hover:bg-[#2A2926] hover:text-[#ECEBE7] transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#DA7756]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={downloadArtifact}
            className="p-1.5 rounded-lg hover:bg-[#2A2926] hover:text-[#ECEBE7] transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-[#2A2926] hover:text-[#ECEBE7] transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <div className="w-[1px] h-4 bg-[#2C2B27] mx-1" />

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2A2926] hover:text-red-400 transition-colors"
            title="Close pane"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Artifact View Body */}
      <div className="flex-1 relative overflow-hidden bg-[#161514]">
        {activeTab === 'preview' ? (
          <iframe
            key={key}
            srcDoc={iframeSrcDoc}
            title={artifact.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="w-full h-full border-0 bg-[#161514]"
          />
        ) : (
          <div className="h-full overflow-auto p-4 bg-[#141312]">
            <pre className="text-xs font-mono text-[#ECEBE7] leading-relaxed select-text">
              <code>{artifact.content}</code>
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};
