import React, { useState } from 'react';
import { Users, Trophy, CheckCircle2, XCircle, TrendingUp, Sparkles, UserCheck } from 'lucide-react';

export interface AviatorPlayer {
  id: string;
  name: string;
  avatarBg: string;
  betAmount: number;
  targetCashout: number;
  cashedOut: boolean;
  cashedOutMultiplier: number | null;
  winAmount: number | null;
  isUser?: boolean;
  betLabel?: string;
}

export interface AviatorTopWin {
  id: string;
  name: string;
  avatarBg: string;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  timeAgo: string;
}

interface AviatorPlayersListProps {
  players: AviatorPlayer[];
  currentMultiplier: number;
  stage: 'waiting' | 'flying' | 'crashed';
  userBets: {
    bet1?: { amount: number; cashedOut: number | null; active: boolean };
    bet2?: { amount: number; cashedOut: number | null; active: boolean };
  };
  previousRoundPlayers?: AviatorPlayer[];
}

const SAMPLE_TOP_WINS: AviatorTopWin[] = [
  { id: 'tw1', name: 'Kiprono_Ace', avatarBg: 'from-amber-500 to-rose-500', betAmount: 1500, multiplier: 42.80, winAmount: 64200, timeAgo: '2m ago' },
  { id: 'tw2', name: 'CryptoDenis', avatarBg: 'from-violet-500 to-indigo-500', betAmount: 5000, multiplier: 18.50, winAmount: 92500, timeAgo: '5m ago' },
  { id: 'tw3', name: 'Zuri_Queen', avatarBg: 'from-pink-500 to-rose-500', betAmount: 800, multiplier: 65.12, winAmount: 52096, timeAgo: '11m ago' },
  { id: 'tw4', name: 'Mwita_Pro', avatarBg: 'from-emerald-500 to-teal-500', betAmount: 3200, multiplier: 12.30, winAmount: 39360, timeAgo: '16m ago' },
  { id: 'tw5', name: 'AlphaPilot_TZ', avatarBg: 'from-cyan-500 to-blue-500', betAmount: 2000, multiplier: 28.40, winAmount: 56800, timeAgo: '24m ago' },
];

export const AviatorPlayersList: React.FC<AviatorPlayersListProps> = ({
  players,
  currentMultiplier,
  stage,
  userBets,
  previousRoundPlayers = [],
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'previous' | 'top'>('all');

  // Compute live statistics for current round
  const allCurrentPlayers: AviatorPlayer[] = [];

  // Inject User Bet 1 if active
  if (userBets.bet1?.active) {
    allCurrentPlayers.push({
      id: 'user_bet_1',
      name: 'You (Bet 1)',
      avatarBg: 'from-violet-500 to-fuchsia-500',
      betAmount: userBets.bet1.amount,
      targetCashout: userBets.bet1.cashedOut || 999,
      cashedOut: !!userBets.bet1.cashedOut,
      cashedOutMultiplier: userBets.bet1.cashedOut,
      winAmount: userBets.bet1.cashedOut
        ? Math.floor(userBets.bet1.amount * userBets.bet1.cashedOut)
        : null,
      isUser: true,
      betLabel: 'Bet 1',
    });
  }

  // Inject User Bet 2 if active
  if (userBets.bet2?.active) {
    allCurrentPlayers.push({
      id: 'user_bet_2',
      name: 'You (Bet 2)',
      avatarBg: 'from-cyan-500 to-blue-500',
      betAmount: userBets.bet2.amount,
      targetCashout: userBets.bet2.cashedOut || 999,
      cashedOut: !!userBets.bet2.cashedOut,
      cashedOutMultiplier: userBets.bet2.cashedOut,
      winAmount: userBets.bet2.cashedOut
        ? Math.floor(userBets.bet2.amount * userBets.bet2.cashedOut)
        : null,
      isUser: true,
      betLabel: 'Bet 2',
    });
  }

  // Add the rest of the players
  allCurrentPlayers.push(...players);

  const displayPlayers = activeTab === 'all' ? allCurrentPlayers : previousRoundPlayers;

  const totalBetsCount = displayPlayers.length;
  const totalCoinsWagered = displayPlayers.reduce((acc, p) => acc + p.betAmount, 0);
  const cashedOutCount = displayPlayers.filter((p) => p.cashedOut).length;

  return (
    <div className="rounded-3xl bg-[#121520] border border-white/10 p-4 md:p-5 shadow-2xl flex flex-col space-y-3.5">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5 font-mono">
              <span>Real-Time Players Feed</span>
              {stage === 'flying' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              Live stakes, cashouts & wins at every point
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Bets ({totalBetsCount})
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'previous'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Prev Round
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'top'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>Top Wins</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar for the current round */}
      {activeTab !== 'top' && (
        <div className="grid grid-cols-3 gap-2 px-3 py-2 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono">
          <div>
            <span className="text-zinc-500 block text-[9px] uppercase">Active Bets</span>
            <span className="font-bold text-zinc-200">{totalBetsCount} Players</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[9px] uppercase">Total Stake</span>
            <span className="font-bold text-amber-300">
              {totalCoinsWagered.toLocaleString()} <span className="text-[9px]">Coins</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 block text-[9px] uppercase">Cashed Out</span>
            <span className="font-bold text-emerald-400">
              {cashedOutCount} / {totalBetsCount}
            </span>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="max-h-[320px] overflow-y-auto scrollbar-none space-y-1.5 pr-0.5">
        {activeTab === 'top' ? (
          /* Top Wins Tab */
          SAMPLE_TOP_WINS.map((tw) => (
            <div
              key={tw.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-500/20 hover:border-amber-500/40 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${tw.avatarBg} flex items-center justify-center font-bold text-[10px] text-white shadow`}
                >
                  {tw.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-zinc-200 flex items-center gap-1">
                    <span>{tw.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">({tw.timeAgo})</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Bet: {tw.betAmount.toLocaleString()} Coins
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-xs">
                  {tw.multiplier.toFixed(2)}x
                </span>
                <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                  +{tw.winAmount.toLocaleString()} Coins
                </div>
              </div>
            </div>
          ))
        ) : displayPlayers.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono">
            No bets placed for this round yet.
          </div>
        ) : (
          /* Live / Current Players Feed */
          displayPlayers.map((player) => {
            // Check if player has cashed out
            const hasCashedOut = player.cashedOut;
            const isCrashed = stage === 'crashed' && !hasCashedOut;
            const inFlight = stage === 'flying' && !hasCashedOut;

            // Live win calculation at current point
            const liveCurrentWin = Math.floor(player.betAmount * currentMultiplier);

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-all duration-150 border text-xs ${
                  player.isUser
                    ? 'bg-violet-950/40 border-violet-500/60 ring-1 ring-violet-500/40'
                    : hasCashedOut
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isCrashed
                    ? 'bg-rose-950/15 border-rose-500/20 opacity-75'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Player identity */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${player.avatarBg} flex items-center justify-center font-bold text-[10px] text-white shrink-0`}
                  >
                    {player.isUser ? (
                      <UserCheck className="w-4 h-4 text-white" />
                    ) : (
                      player.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-200 truncate flex items-center gap-1.5">
                      <span className="truncate">{player.name}</span>
                      {player.isUser && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-violet-500 text-white">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Bet: <strong className="text-zinc-200">{player.betAmount.toLocaleString()}</strong> Coins
                    </div>
                  </div>
                </div>

                {/* Cashout / In-flight / Crashed status with real-time win at every point */}
                <div className="text-right shrink-0">
                  {hasCashedOut ? (
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{player.cashedOutMultiplier?.toFixed(2)}x</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-emerald-400 mt-0.5">
                        +{(player.winAmount || Math.floor(player.betAmount * (player.cashedOutMultiplier || 1))).toLocaleString()} Coins
                      </div>
                    </div>
                  ) : inFlight ? (
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-[11px]">
                        <TrendingUp className="w-3 h-3 animate-pulse" />
                        <span>{currentMultiplier.toFixed(2)}x</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        Pot: <span className="text-amber-200 font-bold">+{liveCurrentWin.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : isCrashed ? (
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono font-bold text-[10px]">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>CRASHED</span>
                      </div>
                      <div className="text-[10px] font-mono text-rose-400/80 mt-0.5">
                        -{player.betAmount.toLocaleString()} Coins
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-zinc-400">
                      Waiting...
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
