import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActiveChatHeader } from './components/ActiveChatHeader';
import { LandingView } from './components/LandingView';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ArtifactViewer } from './components/ArtifactViewer';
import { ProjectsView } from './components/ProjectsView';
import { ArtifactsView } from './components/ArtifactsView';
import { ArtifactCategoryPicker } from './components/ArtifactCategoryPicker';
import { UpgradeView } from './components/UpgradeView';
import { CustomizeModal } from './components/CustomizeModal';
import { SearchModal } from './components/SearchModal';
import { useChat } from './context/ChatContext';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { ActivePageView } from './types';
import { ArrowDown, PanelLeftOpen } from 'lucide-react';

// Lazy load large views
const CustomizeView = React.lazy(() =>
  import('./components/CustomizeView').then((mod) => ({ default: mod.CustomizeView }))
);
const CodeWorkspaceView = React.lazy(() =>
  import('./components/code/CodeWorkspaceView').then((mod) => ({ default: mod.CodeWorkspaceView }))
);

const ClaudeWorkspace: React.FC = () => {
  const {
    activeConversation,
    activePageView,
    setActivePageView,
    isArtifactPaneOpen,
    setIsArtifactPaneOpen,
    activeArtifact,
    isStreaming
  } = useChat();

  const { settings } = useSettings();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Default to open on desktop, closed on mobile
    return window.innerWidth >= 768;
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [previousPageView, setPreviousPageView] = useState<ActivePageView>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle window resize - auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Don't force close if user explicitly opened it
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track previous view before navigating to upgrade
  const handleNavigateUpgrade = () => {
    if (activePageView !== 'upgrade') {
      setPreviousPageView(activePageView);
    }
    setActivePageView('upgrade');
  };

  const hasMessages = Boolean(activeConversation && activeConversation.messages.length > 0);

  // Auto-scroll to bottom on streaming or new messages
  useEffect(() => {
    if (activePageView === 'chat' && hasMessages && settings.autoScroll !== false) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages, isStreaming, activePageView, settings.autoScroll, hasMessages]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      // Ctrl+Shift+, for settings
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ',') {
        e.preventDefault();
        // Settings handled in SettingsContext
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScroll = () => {
    if (chatScrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollBottom(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── FULL PAGE UPGRADE VIEW ───
  if (activePageView === 'upgrade') {
    return (
      <UpgradeView
        onBack={() => setActivePageView(previousPageView || 'chat')}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#141413] text-[#ECEBE7] font-sans antialiased selection:bg-[#DA7756]/30">
      {/* Left Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#141413]">
        
        {/* Top Header for active chat */}
        {activePageView === 'chat' && hasMessages && (
          <ActiveChatHeader
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          
          {/* Projects View */}
          {activePageView === 'projects' && <ProjectsView />}

          {/* Artifacts View */}
          {activePageView === 'artifacts' && <ArtifactsView />}

          {/* Code Workspace View */}
          {activePageView === 'code' && (
            <React.Suspense fallback={
              <div className="flex-1 flex items-center justify-center bg-[#141413]">
                <div className="text-sm text-[#8C8A82]">Loading Code Workspace...</div>
              </div>
            }>
              <CodeWorkspaceView />
            </React.Suspense>
          )}

          {/* Customize View */}
          {activePageView === 'customize' && (
            <React.Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-[#8C8A82]">Loading...</div>
              </div>
            }>
              <CustomizeView />
            </React.Suspense>
          )}

          {/* Chat View */}
          {activePageView === 'chat' && (
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
              {!hasMessages ? (
                /* Landing / Empty Chat State or Artifact Starter Picker */
                activeConversation?.isArtifactPicker ? (
                  <div className="flex-1 overflow-y-auto flex flex-col justify-start">
                    <ArtifactCategoryPicker />
                  </div>
                ) : (
                  <LandingView
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  />
                )
              ) : (
                /* Active Conversation */
                <>
                  <div
                    ref={chatScrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto pt-4 pb-36 px-2 sm:px-4"
                  >
                    {/* If artifact starter chat, show the category cards at the top */}
                    {activeConversation?.isArtifactPicker && (
                      <ArtifactCategoryPicker
                        compact={true}
                        selectedCategory={activeConversation.artifactCategory || activeConversation.title}
                      />
                    )}

                    {activeConversation?.messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={index === (activeConversation.messages.length - 1)}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Scroll to bottom floating button */}
                  {showScrollBottom && (
                    <button
                      onClick={scrollToBottom}
                      className="absolute bottom-28 right-8 p-2 rounded-full bg-[#201F1D] hover:bg-[#282724] border border-[#2E2D2A] text-[#8C8A82] hover:text-[#ECEBE7] shadow-xl z-20 transition-all"
                      title="Scroll to bottom"
                      aria-label="Scroll to bottom"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  )}

                  {/* Bottom Sticky Composer */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#141413] via-[#141413]/95 to-transparent pt-8 pb-3 px-4 pointer-events-none">
                    <div className="pointer-events-auto">
                      <ChatInput compact />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Artifacts Split View Pane */}
          {isArtifactPaneOpen && activeArtifact && (
            <ArtifactViewer
              artifact={activeArtifact}
              onClose={() => setIsArtifactPaneOpen(false)}
            />
          )}

        </div>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Settings Modal */}
      <CustomizeModal />
    </div>
  );
};

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <ClaudeWorkspace />;
};

