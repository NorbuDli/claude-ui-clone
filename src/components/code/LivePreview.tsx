import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  AlertCircle,
  Code2
} from 'lucide-react';
import { CodeProject, CodeFile } from './types';

interface LivePreviewProps {
  project: CodeProject;
  onPreviewLog?: (type: 'info' | 'error' | 'warn' | 'success', msg: string) => void;
  onPreviewError?: (error: { message: string; line?: number; column?: number }) => void;
  onClearErrors?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  project,
  onPreviewLog,
  onPreviewError,
  onClearErrors
}) => {
  const [deviceMode, setDeviceMode] = useState<'web' | 'mobile'>('web');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Flatten all files in project
  const getAllFiles = (nodes: any[]): CodeFile[] => {
    let list: CodeFile[] = [];
    for (const n of nodes) {
      if (!n.isFolder) {
        list.push(n);
      } else if (n.children) {
        list = list.concat(getAllFiles(n.children));
      }
    }
    return list;
  };

  const files = getAllFiles(project.files);

  // Generate live bundled HTML content from project files
  const generatePreviewDoc = () => {
    const htmlFile = files.find((f) => f.name.endsWith('.html'));
    const cssFile = files.find((f) => f.name.endsWith('.css'));
    const appFile = files.find((f) => f.name === 'App.tsx' || f.name === 'App.jsx' || f.name === 'App.js');
    const indexFile = files.find((f) => f.name === 'index.tsx' || f.name === 'index.jsx' || f.name === 'index.js' || f.name === 'main.tsx');

    // If pure HTML file exists
    if (htmlFile && !appFile) {
      let content = htmlFile.content;
      if (cssFile) {
        content = content.replace('</head>', `<style>${cssFile.content}</style></head>`);
      }
      return content;
    }

    // Extract all component code
    const customCss = cssFile ? cssFile.content : '';

    // Collect all components in project
    const componentCodeBlocks = files
      .filter((f) => (f.name.endsWith('.tsx') || f.name.endsWith('.jsx') || f.name.endsWith('.js') || f.name.endsWith('.ts')) && f.name !== 'index.tsx')
      .map((f) => {
        // Strip imports/exports for in-browser Babel execution
        const clean = f.content
          .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
          .replace(/export\s+default\s+/g, '')
          .replace(/export\s+(const|function|class|type|interface)\s+/g, '$1 ');
        return `// File: ${f.name}\n${clean}`;
      })
      .join('\n\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React 18 & ReactDOM 18 -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- Babel Standalone for live JSX/TSX transpilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #141413;
      color: #ECEBE7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ${customCss}
  </style>
  <script>
    // Console Interceptor & Error Boundary
    window.onerror = function(msg, url, line, col, error) {
      window.parent.postMessage({
        type: 'code-preview-error',
        message: String(msg),
        line: line || 1,
        column: col || 1
      }, '*');
      return false;
    };

    const _log = console.log;
    console.log = function(...args) {
      _log.apply(console, args);
      window.parent.postMessage({
        type: 'code-preview-log',
        logType: 'info',
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      }, '*');
    };

    const _warn = console.warn;
    console.warn = function(...args) {
      _warn.apply(console, args);
      window.parent.postMessage({
        type: 'code-preview-log',
        logType: 'warn',
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      }, '*');
    };

    const _error = console.error;
    console.error = function(...args) {
      _error.apply(console, args);
      window.parent.postMessage({
        type: 'code-preview-log',
        logType: 'error',
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      }, '*');
    };
  </script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    try {
      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      ${componentCodeBlocks}

      // Root App Render
      if (typeof App !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
        window.parent.postMessage({ type: 'code-preview-ready' }, '*');
      } else {
        document.getElementById('root').innerHTML = '<div class="p-8 text-center text-zinc-400">No App component exported. Create an App component in App.tsx.</div>';
      }
    } catch (err) {
      window.parent.postMessage({
        type: 'code-preview-error',
        message: err.message || 'Compilation Error',
        line: 1,
        column: 1
      }, '*');
      document.getElementById('root').innerHTML = '<div style="padding:24px;color:#F87171;font-family:monospace;background:#18181B;border-radius:12px;border:1px solid #7F1D1D;"><strong>Preview Error:</strong><br/><pre style="white-space:pre-wrap;margin-top:8px;">' + err.message + '</pre></div>';
    }
  </script>
</body>
</html>`;
  };

  // Listen to postMessage from sandboxed iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'code-preview-log') {
        onPreviewLog?.(e.data.logType || 'info', e.data.message);
      } else if (e.data.type === 'code-preview-error') {
        setBuildError(e.data.message);
        onPreviewError?.({
          message: e.data.message,
          line: e.data.line,
          column: e.data.column
        });
      } else if (e.data.type === 'code-preview-ready') {
        setBuildError(null);
        onClearErrors?.();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPreviewLog, onPreviewError, onClearErrors]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setBuildError(null);
    onClearErrors?.();
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generatePreviewDoc();
    }
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleOpenExternal = () => {
    const blob = new Blob([generatePreviewDoc()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const currentDoc = generatePreviewDoc();

  return (
    <div className="w-[360px] lg:w-[440px] xl:w-[480px] h-full bg-[#141413] border-l border-[#242320] flex flex-col shrink-0 select-none">
      {/* ─── Top Header (matching Image) ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242320]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#ECEBE7]">Preview</span>

          {/* Web / Mobile Switcher */}
          <div className="bg-[#1C1B19] p-0.5 rounded-lg border border-[#282725] flex items-center gap-0.5 text-xs">
            <button
              onClick={() => setDeviceMode('web')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                deviceMode === 'web'
                  ? 'bg-[#2E2C28] text-white shadow-xs'
                  : 'text-[#8C8A82] hover:text-[#ECEBE7]'
              }`}
            >
              Web
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-[#2E2C28] text-white shadow-xs'
                  : 'text-[#8C8A82] hover:text-[#ECEBE7]'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg text-[#8C8A82] hover:text-white hover:bg-[#1E1D1B] transition-colors ${
              isRefreshing ? 'animate-spin text-[#DA7756]' : ''
            }`}
            title="Refresh preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded-lg text-[#8C8A82] hover:text-white hover:bg-[#1E1D1B] transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Preview Stage (Sandboxed Live iframe) ─── */}
      <div className="flex-1 overflow-auto p-3 flex items-center justify-center bg-[#0D0D0C]">
        {files.length === 0 ? (
          <div className="text-center p-6 space-y-2">
            <Code2 className="w-8 h-8 text-[#555] mx-auto" />
            <p className="text-xs text-[#8C8A82]">No files in project</p>
          </div>
        ) : (
          <div
            className={`bg-[#141413] border border-[#262522] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all relative ${
              deviceMode === 'mobile'
                ? 'w-[320px] h-[560px] max-h-full border-[#333]'
                : 'w-full h-full min-h-[380px]'
            }`}
          >
            {buildError && (
              <div className="p-2.5 bg-red-950/80 border-b border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{buildError}</span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={currentDoc}
              title="Project Live Preview"
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-none bg-[#141413]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
