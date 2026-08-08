import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  PanelLeft,
  Plus,
  Image as ImageIcon,
  Library,
  Plug,
  Folder,
  Code2,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  Mic,
  Volume2,
  Edit3,
  Globe,
  Trash2,
  ArrowUp,
  Copy,
  Check,
  RotateCcw,
  Download,
  User,
  Bot,
  Terminal,
  Clock,
  MessageSquare,
  FileText,
  X
} from 'lucide-react';
import { Message, Conversation, CandidateProfile } from '../types';
import { sampleSuggestedQuestions, sahilProfile } from '../data/candidateData';

interface ChatWindowProps {
  conversations: Conversation[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  messages: Message[];
  isThinking: boolean;
  onSendMessage: (questionText: string) => void;
  onRegenerateLastMessage: () => void;
  onCopyMessage: (text: string) => void;
  onDownloadResume: () => void;
  copiedId: string | null;
  profile?: CandidateProfile;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  messages,
  isThinking,
  onSendMessage,
  onRegenerateLastMessage,
  onCopyMessage,
  onDownloadResume,
  copiedId,
  profile,
}) => {
  const p = profile || sahilProfile;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Sahil AI Assistant');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: number } | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string || `[File content of ${file.name}]`;
      setAttachedFile({
        name: file.name,
        content,
        size: file.size,
      });
    };
    reader.onerror = () => {
      setAttachedFile({
        name: file.name,
        content: `[Uploaded document: ${file.name}]`,
        size: file.size,
      });
    };

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      setAttachedFile({
        name: file.name,
        content: `[Document: ${file.name} - Uploaded for role match evaluation and scoring]`,
        size: file.size,
      });
    } else {
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((inputText.trim() || attachedFile) && !isThinking) {
      let finalMessage = inputText.trim();
      if (attachedFile) {
        finalMessage = `[Attached File: ${attachedFile.name}]\n${finalMessage ? finalMessage : 'Please evaluate this document against the role for match score, strengths, missing skills, and hiring feedback.'}\n\nFile Info:\n${attachedFile.content}`;
      }
      onSendMessage(finalMessage);
      setInputText('');
      setAttachedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const toggleVoiceInput = () => {
    setIsVoiceListening(!isVoiceListening);
    if (!isVoiceListening) {
      setInputText('Tell me about Sahil\'s experience with Full-Stack Engineering, FastAPI, and React.');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-[#0d0d0d] text-slate-100 font-sans select-none relative">
      {/* Mobile Backdrop Overlay when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/60 z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR (ChatGPT Style) */}
      <div
        className={`transition-all duration-300 ease-in-out bg-[#171717] border-r border-white/10 flex flex-col h-full shrink-0 ${
          isMobile
            ? `absolute top-0 bottom-0 left-0 z-40 w-64 shadow-2xl ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `relative z-20 ${
                isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full overflow-hidden border-none'
              }`
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-md">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-semibold text-sm text-white">Sahil AI</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSearchActive(!isSearchActive)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Search Conversations"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input field if toggled */}
        {isSearchActive && (
          <div className="px-3 pb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-[#212121] text-xs text-white placeholder-slate-400 px-3 py-1.5 rounded-lg border border-white/15 focus:outline-none focus:border-white/30"
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons list */}
        <div className="px-2 space-y-1">
          {/* + New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (isMobile) setIsSidebarOpen(false);
            }}
            className="w-full py-2 px-3 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              New chat
            </span>
          </button>
        </div>

        {/* Recents List Header */}
        <div className="mt-4 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Recents
        </div>

        {/* Scrollable Conversation History Items */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="text-[11px] text-slate-500 px-3 py-2 italic">No chats found</div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#212121] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-4">{conv.title}</span>

                  {/* Trash Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity shrink-0"
                    title="Delete Chat Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              SS
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-white">Sahil Singh</span>
              <span className="text-[10px] text-slate-400">Free Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0d0d] relative min-w-0">
        {/* Workspace Top Header Bar */}
        <div className="h-12 px-3 sm:px-4 flex items-center justify-between border-b border-white/5 shrink-0 z-10 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Sidebar Toggle when collapsed or on mobile */}
            {(!isSidebarOpen || isMobile) && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                title={isSidebarOpen ? "Close Sidebar" : "Expand Sidebar"}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Model Selector Dropdown */}
            <div className="relative min-w-0">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl hover:bg-white/10 text-xs sm:text-sm font-semibold text-white transition-colors min-w-0"
              >
                <span className="truncate max-w-[120px] sm:max-w-none">{selectedModel}</span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#212121] border border-white/15 rounded-xl shadow-2xl p-1 z-50 text-xs text-slate-200">
                  {[
                    'Sahil AI Assistant'
                  ].map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setSelectedModel(model);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 font-medium transition-colors flex items-center justify-between ${
                        selectedModel === model ? 'text-white bg-white/10 font-bold' : ''
                      }`}
                    >
                      <span>{model}</span>
                      {selectedModel === model && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadResume}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Download Candidate Resume"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 flex flex-col justify-between min-w-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.md,.txt"
            className="hidden"
          />
          {!hasMessages ? (
            /* EMPTY CHAT SCREEN: "Ask about Sahil" */
            <div className="max-w-2xl mx-auto my-auto w-full flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 window-enter py-4 sm:py-8 px-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Ask about {p.name ? p.name.split(' ')[0] : 'Candidate'}
              </h1>

              {/* Recruiter / Candidate Quick Questions Grid */}
              <div className="w-full pt-2 sm:pt-4">
                <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 sm:mb-3 flex items-center justify-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Suggested Candidate Profile Questions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {sampleSuggestedQuestions.slice(0, 4).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className="p-2.5 sm:p-3 rounded-xl bg-[#171717] hover:bg-white/10 border border-white/10 transition-all text-xs text-slate-300 font-medium leading-relaxed flex items-center justify-between group"
                    >
                      <span className="pr-2 text-[11px] sm:text-xs">{q}</span>
                      <ArrowUp className="w-3.5 h-3.5 text-cyan-400 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

               {/* Centered Capsule Input Box */}
              <div className="w-full">
                <form
                  onSubmit={handleFormSubmit}
                  className="bg-[#212121] border border-white/10 focus-within:border-white/25 focus-within:ring-1 focus-within:ring-white/20 rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all flex flex-col gap-2"
                >
                  {attachedFile && (
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#2a2a2a] border border-white/10 rounded-xl text-xs text-slate-200">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate font-medium">{attachedFile.name}</span>
                        <span className="text-[10px] text-slate-400">({Math.round(attachedFile.size / 1024)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isThinking}
                    placeholder="Ask Anything..."
                    className="w-full bg-transparent border-0 focus:outline-none text-xs sm:text-sm text-white placeholder-slate-400 resize-none px-2 sm:px-3 py-1.5 max-h-32"
                  />

                  {/* Input Capsule Bottom Bar */}
                  <div className="flex items-center justify-end px-1 sm:px-2 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={(!inputText.trim() && !attachedFile) || isThinking}
                        className={`p-1.5 sm:p-2 rounded-full transition-all ${
                          (inputText.trim() || attachedFile) && !isThinking
                            ? 'bg-white text-black hover:bg-slate-200 shadow-md'
                            : 'bg-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                        title="Send Message"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* ACTIVE CONVERSATION MESSAGES THREAD */
            <div className="max-w-3xl mx-auto w-full space-y-6 pb-20">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLast = index === messages.length - 1;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 md:gap-4 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    } window-enter`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                        isUser
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                          : 'bg-white text-black'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#212121] text-white rounded-tr-none border border-white/10'
                            : 'bg-[#171717] text-slate-100 rounded-tl-none border border-white/10'
                        }`}
                      >
                        {/* Meta */}
                        <div className="flex items-center justify-between gap-3 text-[10px] mb-2 text-slate-400 border-b border-white/5 pb-1">
                          <span className="font-semibold">{isUser ? 'You' : 'Sahil AI'}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {msg.timestamp}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="markdown-body">
                          {renderFormattedMessage(msg.content)}
                          {msg.isStreaming && <span className="typing-cursor" />}
                        </div>
                      </div>

                      {/* Response Actions */}
                      {!isUser && (
                        <div className="flex items-center gap-3 mt-1.5 px-1 text-xs text-slate-400">
                          <button
                            onClick={() => onCopyMessage(msg.content)}
                            className="p-1 hover:text-white rounded flex items-center gap-1 transition-colors"
                            title="Copy Response"
                          >
                            {copiedId === msg.content ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>

                          {isLast && (
                            <button
                              onClick={onRegenerateLastMessage}
                              className="p-1 hover:text-white rounded flex items-center gap-1 transition-colors"
                              title="Regenerate Response"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Regenerate</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex gap-3 items-center window-enter">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-[#171717] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping delay-150"></span>
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping delay-300"></span>
                    </div>
                    <span>Sahil AI is generating response...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

          {/* ANCHORED BOTTOM INPUT BAR FOR ACTIVE THREADS */}
          {hasMessages && (
            <div className="sticky bottom-0 bg-[#0d0d0d] pt-2 pb-1 max-w-3xl mx-auto w-full z-20">
              <form
                onSubmit={handleFormSubmit}
                className="bg-[#212121] border border-white/10 focus-within:border-white/25 rounded-2xl p-2.5 shadow-2xl transition-all flex flex-col gap-2"
              >
                {attachedFile && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#2a2a2a] border border-white/10 rounded-xl text-xs text-slate-200">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate font-medium">{attachedFile.name}</span>
                      <span className="text-[10px] text-slate-400">({Math.round(attachedFile.size / 1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isThinking}
                    placeholder="Ask Anything..."
                    className="w-full bg-transparent border-0 focus:outline-none text-xs md:text-sm text-white placeholder-slate-400 resize-none px-2 py-1.5 max-h-32"
                  />

                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !attachedFile) || isThinking}
                    className={`p-2 rounded-full transition-all shrink-0 ${
                      (inputText.trim() || attachedFile) && !isThinking
                        ? 'bg-white text-black hover:bg-slate-200 shadow-md'
                        : 'bg-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                    title="Send Message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* Formatted Message Markdown helper */
  function renderFormattedMessage(text: string) {
    if (!text) return null;

    // Sanitize any raw <br>, <br/>, <br />, </br> tags into line breaks
    const cleanText = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/br>/gi, '');

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(cleanText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: cleanText.substring(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cleanText.length) {
      parts.push({ type: 'text', content: cleanText.substring(lastIndex) });
    }

    return (
      <div className="space-y-2">
        {parts.map((part, idx) => {
          if (part.type === 'code') {
            return (
              <div key={idx} className="my-3 rounded-xl border border-white/10 bg-[#000000] overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#171717] border-b border-white/10 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono text-cyan-400">
                    <Terminal className="w-3.5 h-3.5" />
                    {part.language}
                  </span>
                  <button
                    onClick={() => onCopyMessage(part.code)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Code
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {part.code}
                </pre>
              </div>
            );
          }

          const paragraphs = part.content.split('\n\n');
          return (
            <div key={idx} className="space-y-2">
              {paragraphs.map((para, pIdx) => {
                const lines = para.split('\n');
                return (
                  <p key={pIdx} className="leading-relaxed">
                    {lines.map((line, lIdx) => {
                      const trimmed = line.trim();

                      // Skip markdown table divider header lines like |---|---|
                      if (/^\|[\s\-:]*(\|[\s\-:]*)+\|?$/.test(trimmed)) {
                        return null;
                      }

                      // Cleanly format markdown table rows like | Category | Details |
                      if (trimmed.startsWith('|') && trimmed.includes('|')) {
                        const tableCells = trimmed
                          .replace(/^\||\|$/g, '')
                          .split('|')
                          .map((c) => c.trim())
                          .filter(Boolean);
                        if (tableCells.length > 0) {
                          const formattedTableRow = tableCells.length >= 2
                            ? `**${tableCells[0]}**: ${tableCells.slice(1).join(' — ')}`
                            : tableCells[0];
                          return (
                            <span key={lIdx} className="block my-1.5 p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                              {renderInlineBoldAndLinks(formattedTableRow)}
                            </span>
                          );
                        }
                      }

                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
                        const bulletText = trimmed.replace(/^[-*•]\s*/, '');
                        return (
                          <span key={lIdx} className="block pl-3 border-l-2 border-cyan-500/50 my-1">
                            • {renderInlineBoldAndLinks(bulletText)}
                          </span>
                        );
                      }

                      return (
                        <React.Fragment key={lIdx}>
                          {renderInlineBoldAndLinks(line)}
                          {lIdx < lines.length - 1 && <br />}
                        </React.Fragment>
                      );
                    })}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderInlineBoldAndLinks(str: string) {
    if (!str) return null;
    const cleanStr = str.replace(/<br\s*\/?>/gi, '').replace(/<\/br>/gi, '');
    const parts = cleanStr.split(/(\*\*.*?\*\*)/g);
    return parts.map((chunk, i) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{chunk.slice(2, -2)}</strong>;
      }
      return chunk;
    });
  }
};
