import React from 'react';
import { Plane, Zap, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface ActiveBetInfo {
  panelNumber: 1 | 2;
  amount: number;
  betId: string | null;
  cashedOut: number | null;
  onCashout: () => void;
}

interface CashoutNotificationPopProps {
  stage: 'waiting' | 'flying' | 'crashed';
  multiplier: number;
  bet1?: ActiveBetInfo;
  bet2?: ActiveBetInfo;
  milestoneAlert?: string | null;
}

export const CashoutNotificationPop: React.FC<CashoutNotificationPopProps> = ({
  stage,
  multiplier,
  bet1,
  bet2,
  milestoneAlert,
}) => {
  const isFlying = stage === 'flying';

  // Check if either bet is active and not cashed out
  const canCashout1 = isFlying && bet1 && !bet1.cashedOut;
  const canCashout2 = isFlying && bet2 && !bet2.cashedOut;

  // Don't render the floating sticky action bar if no active bets can be cashed out
  const hasActiveBets = canCashout1 || canCashout2;

  return (
    <>
      {/* Milestone Toast Alert (e.g. at 2x, 5x, 10x) */}
      {milestoneAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/90 to-rose-600/90 text-black font-black text-xs font-mono shadow-2xl flex items-center gap-2 border border-yellow-300">
            <Zap className="w-4 h-4 text-black fill-current animate-bounce" />
            <span>{milestoneAlert}</span>
          </div>
        </div>
      )}

      {/* Floating Sticky Cashout Action Pop - Gives User Instant Free Chance to Cashout! */}
      {hasActiveBets && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg animate-in slide-in-from-bottom duration-300">
          <div className="p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-[#171427] via-[#1f1a36] to-[#171427] border-2 border-amber-400/80 shadow-2xl shadow-amber-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 animate-pulse">
                  <Plane className="w-4 h-4 -rotate-12" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-300 font-bold tracking-wider block">
                    Fast Cashout Window Active
                  </span>
                  <span className="text-xs font-mono text-zinc-300">
                    Flight climbing:{' '}
                    <strong className="text-emerald-400 font-black text-sm">
                      {multiplier.toFixed(2)}x
                    </strong>
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse font-bold">
                1-TAP CASHOUT
              </span>
            </div>

            {/* Quick Cashout Buttons */}
            <div className={`grid ${canCashout1 && canCashout2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
              {canCashout1 && bet1 && (
                <button
                  type="button"
                  onClick={bet1.onCashout}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs shadow-lg shadow-amber-900/40 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center font-mono leading-tight"
                >
                  <span className="text-[10px] uppercase font-sans tracking-wide">
                    Cash Out Bet 1
                  </span>
                  <span className="text-sm font-extrabold mt-0.5">
                    +{(bet1.amount * multiplier).toFixed(0)} Coins
                  </span>
                </button>
              )}

              {canCashout2 && bet2 && (
                <button
                  type="button"
                  onClick={bet2.onCashout}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-xs shadow-lg shadow-cyan-900/40 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center font-mono leading-tight"
                >
                  <span className="text-[10px] uppercase font-sans tracking-wide">
                    Cash Out Bet 2
                  </span>
                  <span className="text-sm font-extrabold mt-0.5">
                    +{(bet2.amount * multiplier).toFixed(0)} Coins
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
