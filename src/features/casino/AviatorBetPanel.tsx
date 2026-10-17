import React from 'react';
import { Coins, Check, Zap, ArrowDown, Plus, Minus, ToggleLeft, ToggleRight } from 'lucide-react';

interface AviatorBetPanelProps {
  panelNumber: 1 | 2;
  title: string;
  themeColor: 'violet' | 'cyan';
  amount: string;
  setAmount: (val: string) => void;
  isActive: boolean;
  cashedOut: number | null;
  stage: 'waiting' | 'flying' | 'crashed';
  currentMultiplier: number;
  onPlaceBet: () => void;
  onCancelBet?: () => void;
  onCashout: () => void;
  autoCashoutEnabled: boolean;
  onToggleAutoCashout: () => void;
  autoCashoutMultiplier: string;
  setAutoCashoutMultiplier: (val: string) => void;
  disabled?: boolean;
}

export const AviatorBetPanel: React.FC<AviatorBetPanelProps> = ({
  panelNumber,
  title,
  themeColor,
  amount,
  setAmount,
  isActive,
  cashedOut,
  stage,
  currentMultiplier,
  onPlaceBet,
  onCancelBet,
  onCashout,
  autoCashoutEnabled,
  onToggleAutoCashout,
  autoCashoutMultiplier,
  setAutoCashoutMultiplier,
  disabled,
}) => {
  const parsedAmount = parseInt(amount) || 0;
  const currentPayout = Math.floor(parsedAmount * currentMultiplier);

  const adjustAmount = (delta: number) => {
    const next = Math.max(10, parsedAmount + delta);
    setAmount(String(next));
  };

  const isFlying = stage === 'flying';
  const isCrashed = stage === 'crashed';
  const isWaiting = stage === 'waiting';

  const accentBorder = themeColor === 'violet' ? 'border-violet-500/30' : 'border-cyan-500/30';
  const accentText = themeColor === 'violet' ? 'text-violet-400' : 'text-cyan-400';
  const accentBg = themeColor === 'violet' ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500';

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-[#141722] border transition-all duration-200 shadow-xl flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
        isActive && isFlying && !cashedOut
          ? 'ring-2 ring-amber-400/60 border-amber-500/50'
          : accentBorder
      }`}
    >
      {/* Top Header with Panel Title and Auto Cashout Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs text-white ${
              themeColor === 'violet' ? 'bg-violet-600' : 'bg-cyan-600'
            }`}
          >
            {panelNumber}
          </div>
          <span className={`text-xs font-black uppercase tracking-wider font-mono ${accentText}`}>
            {title}
          </span>
        </div>

        {/* Auto Cashout Switch */}
        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl border border-white/5">
          <span className="text-[10px] font-mono text-zinc-400">Auto Cashout:</span>
          <button
            type="button"
            onClick={onToggleAutoCashout}
            disabled={isActive && isFlying}
            className="flex items-center text-xs cursor-pointer disabled:opacity-50"
            title="Toggle Auto Cashout"
          >
            {autoCashoutEnabled ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                ON <ToggleRight className="w-4 h-4 text-emerald-400 inline" />
              </span>
            ) : (
              <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                OFF <ToggleLeft className="w-4 h-4 text-zinc-500 inline" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Auto Cashout Multiplier Input (if enabled) */}
      {autoCashoutEnabled && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-emerald-500/30 text-xs">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase shrink-0">
            Cashout at:
          </span>
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              min="1.1"
              max="100"
              disabled={isActive && isFlying}
              value={autoCashoutMultiplier}
              onChange={(e) => setAutoCashoutMultiplier(e.target.value)}
              className="w-full px-2.5 py-1 rounded-lg bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs focus:outline-none"
            />
            <span className="absolute right-2 top-1 text-emerald-500 font-mono font-bold text-xs">
              x
            </span>
          </div>
          {/* Quick multiplier presets */}
          {['1.5', '2.0', '3.0', '5.0'].map((val) => (
            <button
              key={val}
              type="button"
              disabled={isActive && isFlying}
              onClick={() => setAutoCashoutMultiplier(val)}
              className={`px-1.5 py-1 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                autoCashoutMultiplier === val
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-zinc-800 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              {val}x
            </button>
          ))}
        </div>
      )}

      {/* Bet Amount Input with Quick Increment and Decrement */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold flex items-center justify-between">
          <span>Wager Amount (Coins)</span>
          <span className="text-zinc-500">Min 10</span>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isActive && isFlying}
            onClick={() => adjustAmount(-50)}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm border border-white/5 active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              min="10"
              step="50"
              disabled={isActive && isFlying}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-sm text-zinc-100 text-center focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="button"
            disabled={isActive && isFlying}
            onClick={() => adjustAmount(50)}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm border border-white/5 active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Amount Chips */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {['100', '250', '500', '1000', '2500'].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isActive && isFlying}
              onClick={() => setAmount(preset)}
              className={`py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                amount === preset
                  ? 'bg-zinc-700 text-white border-white/20'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {parseInt(preset) >= 1000 ? `${parseInt(preset) / 1000}K` : preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Action Betting / Cashout Button */}
      <div className="pt-1">
        {/* State 1: Active Bet in Flight - User Can Cash Out */}
        {isActive && isFlying && !cashedOut ? (
          <button
            type="button"
            onClick={onCashout}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black text-sm font-black shadow-xl shadow-amber-950/60 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center animate-pulse"
          >
            <span className="tracking-wider uppercase text-xs">CASH OUT NOW</span>
            <span className="text-base font-black font-mono mt-0.5">
              +{currentPayout.toLocaleString()} Coins ({currentMultiplier.toFixed(2)}x)
            </span>
          </button>
        ) : cashedOut ? (
          /* State 2: Cashed Out Successfully in this round */
          <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5 font-mono">
              <Check className="w-4 h-4" />
              <span>Cashed Out at {cashedOut.toFixed(2)}x</span>
            </span>
            <span className="text-sm font-black font-mono text-emerald-300 block mt-0.5">
              +{(parsedAmount * cashedOut).toFixed(0)} Coins Won!
            </span>
          </div>
        ) : isActive && isCrashed ? (
          /* State 3: Crashed before cashout */
          <div className="w-full py-3.5 px-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400 font-mono">
              Plane Flew Away ({currentMultiplier.toFixed(2)}x)
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              Better luck next flight!
            </span>
          </div>
        ) : isActive && isWaiting ? (
          /* State 4: Bet Placed, waiting for round to launch */
          <div className="flex items-center gap-2">
            <div className="flex-1 py-3.5 px-4 rounded-2xl bg-violet-950/50 border border-violet-500/50 text-center">
              <span className="text-xs font-black uppercase tracking-wider text-violet-300 font-mono flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Bet Ready ({parsedAmount.toLocaleString()} Coins)</span>
              </span>
            </div>
            {onCancelBet && (
              <button
                type="button"
                onClick={onCancelBet}
                className="py-3.5 px-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          /* State 5: Ready to place bet */
          <button
            type="button"
            disabled={disabled || (isFlying && !isActive)}
            onClick={onPlaceBet}
            className={`w-full py-3.5 rounded-2xl text-white text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${accentBg}`}
          >
            <Coins className="w-4 h-4" />
            <span>
              {isFlying ? 'Place Bet for Next Round' : `Bet ${parsedAmount.toLocaleString()} Coins`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
