import React, { useState } from 'react';
import {
  TrendingUp,
  X,
  ShieldCheck,
  BarChart2,
  Flame,
  ArrowUpRight,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface CrashHistoryItem {
  id: string;
  roundNumber: number;
  multiplier: number;
  timestamp: string;
  seedHash: string;
}

interface CrashTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CrashHistoryItem[];
}

export function getMultiplierBadgeStyle(mult: number) {
  if (mult >= 50) {
    return 'bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-violet-500/25 text-amber-200 border-amber-400/50 shadow-md shadow-amber-900/30';
  }
  if (mult >= 10) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }
  if (mult >= 2) {
    return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
  }
  return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
}

export const CrashTrendModal: React.FC<CrashTrendModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'low'>('all');

  if (!isOpen) return null;

  // Filtered rounds
  const displayedHistory = history.filter((item) => {
    if (filterMode === 'high') return item.multiplier >= 2.0;
    if (filterMode === 'low') return item.multiplier < 2.0;
    return true;
  });

  // Calculate statistics
  const totalRounds = history.length;
  const under2xCount = history.filter((h) => h.multiplier < 2.0).length;
  const between2and10Count = history.filter((h) => h.multiplier >= 2.0 && h.multiplier < 10.0).length;
  const over10xCount = history.filter((h) => h.multiplier >= 10.0).length;

  const under2xPct = totalRounds > 0 ? ((under2xCount / totalRounds) * 100).toFixed(0) : '0';
  const between2and10Pct = totalRounds > 0 ? ((between2and10Count / totalRounds) * 100).toFixed(0) : '0';
  const over10xPct = totalRounds > 0 ? ((over10xCount / totalRounds) * 100).toFixed(0) : '0';

  const maxCrash = history.reduce((max, h) => Math.max(max, h.multiplier), 1.0);
  const avgCrash = totalRounds > 0
    ? (history.reduce((sum, h) => sum + h.multiplier, 0) / totalRounds).toFixed(2)
    : '1.00';

  // Last 30 crashes for the visual trend bar chart
  const recent30 = [...history].slice(0, 30).reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#121522] border border-violet-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#161a2b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
                <span>Aviator Back Crashes Trend</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {totalRounds} Rounds
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Crash history analysis, volatility distribution & provably fair seeds
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

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          {/* Key Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-black/40 border border-blue-500/20">
              <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">
                &lt; 2.00x (Low)
              </span>
              <div className="text-lg font-black font-mono text-zinc-100 mt-0.5">
                {under2xPct}%
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {under2xCount} rounds
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-violet-500/20">
              <span className="text-[10px] font-mono uppercase text-violet-400 font-bold block">
                2.00x - 9.99x
              </span>
              <div className="text-lg font-black font-mono text-zinc-100 mt-0.5">
                {between2and10Pct}%
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {between2and10Count} rounds
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-rose-500/20">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                &gt; 10.00x (Rocket)
              </span>
              <div className="text-lg font-black font-mono text-zinc-100 mt-0.5">
                {over10xPct}%
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {over10xCount} rounds
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                Highest Crash
              </span>
              <div className="text-lg font-black font-mono text-amber-300 mt-0.5">
                {maxCrash.toFixed(2)}x
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Avg: {avgCrash}x
              </span>
            </div>
          </div>

          {/* Visual Trend Bar Visualization */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5 font-bold">
                <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                <span>Visual Crash Sequence (Last 30 Flights)</span>
              </span>
              <span className="text-[10px] text-zinc-500">Older → Newer</span>
            </div>

            {/* Horizontal Mini Bar Chart */}
            <div className="h-20 flex items-end gap-1 px-1 pt-2 pb-1 overflow-x-auto bg-black/30 rounded-xl border border-white/5">
              {recent30.map((item, idx) => {
                // Scaled height up to 100%
                const barHeight = Math.min(100, Math.max(12, (Math.log10(item.multiplier) / Math.log10(50)) * 100));
                const isHigh = item.multiplier >= 10;
                const isMedium = item.multiplier >= 2 && item.multiplier < 10;

                return (
                  <div
                    key={item.id || idx}
                    className="flex-1 min-w-[10px] sm:min-w-[14px] flex flex-col items-center justify-end group relative"
                  >
                    <div
                      style={{ height: `${barHeight}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isHigh
                          ? 'bg-rose-500 hover:bg-rose-400'
                          : isMedium
                          ? 'bg-violet-500 hover:bg-violet-400'
                          : 'bg-blue-500/80 hover:bg-blue-400'
                      }`}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <span className="bg-[#1e1b4b] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow border border-violet-500/50 whitespace-nowrap">
                        {item.multiplier.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter options */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Crashes ({history.length})
              </button>
              <button
                onClick={() => setFilterMode('high')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'high'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                &ge; 2.0x ({between2and10Count + over10xCount})
              </button>
              <button
                onClick={() => setFilterMode('low')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'low'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                &lt; 2.0x ({under2xCount})
              </button>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 hidden sm:block">
              Provably Fair Verified
            </div>
          </div>

          {/* Detailed History Table */}
          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-0.5">
            {displayedHistory.map((item) => {
              const badgeStyle = getMultiplierBadgeStyle(item.multiplier);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold">#{item.roundNumber}</span>
                    <span className="text-[11px] text-zinc-400">{item.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 truncate max-w-[100px] hidden sm:inline" title={item.seedHash}>
                      {item.seedHash}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-black border text-xs ${badgeStyle}`}>
                      {item.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-[#10131f] border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>SHA-256 Mathematical Provably Fair Audit Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
