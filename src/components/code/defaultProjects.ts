import { CodeProject, CodeFile } from './types';

const WEBSITE_REDESIGN_FILES = [
  {
    id: 'folder-src',
    name: 'src',
    path: 'src',
    isFolder: true as const,
    isOpen: true,
    children: [
      {
        id: 'folder-components',
        name: 'components',
        path: 'src/components',
        isFolder: true as const,
        isOpen: false,
        children: [
          {
            id: 'file-navbar',
            name: 'Navbar.tsx',
            path: 'src/components/Navbar.tsx',
            language: 'typescript',
            content: `import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-[#282725] bg-[#141413]">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
        <span className="font-semibold text-sm tracking-tight text-white">Acme</span>
      </div>
      <button className="text-[#8C8A82] hover:text-white p-1 rounded-md">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  );
};`
          },
          {
            id: 'file-hero',
            name: 'Hero.tsx',
            path: 'src/components/Hero.tsx',
            language: 'typescript',
            content: `import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
        Build something <span className="bg-gradient-to-r from-[#DA7756] to-[#F29979] bg-clip-text text-transparent">amazing.</span>
      </h1>
      <p className="text-sm text-[#A5A39C] max-w-md mb-8 leading-relaxed">
        A modern landing page built with React, TypeScript, and Vite.
      </p>
      <div className="flex items-center gap-3">
        <button className="px-5 py-2.5 rounded-xl bg-[#DA7756] hover:bg-[#C86545] text-white text-xs font-semibold shadow-md transition-all">
          Get Started
        </button>
        <button className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#C4C3BE] hover:text-white hover:bg-[#201F1D] transition-colors flex items-center gap-1">
          <span>Learn more</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};`
          }
        ]
      },
      {
        id: 'folder-pages',
        name: 'pages',
        path: 'src/pages',
        isFolder: true as const,
        isOpen: false,
        children: [
          {
            id: 'file-home',
            name: 'Home.tsx',
            path: 'src/pages/Home.tsx',
            language: 'typescript',
            content: `import React from 'react';
import { Hero } from '../components/Hero';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
    </div>
  );
};`
          }
        ]
      },
      {
        id: 'file-app',
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';

export const App: React.FC = () => {
  return (
    <div className="min-h-full flex flex-col bg-[#141413] text-[#ECEBE7]">
      <Navbar />
      <Hero />
      <footer className="mt-auto py-6 border-t border-[#22211F] flex items-center justify-center gap-6 text-xs text-[#706E68]">
        <span className="flex items-center gap-1.5"><span className="text-[#61DAFB]">⚛</span> React</span>
        <span className="flex items-center gap-1.5"><span className="text-[#3178C6]">TS</span> TypeScript</span>
        <span className="flex items-center gap-1.5"><span className="text-[#F59E0B]">⚡</span> Vite</span>
      </footer>
    </div>
  );
};

export default App;`
      },
      {
        id: 'file-index',
        name: 'index.tsx',
        path: 'src/index.tsx',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
  });
}`
      },
      {
        id: 'file-styles',
        name: 'styles.css',
        path: 'src/styles.css',
        language: 'css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background-color: #141413;
  color: #ECEBE7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`
      },
      {
        id: 'file-utils',
        name: 'utils.ts',
        path: 'src/utils.ts',
        language: 'typescript',
        content: `export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}`
      }
    ]
  },
  {
    id: 'folder-public',
    name: 'public',
    path: 'public',
    isFolder: true as const,
    isOpen: false,
    children: [
      {
        id: 'file-favicon',
        name: 'favicon.svg',
        path: 'public/favicon.svg',
        language: 'xml',
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#DA7756"/></svg>`
      }
    ]
  },
  {
    id: 'file-gitignore',
    name: '.gitignore',
    path: '.gitignore',
    language: 'plaintext',
    content: `node_modules
dist
.env
.DS_Store`
  },
  {
    id: 'file-package-json',
    name: 'package.json',
    path: 'package.json',
    language: 'json',
    content: `{
  "name": "website-redesign",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.475.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "tailwindcss": "^3.4.17"
  }
}`
  },
  {
    id: 'file-tsconfig',
    name: 'tsconfig.json',
    path: 'tsconfig.json',
    language: 'json',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true
  }
}`
  },
  {
    id: 'file-vite-config',
    name: 'vite.config.ts',
    path: 'vite.config.ts',
    language: 'typescript',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});`
  },
  {
    id: 'file-readme',
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    content: `# Website Redesign

A high-performance modern website built with React, TypeScript, and Vite.

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
];

export const DEFAULT_CODE_PROJECTS: CodeProject[] = [
  {
    id: 'project-website-redesign',
    name: 'Website Redesign',
    description: 'Modern landing page with hero, navbar, and responsive layout',
    files: WEBSITE_REDESIGN_FILES,
    activeFileId: 'file-index',
    openFileIds: ['file-index', 'file-app', 'file-styles'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'project-analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Interactive analytics metrics, charts, and data tables',
    files: [
      {
        id: 'file-dash-app',
        name: 'Dashboard.tsx',
        path: 'src/Dashboard.tsx',
        language: 'typescript',
        content: `import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8 bg-[#141413] text-[#ECEBE7] min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Metrics & Analytics</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1C1B19] p-5 rounded-2xl border border-[#282725]">
          <p className="text-xs text-[#8C8A82]">Total Users</p>
          <p className="text-3xl font-bold text-white mt-1">42,890</p>
        </div>
        <div className="bg-[#1C1B19] p-5 rounded-2xl border border-[#282725]">
          <p className="text-xs text-[#8C8A82]">Revenue</p>
          <p className="text-3xl font-bold text-[#DA7756] mt-1">$128,450</p>
        </div>
        <div className="bg-[#1C1B19] p-5 rounded-2xl border border-[#282725]">
          <p className="text-xs text-[#8C8A82]">Conversion Rate</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">4.8%</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;`
      }
    ],
    activeFileId: 'file-dash-app',
    openFileIds: ['file-dash-app'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 1800000
  }
];

export function findFileById(nodes: Array<any>, id: string): CodeFile | null {
  for (const node of nodes) {
    if (!node.isFolder && node.id === id) {
      return node;
    }
    if (node.isFolder && node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateFileContentInTree(nodes: Array<any>, fileId: string, newContent: string): Array<any> {
  return nodes.map((node) => {
    if (!node.isFolder && node.id === fileId) {
      return { ...node, content: newContent };
    }
    if (node.isFolder && node.children) {
      return { ...node, children: updateFileContentInTree(node.children, fileId, newContent) };
    }
    return node;
  });
}
