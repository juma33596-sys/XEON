import React from 'react';
import { Coins, Gem, Sparkles, ArrowRight } from 'lucide-react';
import { Pack } from '../../types';

interface PackCardProps {
  pack: Pack;
  isSelected?: boolean;
  onSelect?: (pack: Pack) => void;
  onPurchase?: (pack: Pack) => void;
}

export const PackCard: React.FC<PackCardProps> = ({
  pack,
  isSelected = false,
  onSelect,
  onPurchase,
}) => {
  const isCoins = pack.currency === 'coins';

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurchase) {
      onPurchase(pack);
    } else if (onSelect) {
      onSelect(pack);
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(pack)}
      className={`group relative flex flex-col justify-between p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 border overflow-hidden ${
        isSelected
          ? 'bg-violet-950/40 border-violet-500 shadow-lg shadow-violet-900/30 ring-2 ring-violet-500/30'
          : 'bg-[#141721] border-white/10 hover:border-violet-500/50 hover:bg-[#181d2a] hover:shadow-lg hover:shadow-violet-950/20'
      }`}
    >
      {/* Popular / Custom Badge */}
      {(pack.popular || pack.badge) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black tracking-wider uppercase shadow-sm">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          <span>{pack.badge || 'Popular'}</span>
        </div>
      )}

      <div>
        {/* Header Icon + Currency */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner ${
              isCoins
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
            }`}
          >
            {isCoins ? <Coins className="w-4 h-4" /> : <Gem className="w-4 h-4" />}
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
            {pack.currency}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-1 mb-1">
          {pack.title}
        </h4>

        {/* Reward Amount */}
        <div className="flex items-baseline gap-1 mb-1.5">
          <span
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              isCoins ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {pack.amount.toLocaleString()}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase text-zinc-400">
            {isCoins ? 'Coins' : 'Diamonds'}
          </span>
        </div>

        {/* Short Description */}
        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug mb-3">
          {pack.description}
        </p>
      </div>

      {/* Footer Price & Action */}
      <div className="pt-2 border-t border-white/10 space-y-2 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-zinc-400">Price:</span>
          <span className="text-xs sm:text-sm font-black font-mono text-zinc-100">
            TSh {pack.tshPrice.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAction}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-violet-900/30 transition-all active:scale-95 cursor-pointer"
        >
          <span>Top Up</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
