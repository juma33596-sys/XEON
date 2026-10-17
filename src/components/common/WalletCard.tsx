import React from 'react';
import { Coins, Gem, PlusCircle, ArrowLeftRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface WalletCardProps {
  onTopUpClick?: () => void;
  onExchangeClick?: () => void;
  compact?: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  onTopUpClick,
  onExchangeClick,
  compact = false,
}) => {
  const { wallet, loading } = useWallet();

  const coins = wallet?.coins ?? 0;
  const diamonds = wallet?.diamonds ?? 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141721] border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold font-mono">
            {loading ? '...' : coins.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
          <Gem className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold font-mono">
            {loading ? '...' : diamonds}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161a26] via-[#12151f] to-[#0d0f17] border border-white/10 p-5 shadow-2xl">
      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Nexora Vault
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active & Synced</span>
          </div>
        </div>

        {/* Dual Balances Display */}
        <div className="grid grid-cols-2 gap-3">
          {/* Coins Column */}
          <div className="p-3.5 rounded-xl bg-[#0e1017] border border-amber-500/20 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <Coins className="w-4 h-4" />
              <span>Coins</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-zinc-100 font-mono tracking-tight">
              {loading ? (
                <div className="w-16 h-6 bg-zinc-800 animate-pulse rounded" />
              ) : (
                coins.toLocaleString()
              )}
            </div>
            <span className="text-[10px] text-zinc-500">Standard Marketplace Currency</span>
          </div>

          {/* Diamonds Column */}
          <div className="p-3.5 rounded-xl bg-[#0e1017] border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <Gem className="w-4 h-4" />
              <span>Diamonds</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-zinc-100 font-mono tracking-tight">
              {loading ? (
                <div className="w-12 h-6 bg-zinc-800 animate-pulse rounded" />
              ) : (
                diamonds.toLocaleString()
              )}
            </div>
            <span className="text-[10px] text-zinc-500">Rare Rarity Premium Crystal</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={onTopUpClick}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-900/30 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up</span>
          </button>
          <button
            onClick={onExchangeClick}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeftRight className="w-4 h-4 text-violet-400" />
            <span>Exchange</span>
          </button>
        </div>
      </div>
    </div>
  );
};
