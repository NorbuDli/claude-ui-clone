import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { conversations, selectConversation } = useChat();
  const [query, setQuery] = useState('');

  // Handle ESC and Ctrl+K / Cmd+K to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset search query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const matches = conversations
    .map((conv) => {
      const q = query.toLowerCase().trim();
      if (!q) {
        return {
          conv,
          titleMatch: true,
          snippet: conv.messages[0]?.content.slice(0, 100) || 'Empty conversation'
        };
      }

      const titleMatch = conv.title.toLowerCase().includes(q);
      const matchingMessage = conv.messages.find((m) => m.content.toLowerCase().includes(q));

      if (titleMatch || matchingMessage) {
        let snippet = '';
        if (matchingMessage) {
          const idx = matchingMessage.content.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const end = Math.min(matchingMessage.content.length, idx + 80);
          snippet = (start > 0 ? '...' : '') + matchingMessage.content.slice(start, end) + (end < matchingMessage.content.length ? '...' : '');
        } else {
          snippet = conv.messages[0]?.content.slice(0, 100) || '';
        }

        return {
          conv,
          titleMatch,
          snippet
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ conv: typeof conversations[0]; titleMatch: boolean; snippet: string }>;

  const handleSelect = (id: string) => {
    selectConversation(id);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 duration-75 cursor-default"
      role="dialog"
      aria-modal="true"
      aria-label="Search conversations"
    >
      <div
        className="w-full max-w-xl bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl overflow-hidden select-none cursor-auto duration-75"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#262522]">
          <Search className="w-4 h-4 text-[#8C8A82] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search conversations and messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-[#ECEBE7] placeholder-[#706E68] focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#706E68] hover:text-[#ECEBE7] transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-[10px] text-[#706E68] hover:text-[#ECEBE7] font-mono px-1.5 py-0.5 rounded bg-[#141413] border border-[#242320] transition-colors"
              title="Close search (ESC)"
            >
              ESC
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {matches.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#706E68]">
              No matching conversations found for "{query}".
            </div>
          ) : (
            matches.map(({ conv, snippet }) => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className="group flex items-start justify-between p-3 rounded-xl hover:bg-[#22211F] cursor-pointer transition-colors"
              >
                <div className="space-y-1 overflow-hidden pr-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#DA7756] shrink-0" />
                    <span className="font-medium text-xs text-[#ECEBE7] group-hover:text-[#DA7756] transition-colors truncate">
                      {conv.title}
                    </span>
                  </div>
                  {snippet && (
                    <p className="text-[11px] text-[#8C8A82] line-clamp-1 pl-5">
                      {snippet}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#706E68] shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#DA7756] ml-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
