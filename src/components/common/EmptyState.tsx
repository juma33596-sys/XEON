import React from 'react';
import { PackageOpen, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl bg-[#141721]/60 border border-white/5 my-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-violet-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7 opacity-80" />
      </div>
      <h3 className="text-base font-bold text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs md:text-sm text-zinc-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-900/30 transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
