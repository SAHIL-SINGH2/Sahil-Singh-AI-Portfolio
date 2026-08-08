import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles, Command } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isDisabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isDisabled }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim() && !isDisabled) {
      onSendMessage(inputText.trim());
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setInputText('Tell me about Sahil\'s experience with FastAPI and React.');
    }
  };

  return (
    <div className="p-3 md:p-4 win-taskbar-bg border-t border-black/5 dark:border-white/10 shrink-0 z-20">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
        <div className="relative flex items-end bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-inner">
          {/* Attach Button (Future Feature) */}
          <button
            type="button"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 mb-0.5"
            title="Attach Document / Job Description (Future Feature)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input Button (Future Feature) */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2 rounded-xl transition-colors shrink-0 mb-0.5 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={isListening ? 'Voice listening...' : 'Voice Input (Future Feature)'}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder="Ask anything about this candidate..."
            className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-xs md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none max-h-32 py-2 px-2 leading-relaxed"
          />

          {/* Send Action Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isDisabled}
            className={`p-2.5 rounded-xl transition-all shrink-0 mb-0.5 ${
              inputText.trim() && !isDisabled
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'
                : 'bg-black/5 dark:bg-white/5 text-gray-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Helper Bar */}
        <div className="flex items-center justify-between px-3 mt-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            AI Resume Twin • Windows 11 Fluent Edition
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Command className="w-3 h-3" />
            Press <kbd className="bg-gray-200 dark:bg-gray-800 px-1 py-0.2 rounded text-[9px] font-mono">Enter</kbd> to send, <kbd className="bg-gray-200 dark:bg-gray-800 px-1 py-0.2 rounded text-[9px] font-mono">Shift+Enter</kbd> for new line
          </span>
        </div>
      </form>
    </div>
  );
};
