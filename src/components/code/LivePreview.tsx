import React, { useState } from 'react';
import {
  RotateCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Sparkles
} from 'lucide-react';
import { CodeProject } from './types';

interface LivePreviewProps {
  project: CodeProject;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ project }) => {
  const [deviceMode, setDeviceMode] = useState<'web' | 'mobile'>('web');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleOpenExternal = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${project.name} - Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#141413] text-[#ECEBE7] font-sans antialiased min-h-screen flex flex-col">
  <nav class="flex items-center justify-between px-6 py-4 border-b border-[#282725] bg-[#141413]">
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 22h20L12 2z" />
      </svg>
      <span class="font-semibold text-sm tracking-tight text-white">Acme</span>
    </div>
  </nav>
  <div class="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
    <h1 class="text-5xl font-bold tracking-tight text-white mb-3">
      Build something <span class="bg-gradient-to-r from-[#DA7756] to-[#F29979] bg-clip-text text-transparent">amazing.</span>
    </h1>
    <p class="text-sm text-[#A5A39C] max-w-md mb-8 leading-relaxed">
      A modern landing page built with React, TypeScript, and Vite.
    </p>
    <div class="flex items-center gap-3">
      <button class="px-5 py-2.5 rounded-xl bg-[#DA7756] text-white text-xs font-semibold shadow-md">
        Get Started
      </button>
      <button class="px-4 py-2.5 rounded-xl text-xs font-medium text-[#C4C3BE] border border-[#2B2A27]">
        Learn more &rarr;
      </button>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="w-[360px] lg:w-[440px] xl:w-[480px] h-full bg-[#141413] border-l border-[#242320] flex flex-col shrink-0 select-none">
      
      {/* ─── Top Header (matching Image) ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242320]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#ECEBE7]">Preview</span>
          
          {/* Web / Mobile Segment Switcher */}
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

        {/* Right Preview Controls (Refresh, External) */}
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

      {/* ─── Preview Stage ─── */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#0D0D0C]">
        <div
          key={refreshKey}
          className={`bg-[#141413] border border-[#262522] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all ${
            deviceMode === 'mobile'
              ? 'w-[280px] h-[520px] max-h-full border-[#333]'
              : 'w-full h-full min-h-[380px]'
          }`}
        >
          {/* Mini Nav */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#242320]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
              <span className="font-semibold text-xs text-white">Acme</span>
            </div>
            <button className="text-[#8C8A82] hover:text-white p-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Hero Section (Matching Image 100%) */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Build something <br />
              <span className="bg-gradient-to-r from-[#DA7756] via-[#E88C6C] to-[#F29979] bg-clip-text text-transparent">
                amazing.
              </span>
            </h2>
            <p className="text-xs text-[#9C9A92] max-w-xs leading-relaxed">
              A modern landing page built with React, TypeScript, and Vite.
            </p>

            <div className="flex items-center gap-2 pt-3">
              <button className="px-4 py-2 rounded-xl bg-[#DA7756] hover:bg-[#C86545] text-white text-xs font-semibold shadow-md transition-all">
                Get Started
              </button>
              <button className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#C4C3BE] hover:text-white hover:bg-[#201F1D] transition-colors flex items-center gap-1">
                <span>Learn more</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          {/* Tech Stack Footer (matching Image) */}
          <div className="py-3 px-4 border-t border-[#1F1E1C] flex items-center justify-center gap-5 text-[11px] text-[#706E68]">
            <span className="flex items-center gap-1 font-medium text-[#8C8A82]">
              <span className="text-[#61DAFB]">⚛</span> React
            </span>
            <span className="flex items-center gap-1 font-medium text-[#8C8A82]">
              <span className="text-[#3178C6] font-bold">TS</span> TypeScript
            </span>
            <span className="flex items-center gap-1 font-medium text-[#8C8A82]">
              <span className="text-[#F59E0B]">⚡</span> Vite
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
