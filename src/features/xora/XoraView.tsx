import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  Square,
  Search,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Archive,
  Menu,
  X,
  Share2,
  Globe,
  Loader2,
  AlertTriangle,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  XoraChat,
  XoraMessage,
  XoraMemory,
  XoraUserSettings,
  XoraAction,
  XoraProviderStatus,
} from '../../types/xora';
import {
  getUserChats,
  createChat,
  renameChat,
  archiveChat,
  deleteChat,
  getChatMessages,
  saveChatMessage,
  updateMessageFeedback,
  getUserMemories,
  getUserXoraSettings,
  streamXoraChat,
  fetchXoraProviderStatus,
  extractMemoriesAfterTurn,
  saveUserMemory,
} from '../../services/xoraService';
import { XoraMarkdownRenderer } from './XoraMarkdownRenderer';
import { XoraActionButtons } from './XoraActionButtons';
import { XoraMemoryModal } from './XoraMemoryModal';

interface XoraViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuth: () => void;
}

const CONTEXTUAL_SUGGESTIONS = [
  {
    title: 'Exchange Coins & Diamonds',
    prompt: 'How do I exchange Coins to Diamonds and what is the platform fee?',
    category: 'Exchange',
  },
  {
    title: 'Mobile Money Top-Up',
    prompt: 'How do I top up my wallet using M-Pesa or Airtel Money?',
    category: 'Top-Up',
  },
  {
    title: 'Aviator 2-Bet Panels',
    prompt: 'Explain how the Aviator game works with 2 bet panels and back crash trends.',
    category: 'Casino',
  },
  {
    title: 'Downloads & Library',
    prompt: 'Where can I access my downloaded mods, tools, and license keys?',
    category: 'Marketplace',
  },
  {
    title: 'Welcome Bonus & Rewards',
    prompt: 'How do I claim my 1,000 Coins and 1 Diamond welcome registration bonus?',
    category: 'Rewards',
  },
  {
    title: 'Msaada kwa Kiswahili',
    prompt: 'Habari Xora, naomba unieleze jinsi ya kununua sarafu na kuzibadilisha kuwa almasi.',
    category: 'Swahili',
  },
];

export const XoraView: React.FC<XoraViewProps> = ({ onNavigateTab, onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();

  // Sidebar and UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Provider status
  const [providerStatus, setProviderStatus] = useState<XoraProviderStatus | null>(null);

  // Chat & Messages states
  const [chats, setChats] = useState<XoraChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<XoraMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Memory & Personalization states
  const [memories, setMemories] = useState<XoraMemory[]>([]);
  const [settings, setSettings] = useState<XoraUserSettings>({
    userId: currentUser?.uid || 'guest',
    memoryEnabled: true,
    updatedAt: new Date().toISOString(),
  });

  // Rename modal / inline edit
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Abort controller ref for stop generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Check Provider Status on mount
  useEffect(() => {
    fetchXoraProviderStatus().then((status) => {
      setProviderStatus(status);
    });
  }, []);

  // Load User Chats & Settings
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
      return;
    }

    const loadUserData = async () => {
      try {
        const [loadedChats, loadedMemories, loadedSettings] = await Promise.all([
          getUserChats(currentUser.uid),
          getUserMemories(currentUser.uid),
          getUserXoraSettings(currentUser.uid),
        ]);

        setChats(loadedChats);
        setMemories(loadedMemories);
        setSettings(loadedSettings);

        if (loadedChats.length > 0 && !activeChatId) {
          setActiveChatId(loadedChats[0].id);
        }
      } catch (e) {
        console.error('Error loading Xora user data:', e);
      }
    };

    loadUserData();
  }, [currentUser]);

  // Load Messages when activeChatId changes
  useEffect(() => {
    if (!currentUser || !activeChatId) {
      if (!currentUser) setMessages([]);
      return;
    }

    getChatMessages(currentUser.uid, activeChatId).then((loadedMsgs) => {
      // Deduplicate messages by id
      const seen = new Set<string>();
      const unique = loadedMsgs.filter((m) => {
        if (!m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setMessages(unique);
    });
  }, [currentUser, activeChatId]);

  // Create New Chat
  const handleCreateNewChat = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    try {
      const newChat = await createChat(currentUser.uid, 'New Conversation');
      setChats((prev) => (prev.some((c) => c.id === newChat.id) ? prev : [newChat, ...prev]));
      setActiveChatId(newChat.id);
      setMessages([]);
      setSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      showToast('Failed to start new chat', 'error');
    }
  };

  // Delete Chat
  const handleDeleteChat = async (chatId: string) => {
    if (!currentUser) return;
    try {
      await deleteChat(currentUser.uid, chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c.id !== chatId);
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]);
      }
      showToast('Conversation deleted', 'info');
    } catch {
      showToast('Failed to delete chat', 'error');
    }
  };

  // Rename Chat
  const handleSaveRename = async (chatId: string) => {
    if (!currentUser || !renameValue.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      await renameChat(currentUser.uid, chatId, renameValue);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: renameValue.trim() } : c))
      );
      setEditingChatId(null);
      showToast('Conversation renamed', 'success');
    } catch {
      showToast('Failed to rename chat', 'error');
    }
  };

  // Send Message & Stream Response
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend || inputPrompt).trim();
    if (!rawText || isStreaming) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    let currentChatId = activeChatId;
    if (!currentChatId) {
      // Auto-create chat if none selected
      const firstTitle = rawText.slice(0, 35) + (rawText.length > 35 ? '...' : '');
      const created = await createChat(currentUser.uid, firstTitle);
      setChats((prev) => (prev.some((c) => c.id === created.id) ? prev : [created, ...prev]));
      setActiveChatId(created.id);
      currentChatId = created.id;
    }

    // Save user message
    const userMsgPayload: Omit<XoraMessage, 'id'> = {
      chatId: currentChatId,
      userId: currentUser.uid,
      role: 'user',
      content: rawText,
      createdAt: new Date().toISOString(),
      status: 'complete',
    };

    setInputPrompt('');
    const savedUserMsg = await saveChatMessage(currentUser.uid, currentChatId, userMsgPayload);
    setMessages((prev) => (prev.some((m) => m.id === savedUserMsg.id) ? prev : [...prev, savedUserMsg]));

    // Update chat title if it's the first message
    if (messages.length === 0) {
      const summaryTitle = rawText.slice(0, 32) + (rawText.length > 32 ? '...' : '');
      renameChat(currentUser.uid, currentChatId, summaryTitle);
      setChats((prev) =>
        prev.map((c) => (c.id === currentChatId ? { ...c, title: summaryTitle } : c))
      );
    }

    // Prepare for streaming
    setIsStreaming(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    const conversationHistory = [...messages, savedUserMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const memoryStrings = settings.memoryEnabled ? memories.map((m) => m.text) : [];

    await streamXoraChat({
      messages: conversationHistory,
      currentRoute: window.location.pathname,
      language,
      memories: memoryStrings,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      onDone: async (result) => {
        setIsStreaming(false);
        setStreamingContent('');

        const finalContent = result.fullContent || streamingContent;
        if (!finalContent) return;

        // Save assistant message to Firestore
        const assistantMsgPayload: Omit<XoraMessage, 'id'> = {
          chatId: currentChatId!,
          userId: currentUser.uid,
          role: 'assistant',
          content: finalContent,
          actions: result.actions,
          createdAt: new Date().toISOString(),
          status: 'complete',
          model: providerStatus?.model || 'openai/gpt-oss-120b',
        };

        const savedAssistantMsg = await saveChatMessage(
          currentUser.uid,
          currentChatId!,
          assistantMsgPayload
        );
        setMessages((prev) =>
          prev.some((m) => m.id === savedAssistantMsg.id) ? prev : [...prev, savedAssistantMsg]
        );

        // Background automatic memory extraction (if memory is enabled)
        if (settings.memoryEnabled) {
          extractMemoriesAfterTurn(rawText, finalContent).then(async (newMems) => {
            for (const mem of newMems) {
              // Avoid duplicates
              if (!memories.some((m) => m.text.toLowerCase() === mem.text.toLowerCase())) {
                const saved = await saveUserMemory(currentUser.uid, mem.text, mem.category, currentChatId);
                setMemories((prev) => [...prev, saved]);
              }
            }
          });
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingContent('');
        showToast(err.message || 'Error communicating with Xora AI', 'error');

        // Append error message
        const errPayload: Omit<XoraMessage, 'id'> = {
          chatId: currentChatId!,
          userId: currentUser.uid,
          role: 'assistant',
          content: `⚠️ ${err.message || 'An error occurred while generating a response. Please verify your connection and try again.'}`,
          createdAt: new Date().toISOString(),
          status: 'error',
        };
        saveChatMessage(currentUser.uid, currentChatId!, errPayload).then((saved) => {
          setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
        });
      },
    });
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      showToast('Generation stopped', 'info');
    }
  };

  // Copy Full Response
  const handleCopyResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied response to clipboard', 'success');
  };

  // Filtered Chats by search
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl bg-[#0e1019] border border-white/10 shadow-2xl overflow-hidden relative">
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR: SAVED CONVERSATIONS & SEARCH */}
      {/* ============================================================ */}
      <aside
        className={`absolute md:relative z-30 inset-y-0 left-0 w-72 bg-[#121522] border-r border-white/10 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono font-black text-xs text-zinc-100 tracking-wider block">
                CONVERSATIONS
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {chats.length} Saved Chats
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleCreateNewChat}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search Conversations Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 font-mono"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {filteredChats.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs font-mono">
              {searchQuery ? 'No matching chats found.' : 'No conversations yet.'}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              const isEditing = editingChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group relative rounded-xl transition-all duration-150 flex items-center justify-between p-2 cursor-pointer border ${
                    isActive
                      ? 'bg-violet-600/15 border-violet-500/40 text-white'
                      : 'border-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveChatId(chat.id);
                      setSidebarOpen(false);
                    }
                  }}
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1.5 mr-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="flex-1 px-2 py-0.5 rounded bg-black/70 border border-violet-500 text-xs text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(chat.id);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(chat.id)}
                        className="p-1 rounded bg-emerald-600 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="text-xs font-bold truncate block">
                        {chat.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {chat.updatedAt ? chat.updatedAt.slice(0, 10) : 'Active'}
                      </span>
                    </div>
                  )}

                  {/* Actions for each chat */}
                  {!isEditing && (
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingChatId(chat.id);
                          setRenameValue(chat.title);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteChat(chat.id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Memory & Personalization Settings */}
        <div className="p-3 border-t border-white/10 bg-[#0f111a]">
          <button
            onClick={() => setMemoryModalOpen(true)}
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-black/40 hover:bg-black/60 border border-violet-500/20 hover:border-violet-500/40 text-xs font-bold text-violet-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" />
              <span>Memory & Personalization</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono">
              {settings.memoryEnabled ? `${memories.length} Facts` : 'OFF'}
            </span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CHAT AREA */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col bg-[#0b0d14] relative overflow-hidden">
        {/* Top Chat Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#121520]/80 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 text-zinc-300 hover:text-white"
              title="Open Conversations"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-950/60">
              <div className="w-full h-full bg-[#0d0f17] rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black font-mono tracking-tight text-white flex items-center gap-1.5">
                  <span>XORA AI</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans hidden sm:block">
                Your intelligent digital companion • Powered by Groq Ultra-Fast Inference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Memory status pill */}
            <button
              onClick={() => setMemoryModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 hover:border-violet-500/40 text-[11px] text-zinc-300 font-mono cursor-pointer transition-colors"
              title="Configure Personal Memories"
            >
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span>{settings.memoryEnabled ? 'Memory: Active' : 'Memory: Off'}</span>
            </button>

            {/* Clear / New Chat button */}
            <button
              onClick={handleCreateNewChat}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-none">
          {messages.length === 0 && !isStreaming ? (
            /* Empty State with Rich Prompt Suggestions */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-6 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] mx-auto shadow-2xl shadow-violet-900/40">
                <div className="w-full h-full bg-[#10121d] rounded-[23px] flex items-center justify-center">
                  <Bot className="w-8 h-8 text-cyan-300" />
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
                  Welcome to Xora AI
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  I can assist you with buying products, top-ups with mobile money, currency exchange, casino strategies, and navigating NEXORA.
                </p>
              </div>

              {/* Contextual Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                {CONTEXTUAL_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3 rounded-2xl bg-[#141724]/90 hover:bg-[#1b2034] border border-white/5 hover:border-violet-500/40 text-left transition-all duration-200 group cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider block mb-1">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-white block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Rendered Messages */
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={`${msg.id || 'msg'}-${index}`}
                  className={`flex gap-3 max-w-3xl ${
                    isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow mt-1">
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-3xl p-4 sm:p-5 max-w-[88%] sm:max-w-[85%] space-y-2 shadow-lg transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm'
                        : 'bg-[#141724] border border-white/10 text-zinc-200 rounded-bl-sm'
                    }`}
                  >
                    {/* Header with Role & Time */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-1 border-b border-white/5">
                      <span className="font-bold uppercase tracking-wider">
                        {isUser ? 'You' : 'Xora AI'}
                      </span>
                      <span>{msg.createdAt ? msg.createdAt.slice(11, 16) : ''}</span>
                    </div>

                    {/* Markdown Content */}
                    <div className="leading-relaxed">
                      {isUser ? (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <XoraMarkdownRenderer
                          content={msg.content}
                          onNavigateInternal={onNavigateTab}
                        />
                      )}
                    </div>

                    {/* Fast Action Buttons if provided */}
                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <XoraActionButtons
                        actions={msg.actions}
                        onNavigateInternal={onNavigateTab}
                      />
                    )}

                    {/* Assistant Message Actions: Copy, Feedback */}
                    {!isUser && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-zinc-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyResponse(msg.content)}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                            title="Copy Response"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {/* Thumbs Feedback */}
                        {currentUser && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                updateMessageFeedback(currentUser.uid, activeChatId!, msg.id, 'helpful');
                                showToast('Thank you for the feedback!', 'success');
                              }}
                              className={`p-1 rounded hover:text-emerald-400 ${
                                msg.feedback === 'helpful' ? 'text-emerald-400' : ''
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                updateMessageFeedback(currentUser.uid, activeChatId!, msg.id, 'unhelpful');
                                showToast('Feedback recorded for quality improvement.', 'info');
                              }}
                              className={`p-1 rounded hover:text-rose-400 ${
                                msg.feedback === 'unhelpful' ? 'text-rose-400' : ''
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                      <User className="w-4 h-4 text-zinc-300" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Active Streaming Response Bubble */}
          {isStreaming && (
            <div className="flex gap-3 max-w-3xl mr-auto justify-start animate-in fade-in">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow mt-1">
                <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
              </div>
              <div className="rounded-3xl p-4 sm:p-5 max-w-[88%] sm:max-w-[85%] bg-[#141724] border border-violet-500/40 text-zinc-200 rounded-bl-sm space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 pb-1 border-b border-white/5">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Xora AI is thinking & generating...</span>
                  </span>
                </div>
                <div className="leading-relaxed text-xs sm:text-sm">
                  <XoraMarkdownRenderer
                    content={streamingContent}
                    onNavigateInternal={onNavigateTab}
                  />
                  <span className="inline-block w-2 h-4 bg-violet-400 ml-1 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Controls */}
        <div className="p-3 sm:p-4 bg-[#121520] border-t border-white/10">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Stop Generation Button when streaming */}
            {isStreaming && (
              <div className="flex justify-center">
                <button
                  onClick={handleStopGeneration}
                  className="px-4 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Generating</span>
                </button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end rounded-2xl bg-black/60 border border-white/10 focus-within:border-violet-500/60 p-2 shadow-inner transition-all"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  currentUser
                    ? 'Message Xora AI (English or Swahili)...'
                    : 'Sign in to chat with Xora AI...'
                }
                disabled={isStreaming}
                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none max-h-36 min-h-[38px] p-2 leading-relaxed"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md disabled:opacity-40 transition-all active:scale-95 cursor-pointer ml-1"
                title="Send Message"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Footer Disclaimer */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
              <span>Xora AI provides platform guidance and verified marketplace information.</span>
              <span>Groq 120B • High-Speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Modal */}
      {currentUser && (
        <XoraMemoryModal
          isOpen={memoryModalOpen}
          onClose={() => setMemoryModalOpen(false)}
          userId={currentUser.uid}
          memories={memories}
          settings={settings}
          onRefreshMemories={() => {
            getUserMemories(currentUser.uid).then(setMemories);
          }}
          onRefreshSettings={() => {
            getUserXoraSettings(currentUser.uid).then(setSettings);
          }}
          onChatsCleared={() => {
            setChats([]);
            setActiveChatId(null);
            setMessages([]);
          }}
        />
      )}
    </div>
  );
};
