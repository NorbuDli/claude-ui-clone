import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Eye,
  Trash2,
  Layers,
  Globe,
  FileCode
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { Artifact, ArtifactType } from '../types';

export const ArtifactsView: React.FC = () => {
  const {
    allArtifacts,
    setActiveArtifact,
    setIsArtifactPaneOpen,
    deleteArtifact,
    startNewArtifactChat
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredArtifacts = allArtifacts.filter(
    (art) =>
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: ArtifactType) => {
    if (type === 'application/vnd.ant.react') return <Layers className="w-4 h-4 text-[#DA7756]" />;
    if (type === 'text/html') return <Globe className="w-4 h-4 text-[#3B82F6]" />;
    if (type === 'image/svg+xml') return <Sparkles className="w-4 h-4 text-[#8B5CF6]" />;
    return <FileCode className="w-4 h-4 text-[#10B981]" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-y-auto select-none">
      
      {/* Top Header matching Image 1 */}
      <div className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto w-full">
        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#ECEBE7]">
          Artifacts
        </h1>

        <div className="flex items-center gap-3">
          {/* Search button / input */}
          {isSearchOpen ? (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artifacts..."
                autoFocus
                className="bg-[#1C1B19] border border-[#2E2D2A] rounded-xl px-3 py-1.5 text-xs text-[#ECEBE7] placeholder-[#666] outline-none focus:border-[#DA7756]"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
              title="Search artifacts"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* New Artifact White Pill Button (matching Image 1) */}
          <button
            onClick={startNewArtifactChat}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            New artifact
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-4xl mx-auto w-full">
        
        {allArtifacts.length === 0 ? (
          /* Empty State matching Image 1 */
          <div className="flex flex-col items-center text-center space-y-6 max-w-md my-auto">
            
            {/* Minimalist Geometric line art icon (Square, triangle, circle with hand pointer) */}
            <div className="w-16 h-16 relative flex items-center justify-center text-[#9E9C94]">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="14" width="16" height="16" rx="2" />
                <path d="M34 10L42 24H26L34 10Z" />
                <circle cx="34" cy="38" r="7" />
                {/* Hand pointer */}
                <path d="M16 22L28 34M28 26V34H20" stroke="#DA7756" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-[#ECEBE7]">
                What will you build with artifacts?
              </h2>
              <p className="text-xs text-[#8C8A82] leading-relaxed">
                If you can dream it, you can build it. Take apps, games, templates, and tools from thought to reality.
              </p>
            </div>

            {/* Dark Pill Button matching Image 1 */}
            <button
              onClick={startNewArtifactChat}
              className="px-4 py-2 rounded-xl bg-[#201F1D] hover:bg-[#282724] text-xs font-normal text-[#ECEBE7] border border-[#2D2C28] shadow-sm transition-all"
            >
              New artifact
            </button>

          </div>
        ) : (
          /* Artifacts Grid View */
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => {
                    setActiveArtifact(art);
                    setIsArtifactPaneOpen(true);
                  }}
                  className="group p-5 rounded-2xl bg-[#1C1B19]/80 border border-[#282725] hover:border-[#383734] hover:bg-[#201F1D] cursor-pointer transition-all flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(art.type)}
                        <h3 className="font-medium text-sm text-[#ECEBE7] group-hover:text-white transition-colors truncate">
                          {art.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-[#8C8A82] bg-[#141413] px-2 py-0.5 rounded border border-[#262522]">
                        {art.type.includes('react') ? 'React' : art.type.includes('html') ? 'HTML' : 'File'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#7E7C76] truncate">
                      {art.identifier}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#262522] flex items-center justify-between text-xs text-[#7E7C76]">
                    <span>{new Date(art.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete artifact "${art.title}"?`)) {
                            deleteArtifact(art.id);
                          }
                        }}
                        className="p-1 rounded text-[#7E7C76] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete artifact"
                        aria-label="Delete artifact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[#DA7756] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <Eye className="w-3.5 h-3.5" /> Launch
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
