import React from 'react';
import { Sparkles, Bot, MessageSquare } from 'lucide-react';

interface XoraFloatingButtonProps {
  currentTab: string;
  onOpenXora: () => void;
}

export const XoraFloatingButton: React.FC<XoraFloatingButtonProps> = ({
  currentTab,
  onOpenXora,
}) => {
  // Hide if already on Xora AI tab
  if (currentTab === 'xora') return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onOpenXora}
        type="button"
        className="group relative flex items-center gap-2 p-2.5 sm:px-4 sm:py-3 rounded-2xl sm:rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-2xl shadow-violet-950/80 hover:shadow-violet-900/90 transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
        title="Open Xora AI Assistant"
      >
        {/* Glowing Pulsing Ring */}
        <span className="absolute -inset-0.5 rounded-2xl sm:rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 opacity-40 group-hover:opacity-80 blur transition-opacity animate-pulse" />

        <div className="relative flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="hidden sm:inline font-mono tracking-tight font-extrabold text-[13px]">
            XORA AI
          </span>
          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-violet-200 border border-white/10 font-mono">
            Assistant
          </span>
        </div>
      </button>
    </div>
  );
};
