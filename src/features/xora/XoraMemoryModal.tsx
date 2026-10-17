import React, { useState } from 'react';
import {
  Brain,
  X,
  Trash2,
  Edit2,
  Plus,
  Check,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { XoraMemory, XoraUserSettings } from '../../types/xora';
import {
  saveUserMemory,
  updateUserMemory,
  deleteUserMemory,
  clearAllUserMemories,
  saveUserXoraSettings,
  clearAllUserChats,
} from '../../services/xoraService';
import { useToast } from '../../context/ToastContext';

interface XoraMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  memories: XoraMemory[];
  settings: XoraUserSettings;
  onRefreshMemories: () => void;
  onRefreshSettings: () => void;
  onChatsCleared?: () => void;
}

export const XoraMemoryModal: React.FC<XoraMemoryModalProps> = ({
  isOpen,
  onClose,
  userId,
  memories,
  settings,
  onRefreshMemories,
  onRefreshSettings,
  onChatsCleared,
}) => {
  const { showToast } = useToast();
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<XoraMemory['category']>('preference');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showChatClearConfirm, setShowChatClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleToggleMemory = async () => {
    const nextState = !settings.memoryEnabled;
    try {
      await saveUserXoraSettings(userId, { memoryEnabled: nextState });
      onRefreshSettings();
      showToast(
        nextState ? 'Xora Memory Enabled' : 'Xora Memory Disabled. No new memories will be saved.',
        'info'
      );
    } catch {
      showToast('Failed to update memory setting', 'error');
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    try {
      await saveUserMemory(userId, newMemoryText, newMemoryCategory);
      setNewMemoryText('');
      onRefreshMemories();
      showToast('Memory added successfully', 'success');
    } catch {
      showToast('Failed to save memory', 'error');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await updateUserMemory(userId, id, editText);
      setEditingId(null);
      setEditText('');
      onRefreshMemories();
      showToast('Memory updated', 'success');
    } catch {
      showToast('Failed to update memory', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUserMemory(userId, id);
      onRefreshMemories();
      showToast('Memory deleted', 'info');
    } catch {
      showToast('Failed to delete memory', 'error');
    }
  };

  const handleClearAllMemories = async () => {
    try {
      await clearAllUserMemories(userId);
      setShowClearConfirm(false);
      onRefreshMemories();
      showToast('All Xora AI memories cleared', 'info');
    } catch {
      showToast('Failed to clear memories', 'error');
    }
  };

  const handleClearChats = async () => {
    try {
      await clearAllUserChats(userId);
      setShowChatClearConfirm(false);
      if (onChatsCleared) onChatsCleared();
      showToast('Chat history cleared', 'info');
    } catch {
      showToast('Failed to clear chats', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#121522] border border-violet-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#161a2b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
                <span>Xora AI Memory & Personalization</span>
              </h2>
              <p className="text-xs text-zinc-400">
                User-controlled memory, preferences & conversation continuity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none text-xs">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-zinc-300 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-violet-300 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>How Xora AI Memory Works</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Xora saves concise preferences (such as your preferred language, gaming interests, or active marketplace tools) so you don't have to repeat yourself. Memories are strictly private, isolated to your personal account, never shared with other users, and can be deleted individually or completely at any time.
            </p>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/50 border border-white/10">
            <div>
              <span className="font-bold text-zinc-100 block text-xs">
                Persistent Memory Status
              </span>
              <span className="text-[11px] text-zinc-400">
                {settings.memoryEnabled
                  ? 'Active: Xora retains helpful preferences across sessions.'
                  : 'Disabled: Xora will not remember past context across new chats.'}
              </span>
            </div>

            <button
              onClick={handleToggleMemory}
              type="button"
              className="cursor-pointer"
            >
              {settings.memoryEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-zinc-600" />
              )}
            </button>
          </div>

          {/* Add New Memory Form */}
          {settings.memoryEnabled && (
            <form onSubmit={handleAddMemory} className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2.5">
              <span className="font-bold text-zinc-300 block text-xs">Add a Personal Fact or Preference</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., 'I prefer Swahili responses' or 'I develop tools in Flutter'"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          )}

          {/* Saved Memories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] font-mono">
                Saved Memories ({memories.length})
              </span>
              {memories.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-bold cursor-pointer"
                >
                  Clear All Memories
                </button>
              )}
            </div>

            {showClearConfirm && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-center">
                <p className="text-rose-200 text-xs font-bold">
                  Are you sure you want to delete all saved memories? This action cannot be undone.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleClearAllMemories}
                    className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {memories.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs font-mono">
                No memories saved yet. Talk with Xora AI to start building personalized preferences.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2"
                  >
                    {editingId === mem.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-black/60 border border-violet-500 text-xs text-white"
                        />
                        <button
                          onClick={() => handleUpdate(mem.id)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-zinc-200 text-xs leading-relaxed font-sans">{mem.text}</p>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">
                          {mem.category} • {mem.createdAt.slice(0, 10)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {editingId !== mem.id && (
                        <button
                          onClick={() => {
                            setEditingId(mem.id);
                            setEditText(mem.text);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                          title="Edit Memory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(mem.id)}
                        className="p-1 rounded-lg text-rose-400/70 hover:text-rose-300 cursor-pointer"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Independent Clear Chat History Option */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-zinc-300 block">Clear Chat Conversations</span>
              <span className="text-[11px] text-zinc-500">Deletes message history independently without affecting memories.</span>
            </div>
            <button
              onClick={() => setShowChatClearConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
            >
              Clear History
            </button>
          </div>

          {showChatClearConfirm && (
            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2 text-center">
              <p className="text-zinc-200 text-xs font-bold">
                Delete all previous Xora AI conversation threads?
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleClearChats}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  Yes, Delete All Chats
                </button>
                <button
                  onClick={() => setShowChatClearConfirm(false)}
                  className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#10131f] border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Private User Isolation Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
