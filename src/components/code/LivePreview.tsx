import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCw,
  ExternalLink,
  AlertCircle,
  Code2,
  FileQuestion,
  Layers,
  ChevronDown
} from 'lucide-react';
import { CodeProject, CodeFile } from './types';

interface LivePreviewProps {
  project: CodeProject | null;
  activeFile?: CodeFile | null;
  onPreviewLog?: (type: 'info' | 'error' | 'warn' | 'success', msg: string) => void;
  onPreviewError?: (error: { message: string; line?: number; column?: number }) => void;
  onClearErrors?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  project,
  activeFile,
  onPreviewLog,
  onPreviewError,
  onClearErrors
}) => {
  const [deviceMode, setDeviceMode] = useState<'web' | 'mobile'>('web');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [selectedComponentOverride, setSelectedComponentOverride] = useState<string | null>(null);
  const [renderedComponentName, setRenderedComponentName] = useState<string>('App');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!project) {
    return (
      <div className="w-[360px] lg:w-[440px] xl:w-[480px] h-full bg-[#141413] border-l border-[#242320] flex flex-col shrink-0 select-none">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242320]">
          <span className="text-xs font-medium text-[#ECEBE7]">Preview</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8C8A82]">
          <Code2 className="w-8 h-8 text-[#555] mb-2" />
          <p className="text-xs font-medium text-[#ECEBE7]">No project open</p>
          <p className="text-[11px] text-[#706E68] mt-1">Open a project or file to view live preview</p>
        </div>
      </div>
    );
  }

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

  // Find previewable files
  const htmlFiles = files.filter((f) => f.name.toLowerCase().endsWith('.html'));
  const activeHtml = activeFile && activeFile.name.toLowerCase().endsWith('.html') ? activeFile : null;
  const htmlFile = activeHtml || htmlFiles.find((f) => f.name.toLowerCase() === 'index.html') || htmlFiles[0];

  const cssFiles = files.filter((f) => f.name.toLowerCase().endsWith('.css'));
  const jsFiles = files.filter((f) => f.name.toLowerCase().endsWith('.js') && !f.name.endsWith('.config.js'));
  const reactFiles = files.filter(
    (f) =>
      f.name.endsWith('.tsx') ||
      f.name.endsWith('.jsx') ||
      (f.name.endsWith('.ts') && !f.name.endsWith('.d.ts')) ||
      (f.name.endsWith('.js') && !f.name.endsWith('.config.js') && !htmlFile)
  );

  const hasPreviewableContent = Boolean(
    htmlFile ||
    reactFiles.length > 0 ||
    jsFiles.length > 0 ||
    cssFiles.length > 0
  );

  // Extract all Lucide icon names imported across all project files
  const allLucideIcons = useMemo(() => {
    const iconNames = new Set<string>([
      'Play', 'Pause', 'RotateCcw', 'Coffee', 'Zap', 'CheckCircle2', 'Plus', 'Trash2',
      'Check', 'Sparkles', 'Heart', 'Star', 'ArrowRight', 'Search', 'Settings', 'User',
      'Code', 'Folder', 'File', 'ChevronRight', 'ChevronDown', 'ChevronUp', 'ChevronLeft',
      'Menu', 'X', 'ExternalLink', 'AlertCircle', 'Info', 'Eye', 'Copy', 'Download',
      'Share2', 'Filter', 'Activity', 'BarChart', 'LineChart', 'PieChart', 'Calendar',
      'Clock', 'Bell', 'Mail', 'Send', 'Sun', 'Moon', 'Globe', 'Terminal', 'Database',
      'Layers', 'Cpu', 'Sliders', 'Shield', 'Lock', 'Unlock', 'Edit', 'Edit2', 'Edit3'
    ]);

    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
    for (const f of files) {
      let m;
      while ((m = importRegex.exec(f.content)) !== null) {
        const rawImports = m[1].split(',');
        for (const item of rawImports) {
          const trimmed = item.trim().split(/\s+as\s+/)[0].trim();
          if (trimmed && /^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
            iconNames.add(trimmed);
          }
        }
      }
    }
    return Array.from(iconNames);
  }, [files]);

  // Extract all declared React component names
  const availableComponents = useMemo(() => {
    const names = new Set<string>();
    for (const f of reactFiles) {
      const matches = f.content.matchAll(/(?:export\s+)?(?:default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z0-9_]*)/g);
      for (const m of matches) {
        if (m[1] && m[1] !== 'React' && m[1] !== 'FC') {
          names.add(m[1]);
        }
      }
      const defaultExportMatch = f.content.match(/export\s+default\s+([A-Z][a-zA-Z0-9_]*);?/);
      if (defaultExportMatch && defaultExportMatch[1]) {
        names.add(defaultExportMatch[1]);
      }
      const base = f.name.replace(/\.[^.]+$/, '');
      if (/^[A-Z][a-zA-Z0-9_]*$/.test(base)) {
        names.add(base);
      }
    }
    return Array.from(names);
  }, [reactFiles]);

  // Determine preferred entry component
  const preferredEntryComponent = useMemo(() => {
    if (selectedComponentOverride && availableComponents.includes(selectedComponentOverride)) {
      return selectedComponentOverride;
    }
    if (availableComponents.includes('App')) return 'App';
    if (availableComponents.includes('Dashboard')) return 'Dashboard';
    if (availableComponents.includes('Main')) return 'Main';

    if (activeFile) {
      const activeBase = activeFile.name.replace(/\.[^.]+$/, '');
      if (availableComponents.includes(activeBase)) return activeBase;
    }

    return availableComponents[0] || 'App';
  }, [selectedComponentOverride, availableComponents, activeFile]);

  // Generate live bundled HTML content from project files
  const generatePreviewDoc = (): string => {
    if (!hasPreviewableContent) {
      return '';
    }

    const combinedCss = cssFiles.map((f) => f.content).join('\n\n');
    const combinedJs = jsFiles.map((f) => f.content).join('\n\n');

    const loggerScript = `
    <script>
      window.onerror = function(msg, url, line, col, error) {
        window.parent.postMessage({ type: 'code-preview-error', message: String(msg), line: line || 1, column: col || 1 }, '*');
      };
      const _log = console.log;
      console.log = function(...args) {
        _log.apply(console, args);
        window.parent.postMessage({ type: 'code-preview-log', logType: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      };
      const _err = console.error;
      console.error = function(...args) {
        _err.apply(console, args);
        window.parent.postMessage({ type: 'code-preview-log', logType: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      };
    </script>`;

    // Case 1: Pure HTML project or active HTML file
    if (htmlFile && (reactFiles.length === 0 || activeHtml || htmlFile.content.includes('<canvas') || htmlFile.content.includes('<script') || htmlFile.content.includes('<!DOCTYPE') || htmlFile.content.includes('<html'))) {
      let content = htmlFile.content.trim();

      // Clean up any accidental markdown fences: ```html ... ``` or ``` ... ```
      if (content.startsWith('```')) {
        content = content.replace(/^```[a-zA-Z0-9_-]*[ \t]*\r?\n/, '').replace(/\r?\n```\s*$/, '').trim();
      }

      // If the content is conversational or has text before <!DOCTYPE or <html or <div or <canvas or <style
      const tagStartIndex = content.search(/<(?:!doctype|html|head|body|div|canvas|style|script|main|section|header|p|h1|h2|button|svg)/i);
      if (tagStartIndex > 0) {
        content = content.substring(tagStartIndex).trim();
      }

      const hasHtmlTag = /<html[\s>]/i.test(content);
      const hasHeadTag = /<head[\s>]/i.test(content);
      const hasBodyTag = /<body[\s>]/i.test(content);

      // 1. Inlining linked CSS files:
      content = content.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (match, href) => {
        const cssName = href.replace(/^(\.\/|\/)/, '').split('?')[0];
        const matchingCss = cssFiles.find(f => f.name === cssName || f.path === cssName || f.path.endsWith(cssName));
        if (matchingCss) {
          return `<style data-inlined="${cssName}">\n${matchingCss.content}\n</style>`;
        }
        return match;
      });

      // 2. Inlining script tags:
      content = content.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
        const jsName = src.replace(/^(\.\/|\/)/, '').split('?')[0];
        const matchingJs = jsFiles.find(f => f.name === jsName || f.path === jsName || f.path.endsWith(jsName));
        if (matchingJs) {
          return `<script data-inlined="${jsName}">\n${matchingJs.content}\n</script>`;
        }
        return match;
      });

      // 3. If there is style.css in the project and it was not yet inlined and content doesn't already contain it
      const projectStyleCss = cssFiles.find(f => f.name.toLowerCase() === 'style.css');
      if (projectStyleCss && !content.includes(projectStyleCss.content) && !content.includes('style.css')) {
        content = `<style data-file="style.css">\n${projectStyleCss.content}\n</style>\n${content}`;
      }

      // 4. If there is game.js or main.js in the project and it was not yet inlined and content doesn't already contain it
      const projectGameJs = jsFiles.find(f => f.name.toLowerCase() === 'game.js' || f.name.toLowerCase() === 'main.js');
      if (projectGameJs && !content.includes(projectGameJs.content) && !content.includes(projectGameJs.name)) {
        content = `${content}\n<script data-file="${projectGameJs.name}">\n${projectGameJs.content}\n</script>`;
      }

      // If snippet without <html> or <body>, wrap in a full HTML page
      if (!hasHtmlTag && !hasBodyTag) {
        return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${loggerScript}
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #141413;
      color: #ECEBE7;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    canvas {
      display: block;
      margin: 0 auto;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
      }

      if (hasHeadTag) {
        return content.replace(/<head>/i, `<head>${loggerScript}`);
      }
      return `${loggerScript}\n${content}`;
    }

    // Case 2: Standalone JS game or web script without an explicit index.html
    if (!htmlFile && reactFiles.length === 0 && jsFiles.length > 0) {
      return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${loggerScript}
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #141413;
      color: #ECEBE7;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    canvas {
      background: #000;
      border: 2px solid #333;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    ${combinedCss}
  </style>
</head>
<body>
  <div id="game-container" class="flex flex-col items-center gap-3">
    <canvas id="canvas" width="400" height="400"></canvas>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <canvas id="game" width="400" height="400"></canvas>
  </div>
  <script>
    try {
      ${combinedJs}
      window.parent.postMessage({ type: 'code-preview-ready' }, '*');
    } catch(err) {
      window.parent.postMessage({ type: 'code-preview-error', message: err.message || 'Script execution error' }, '*');
    }
  </script>
</body>
</html>`;
    }

    // Case 2: React / JSX / TSX project
    const sortedReactFiles = [...reactFiles].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName.includes('app') || aName.includes('dashboard') || aName.includes('index')) return 1;
      if (bName.includes('app') || bName.includes('dashboard') || bName.includes('index')) return -1;
      return a.path.localeCompare(b.path);
    });

    const componentCodeBlocks = sortedReactFiles
      .map((f) => {
        const clean = f.content
          .replace(/import\s+React\s*,\s*\{[^}]*\}\s+from\s+['"][^'"]+['"];?/g, '')
          .replace(/import\s+React\s+from\s+['"][^'"]+['"];?/g, '')
          .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
          .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
          .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, '')
          .replace(/export\s+(const|function|class|type|interface)\s+/g, '$1 ');
        return `// File: ${f.name}\n${clean}`;
      })
      .join('\n\n');

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            claude: {
              bg: '#141413',
              card: '#1C1B19',
              coral: '#DA7756',
              border: '#2B2A27'
            }
          }
        }
      }
    }
  </script>
  <!-- React 18 & ReactDOM 18 -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- Babel Standalone for live JSX/TSX transpilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Lucide Icons UMD -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #141413;
      color: #ECEBE7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ${combinedCss}
  </style>
  <script>
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
      const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, useReducer } = React;

      // Dynamic Lucide Icon factory
      function createLucideIcon(iconName) {
        return function LucideIconComponent(props) {
          const spanRef = React.useRef(null);
          React.useEffect(() => {
            if (window.lucide && spanRef.current) {
              window.lucide.createIcons({
                root: spanRef.current
              });
            }
          });
          const kebab = (iconName || 'circle')
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();
          const size = props.size || 16;
          return (
            <span
              ref={spanRef}
              className={props.className || 'inline-flex items-center justify-center'}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', ...props.style }}
            >
              <i data-lucide={kebab} style={{ width: size, height: size }}></i>
            </span>
          );
        };
      }

      const LucideProxy = new Proxy({}, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            return createLucideIcon(prop);
          }
          return undefined;
        }
      });

      const { ${allLucideIcons.join(', ')} } = LucideProxy;

      // Bundled Project Components
      ${componentCodeBlocks}

      // Entry Component Selection & Mounting
      const candidateNames = ${JSON.stringify(availableComponents)};
      const preferredName = ${JSON.stringify(preferredEntryComponent)};
      let RootComponent = null;

      if (preferredName && typeof window[preferredName] === 'function') {
        RootComponent = window[preferredName];
      } else if (typeof App !== 'undefined') {
        RootComponent = App;
      } else {
        for (const name of candidateNames) {
          try {
            const val = eval(name);
            if (typeof val === 'function') {
              RootComponent = val;
              break;
            }
          } catch {}
        }
      }

      if (RootComponent) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<RootComponent />);
        window.parent.postMessage({
          type: 'code-preview-ready',
          renderedComponent: RootComponent.name || preferredName || 'Component'
        }, '*');

        setTimeout(() => {
          if (window.lucide) window.lucide.createIcons();
        }, 100);
      } else {
        document.getElementById('root').innerHTML = '<div class="p-8 text-center text-zinc-400 text-xs">No React component found. Define an App or component in your project files.</div>';
      }
    } catch (err) {
      window.parent.postMessage({
        type: 'code-preview-error',
        message: err.message || 'Compilation Error',
        line: 1,
        column: 1
      }, '*');
      document.getElementById('root').innerHTML = '<div style="padding:24px;color:#F87171;font-family:monospace;background:#18181B;border-radius:12px;border:1px solid #7F1D1D;font-size:12px;"><strong>Preview Build Error:</strong><br/><pre style="white-space:pre-wrap;margin-top:8px;">' + err.message + '</pre></div>';
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
        if (e.data.renderedComponent) {
          setRenderedComponentName(e.data.renderedComponent);
        }
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
    const doc = generatePreviewDoc();
    if (!doc) return;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const currentDoc = generatePreviewDoc();

  return (
    <div className="w-[360px] lg:w-[440px] xl:w-[480px] h-full bg-[#141413] border-l border-[#242320] flex flex-col shrink-0 select-none">
      {/* ─── Top Header ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242320]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#ECEBE7]">Preview</span>

          {/* Component Switcher Dropdown (if multiple components exist) */}
          {availableComponents.length > 1 && (
            <div className="relative flex items-center">
              <select
                value={preferredEntryComponent}
                onChange={(e) => setSelectedComponentOverride(e.target.value)}
                className="bg-[#1C1B19] border border-[#2B2A27] text-[#ECEBE7] text-[11px] rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:border-[#DA7756]/60 transition-colors"
                title="Select root component to render"
              >
                {availableComponents.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Web / Mobile Switcher */}
          {hasPreviewableContent && (
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
          )}
        </div>

        {/* Right Controls */}
        {hasPreviewableContent && (
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
        )}
      </div>

      {/* ─── Preview Stage ─── */}
      <div className="flex-1 overflow-auto p-3 flex items-center justify-center bg-[#0D0D0C]">
        {!hasPreviewableContent ? (
          <div className="text-center p-6 space-y-2 max-w-xs">
            <FileQuestion className="w-8 h-8 text-[#555] mx-auto" />
            <p className="text-xs font-medium text-[#ECEBE7]">Preview unavailable</p>
            <p className="text-[11px] text-[#706E68] leading-relaxed">
              This project does not contain a web previewable file (.html, .tsx, .jsx).
            </p>
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
