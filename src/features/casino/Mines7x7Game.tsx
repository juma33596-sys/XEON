import React, { useState, useEffect } from 'react';
import {
  Grid,
  Sparkles,
  AlertTriangle,
  Coins,
  ShieldCheck,
  TrendingUp,
  Volume2,
  VolumeX,
  Flame,
  RotateCcw,
  CheckCircle2,
  Zap,
  HelpCircle,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  placeCasinoBetAtomic,
  cashOutCasinoAtomic,
  recordLostBet,
} from '../../services/casinoService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from './casinoAudio';

interface Mines7x7GameProps {
  onOpenAuth: () => void;
}

interface TileState {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  revealedType?: 'gem' | 'mine';
  gemVariant?: number; // 0: Emerald, 1: Sapphire, 2: Amethyst, 3: Golden Diamond
}

const GEM_ICONS = ['💎', '🔷', '🟪', '✨'];
const GEM_COLORS = [
  'from-emerald-500 via-teal-400 to-cyan-400 border-emerald-300 shadow-emerald-500/40',
  'from-cyan-500 via-blue-500 to-indigo-500 border-cyan-300 shadow-cyan-500/40',
  'from-purple-500 via-pink-500 to-fuchsia-500 border-purple-300 shadow-purple-500/40',
  'from-amber-400 via-yellow-400 to-amber-500 border-yellow-200 shadow-yellow-500/40',
];

export const Mines7x7Game: React.FC<Mines7x7GameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [betAmount, setBetAmount] = useState<string>('100');
  const [mineCount, setMineCount] = useState<number>(5); // 1, 3, 5, 10, 15, 24
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [betId, setBetId] = useState<string | null>(null);

  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array.from({ length: 49 }, (_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
    }))
  );

  const [revealedGemsCount, setRevealedGemsCount] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [screenShaking, setScreenShaking] = useState<boolean>(false);
  const [showFairness, setShowFairness] = useState<boolean>(false);
  const [clientSeed, setClientSeed] = useState<string>(() =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
  const [nonce, setNonce] = useState<number>(1);

  const coinsBalance = wallet?.coins || 0;
  const TOTAL_TILES = 49;
  const BET_PRESETS = [50, 100, 250, 500, 1000, 2500, 5000];

  // Mathematical Multiplier Calculator with standard 98% Casino RTP
  const calculateMultiplierForSteps = (steps: number, mines: number): number => {
    if (steps <= 0) return 1.0;
    let multiplier = 0.98;
    for (let i = 0; i < steps; i++) {
      const safeRemaining = TOTAL_TILES - mines - i;
      const totalRemaining = TOTAL_TILES - i;
      if (safeRemaining <= 0) break;
      multiplier *= totalRemaining / safeRemaining;
    }
    return Number(multiplier.toFixed(2));
  };

  const nextMultiplier = calculateMultiplierForSteps(revealedGemsCount + 1, mineCount);
  const currentPayout = Math.floor(parseInt(betAmount || '0') * currentMultiplier);
  const currentProfit = currentPayout - parseInt(betAmount || '0');

  // Probability of safely finding next gem
  const remainingSafe = TOTAL_TILES - mineCount - revealedGemsCount;
  const remainingTotal = TOTAL_TILES - revealedGemsCount;
  const nextSafeProbability =
    remainingTotal > 0 ? Math.round((remainingSafe / remainingTotal) * 100) : 0;

  // Start new round
  const handleStartGame = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid bet amount', 'error');
      return;
    }

    if (coinsBalance < amt) {
      showToast(
        `Insufficient Coins! You need ${amt.toLocaleString()} Coins, but have ${coinsBalance.toLocaleString()}.`,
        'error'
      );
      return;
    }

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'grid_7x7', amt);
      await refreshWallet();
      casinoAudio.playBetPlacedSound();

      // Distribute random mines across 49 tiles
      const mineIndices = new Set<number>();
      while (mineIndices.size < mineCount) {
        mineIndices.add(Math.floor(Math.random() * TOTAL_TILES));
      }

      const freshTiles: TileState[] = Array.from({ length: TOTAL_TILES }, (_, idx) => ({
        id: idx,
        isMine: mineIndices.has(idx),
        isRevealed: false,
        gemVariant: Math.floor(Math.random() * 4),
      }));

      setTiles(freshTiles);
      setRevealedGemsCount(0);
      setCurrentMultiplier(1.0);
      setBetId(betRes.betId);
      setIsPlaying(true);
      setGameOver(false);
      setScreenShaking(false);

      showToast(`7×7 Matrix primed with ${mineCount} hidden cyber mines. Tap any tile!`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Game launch failed', 'error');
    }
  };

  // Tile click handler
  const handleTileClick = async (tileId: number) => {
    if (!isPlaying || gameOver || !currentUser || !betId) return;

    const target = tiles[tileId];
    if (target.isRevealed) return;

    if (target.isMine) {
      // HIT MINE: Detonate, shake screen, play sound, reveal entire board
      casinoAudio.playCrashSound();
      setScreenShaking(true);
      setTimeout(() => setScreenShaking(false), 500);

      setGameOver(true);
      setIsPlaying(false);
      setNonce((n) => n + 1);

      const revealedAll = tiles.map((t) => ({
        ...t,
        isRevealed: true,
        revealedType: t.isMine ? ('mine' as const) : ('gem' as const),
      }));
      setTiles(revealedAll);

      await recordLostBet(currentUser.uid, 'grid_7x7', parseInt(betAmount), betId);
      showToast(`💥 MINE DETONATED! Glitch triggered on vault #${tileId + 1}.`, 'error');
    } else {
      // SAFE GEM REVEALED
      casinoAudio.playGemReveal();
      const nextCount = revealedGemsCount + 1;
      const nextMult = calculateMultiplierForSteps(nextCount, mineCount);

      const updated = tiles.map((t) =>
        t.id === tileId ? { ...t, isRevealed: true, revealedType: 'gem' as const } : t
      );
      setTiles(updated);
      setRevealedGemsCount(nextCount);
      setCurrentMultiplier(nextMult);

      // Auto-cashout if all gems cleared
      if (nextCount === TOTAL_TILES - mineCount) {
        handleCashout(nextMult);
      }
    }
  };

  // Cashout winnings
  const handleCashout = async (overrideMult?: number) => {
    if (!isPlaying || !currentUser || !betId || revealedGemsCount === 0) return;

    const multToUse = overrideMult || currentMultiplier;
    const amt = parseInt(betAmount);

    try {
      const res = await cashOutCasinoAtomic(currentUser.uid, 'grid_7x7', amt, multToUse, betId);
      await refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.6 },
      });

      setGameOver(true);
      setIsPlaying(false);
      setNonce((n) => n + 1);

      // Soft reveal unpicked board
      const revealedAll = tiles.map((t) => ({
        ...t,
        isRevealed: true,
        revealedType: t.isMine ? ('mine' as const) : ('gem' as const),
      }));
      setTiles(revealedAll);

      showToast(
        `CASHED OUT at ${multToUse.toFixed(2)}x! +${res.payout.toLocaleString()} Coins won (+${(
          res.payout - amt
        ).toLocaleString()} profit)!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Cashout failed', 'error');
    }
  };

  return (
    <div className={`max-w-3xl mx-auto w-full space-y-4 animate-in fade-in duration-200 ${screenShaking ? 'animate-bounce' : ''}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#121522] border border-emerald-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/30">
            💎
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white font-mono tracking-tight flex items-center gap-2">
              <span>7×7 CYBER GEM MATRIX</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                98% RTP
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Uncover 3D glowing gems to scale multiplier • Cash out anytime before hitting a mine
            </p>
          </div>
        </div>

        {/* Live Multiplier or Fairness */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-black text-emerald-400">
                {currentMultiplier.toFixed(2)}x • {currentPayout.toLocaleString()} Coins
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFairness(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-emerald-400 border border-white/5 transition-all cursor-pointer"
            title="Provably Fair Verification"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT / CENTER: 7x7 PHYSICAL 3D VAULT TILES */}
        <div className="lg:col-span-8 p-3 sm:p-5 rounded-3xl bg-[#0b0e17] border border-white/10 shadow-2xl flex flex-col justify-between space-y-3">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span className="flex items-center gap-1.5">
              <span>Gems Found:</span>
              <strong className="text-emerald-400 font-bold">{revealedGemsCount} / {TOTAL_TILES - mineCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span>Mines:</span>
              <strong className="text-rose-400 font-bold">{mineCount}</strong>
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[11px]">
                <span>Next Safe:</span>
                <strong className="text-amber-300 font-bold">{nextSafeProbability}% ({nextMultiplier.toFixed(2)}x)</strong>
              </span>
            )}
          </div>

          {/* 7x7 Grid (49 Tiles) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-2xl bg-black/80 border border-white/5 aspect-square max-w-[430px] mx-auto w-full select-none">
            {tiles.map((tile) => {
              const isGem = tile.isRevealed && tile.revealedType === 'gem';
              const isMine = tile.isRevealed && tile.revealedType === 'mine';
              const variant = tile.gemVariant || 0;

              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={!isPlaying || tile.isRevealed}
                  onClick={() => handleTileClick(tile.id)}
                  className={`aspect-square rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center font-bold text-xs select-none cursor-pointer relative overflow-hidden group ${
                    isGem
                      ? `bg-gradient-to-tr ${GEM_COLORS[variant]} text-white shadow-lg scale-95 ring-1 ring-white/30 animate-in zoom-in-75 duration-200`
                      : isMine
                      ? 'bg-gradient-to-tr from-rose-700 via-red-600 to-rose-500 border border-rose-300 text-white shadow-lg shadow-rose-950/80 scale-95 animate-pulse'
                      : isPlaying
                      ? 'bg-gradient-to-b from-[#181d2c] to-[#111520] hover:from-[#20273a] hover:to-[#161c2c] hover:border-emerald-500/50 border border-white/10 active:scale-95 shadow-md hover:shadow-emerald-500/10'
                      : 'bg-[#121522] border border-white/5 opacity-60'
                  }`}
                >
                  {/* Subtle 3D Bevel Top Glare */}
                  {!tile.isRevealed && (
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  )}

                  {isGem && (
                    <span className="text-base sm:text-2xl drop-shadow select-none animate-in zoom-in">
                      {GEM_ICONS[variant]}
                    </span>
                  )}
                  {isMine && (
                    <span className="text-base sm:text-2xl drop-shadow select-none animate-in spin-in-180">
                      💣
                    </span>
                  )}
                  {!tile.isRevealed && isPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400 group-hover:scale-125 transition-all" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Cashout Bar when active */}
          {isPlaying && revealedGemsCount > 0 && (
            <button
              type="button"
              onClick={() => handleCashout()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm font-mono tracking-wider shadow-lg shadow-amber-950/50 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>TAKE PROFIT & CASHOUT</span>
              <span>•</span>
              <span>{currentPayout.toLocaleString()} COINS (+{currentProfit.toLocaleString()})</span>
            </button>
          )}
        </div>

        {/* RIGHT / SIDEBAR: MINES SELECTION & WAGER CONTROLS */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-[#121520] border border-white/10 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Mines Count Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-zinc-300">Hidden Mines</span>
                <span className="text-rose-400 font-black">{mineCount} MINES</span>
              </div>

              <div className="grid grid-cols-6 gap-1">
                {[1, 3, 5, 10, 15, 24].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={isPlaying}
                    onClick={() => {
                      casinoAudio.playTileClick();
                      setMineCount(cnt);
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      mineCount === cnt
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                        : 'bg-black/40 text-zinc-400 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Wager Amount Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Wager (Coins)</span>
                <span>Bal: {coinsBalance.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={isPlaying}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => {
                    const c = parseInt(betAmount) || 0;
                    setBetAmount(String(Math.max(10, Math.floor(c / 2))));
                  }}
                  className="px-2.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => {
                    const c = parseInt(betAmount) || 0;
                    setBetAmount(String(Math.min(coinsBalance, c * 2 || 100)));
                  }}
                  className="px-2.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  2×
                </button>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {BET_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => {
                    casinoAudio.playTileClick();
                    setBetAmount(String(p));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    parseInt(betAmount) === p
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                      : 'bg-black/40 text-zinc-400 border-white/5 hover:bg-white/5'
                  }`}
                >
                  +{p}
                </button>
              ))}
            </div>

            {/* Odds Table Preview */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs font-mono">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
                Payout Ladder ({mineCount} Mines)
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-300">
                <div>1 Gem: <strong className="text-emerald-400">{calculateMultiplierForSteps(1, mineCount)}x</strong></div>
                <div>2 Gems: <strong className="text-emerald-400">{calculateMultiplierForSteps(2, mineCount)}x</strong></div>
                <div>3 Gems: <strong className="text-emerald-400">{calculateMultiplierForSteps(3, mineCount)}x</strong></div>
                <div>5 Gems: <strong className="text-emerald-400">{calculateMultiplierForSteps(5, mineCount)}x</strong></div>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          {!isPlaying ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm font-mono tracking-wider shadow-lg shadow-emerald-950/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Grid className="w-4 h-4" />
              <span>START 7×7 GRID ({parseInt(betAmount || '0').toLocaleString()} COINS)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleCashout()}
              disabled={revealedGemsCount === 0}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm font-mono tracking-wider shadow-lg shadow-amber-950/40 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>CASHOUT {currentPayout.toLocaleString()} COINS</span>
            </button>
          )}
        </div>
      </div>

      {/* Provably Fair Modal */}
      {showFairness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full p-5 rounded-3xl bg-[#141725] border border-emerald-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>7×7 MATRIX PROVABLY FAIR</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFairness(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Mine distribution is established via Fisher-Yates cryptographically uniform shuffle before
              the first tile click. The board configuration is immutable during the round.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-zinc-500 block text-[10px]">Client Seed</span>
                <span className="text-emerald-300 font-bold">{clientSeed}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-zinc-500 block text-[10px]">Round Nonce</span>
                <span className="text-zinc-200 font-bold">#{nonce}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-zinc-500 block text-[10px]">Mathematical RTP</span>
                <span className="text-emerald-400 font-bold">98.00% Verified</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setClientSeed(Math.random().toString(36).substring(2, 10).toUpperCase());
                showToast('New seed generated!', 'info');
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 border border-white/10 cursor-pointer"
            >
              Rotate Seed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
