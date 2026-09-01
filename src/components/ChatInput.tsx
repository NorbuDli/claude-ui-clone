import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ArrowUp,
  Square,
  MicOff,
  X,
  FileCode,
  FileText,
  Sparkles
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { Attachment } from '../types';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';
import { AddContentDropdown } from './AddContentDropdown';
import { ClaudeMic, ClaudeWaveform } from './ClaudeIcons';

interface ChatInputProps {
  compact?: boolean;
  fullWidth?: boolean;
  forcePlaceholder?: string;
  hideQuickAnswer?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  compact = false,
  fullWidth = false,
  forcePlaceholder,
  hideQuickAnswer = false
}) => {
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    activeMode,
    setActiveMode,
    activeConversation
  } = useChat();

  const { settings } = useSettings();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Keyboard shortcut Ctrl+U for file upload
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScreenshot = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach((track) => track.stop());

        const dataUrl = canvas.toDataURL('image/png');
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-screenshot`,
            name: `Screenshot-${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
            type: 'image/png',
            size: dataUrl.length,
            dataUrl
          }
        ]);
      } else {
        alert('Screen capture is not supported in this browser.');
      }
    } catch (err) {
      console.warn('Screenshot canceled or failed:', err);
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: reader.result as string
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              type: file.type,
              size: file.size,
              textContent: reader.result as string
            }
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      stopGeneration();
      return;
    }

    if (!input.trim() && attachments.length === 0) return;

    sendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const isReadyToSend = Boolean(input.trim() || attachments.length > 0);

  return (
    <div className={`w-full relative transition-all ${fullWidth ? 'w-full' : compact ? 'max-w-3xl mx-auto' : 'max-w-2xl mx-auto'}`}>
      
      {/* Floating suggestion chip above prompt bar when in active chat */}
      {hasMessages && !hideQuickAnswer && (
        <div className="flex justify-center mb-2.5">
          <button
            type="button"
            onClick={() => setInput('Can you provide a quick answer?')}
            className="px-3 py-1 rounded-full bg-[#1C1B19] hover:bg-[#242320] border border-[#2E2D2A] text-[11px] font-medium text-[#9C9A92] hover:text-[#ECEBE7] shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-[#DA7756]" />
            <span>Quick answer</span>
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.js,.jsx,.ts,.tsx,.html,.css,.json,.py,.java,.c,.cpp,.rs,.go,.md,.txt,.pdf,.csv"
      />

      {/* Main Input Box Card (matching screenshot) */}
      <div className="bg-[#1C1B19] rounded-2xl border border-[#2B2A27] hover:border-[#383733] focus-within:border-[#42413C] transition-all shadow-lg">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141413] border border-[#2E2D2A] text-xs text-[#ECEBE7] max-w-xs"
              >
                {att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-7 h-7 object-cover rounded border border-[#333]"
                  />
                ) : att.name.endsWith('.js') || att.name.endsWith('.ts') || att.name.endsWith('.py') ? (
                  <FileCode className="w-4 h-4 text-[#DA7756]" />
                ) : (
                  <FileText className="w-4 h-4 text-[#8C8A82]" />
                )}
                <span className="truncate text-xs">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="ml-1 text-[#7E7C76] hover:text-red-400 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="p-3.5 pb-1.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={forcePlaceholder || (hasMessages ? 'Write a message...' : 'How can I help you today?')}
            className="w-full bg-transparent text-[#ECEBE7] placeholder-[#706E68] text-sm resize-none focus:outline-none leading-relaxed font-sans max-h-[200px]"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#242320]">
          
          {/* Left Actions: + and Mode toggle */}
          <div className="flex items-center gap-2 relative">
            
            {/* The "+" Button with AddContentDropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className={`p-1.5 rounded-lg transition-colors border ${
                  isAddMenuOpen
                    ? 'bg-[#282724] text-[#ECEBE7] border-[#34332F]'
                    : 'text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#242320] border-transparent'
                }`}
                title="Add content, screenshot, or skills (Ctrl+U)"
              >
                <Plus className="w-4 h-4" />
              </button>

              <AddContentDropdown
                isOpen={isAddMenuOpen}
                onClose={() => setIsAddMenuOpen(false)}
                onUploadClick={() => fileInputRef.current?.click()}
                onScreenshotCapture={handleScreenshot}
              />
            </div>

            {/* Chat / Cowork Mode Toggle (only on landing page) */}
            {!hasMessages && (
              <div className="flex items-center bg-[#141413] p-0.5 rounded-lg border border-[#242320] text-xs">
                <button
                  type="button"
                  onClick={() => setActiveMode('chat')}
                  className={`px-2.5 py-1 rounded-md transition-all font-normal ${
                    activeMode === 'chat'
                      ? 'bg-[#2A2824] text-[#ECEBE7] shadow-sm'
                      : 'text-[#8C8A82] hover:text-[#ECEBE7]'
                  }`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('cowork')}
                  className={`px-2.5 py-1 rounded-md transition-all font-normal ${
                    activeMode === 'cowork'
                      ? 'bg-[#2A2824] text-[#ECEBE7] shadow-sm'
                      : 'text-[#8C8A82] hover:text-[#ECEBE7]'
                  }`}
                >
                  Cowork
                </button>
              </div>
            )}
          </div>

          {/* Right Actions: Model selector, Mic, Waveform, Send */}
          <div className="flex items-center gap-1.5 relative">
            
            {/* Model Selector */}
            <ModelSelectorDropdown />

            {/* Voice Dictation (Mic) */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#242320]'
              }`}
              title={isListening ? 'Stop listening' : 'Voice dictation'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <ClaudeMic size={17} color="#8C8A82" />}
            </button>

            {/* Claude Waveform Icon (matching screenshot) */}
            <button
              type="button"
              className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#242320] transition-colors"
              title="Voice Mode"
            >
              <ClaudeWaveform size={17} color="#8C8A82" />
            </button>

            {/* Send / Stop Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isStreaming && !isReadyToSend}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isStreaming
                  ? 'bg-[#DA7756] hover:bg-[#C86545] text-white shadow'
                  : isReadyToSend
                  ? 'bg-[#DA7756] hover:bg-[#C86545] text-white shadow-sm cursor-pointer'
                  : 'bg-[#252422] text-[#4E4D48] cursor-not-allowed'
              }`}
              title={isStreaming ? 'Stop response' : 'Send message (Enter)'}
            >
              {isStreaming ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.2]" />
              )}
            </button>

          </div>

        </div>

      </div>

      {/* Footer Disclaimer */}
      <p className="text-center text-[10px] text-[#66645E] mt-2">
        Claude can make mistakes. Please double-check responses.
      </p>
    </div>
  );
};
