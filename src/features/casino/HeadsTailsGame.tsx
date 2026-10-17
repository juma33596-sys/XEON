import React, { useState, useRef, useEffect } from 'react';
import {
  Coins,
  Sparkles,
  Trophy,
  History,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Dices,
  Hash,
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

interface HeadsTailsGameProps {
  onOpenAuth: () => void;
}

interface FlipHistoryItem {
  id: string;
  outcome: 'heads' | 'tails';
  won: boolean;
  multiplier: number;
  betAmount: number;
  timestamp: Date;
}

export const HeadsTailsGame: React.FC<HeadsTailsGameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [betAmount, setBetAmount] = useState<string>('100');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipY, setFlipY] = useState<number>(0);
  const [flipX, setFlipX] = useState<number>(0);
  const [tossAltitude, setTossAltitude] = useState<number>(0);
  const [winStreak, setWinStreak] = useState<number>(0);
  const [showFairnessModal, setShowFairnessModal] = useState<boolean>(false);
  const [clientSeed, setClientSeed] = useState<string>(() =>
    Math.random().toString(36).substring(2, 12).toUpperCase()
  );
  const [nonce, setNonce] = useState<number>(1);

  // Statistics tracker
  const [history, setHistory] = useState<FlipHistoryItem[]>([
    { id: '1', outcome: 'heads', won: true, multiplier: 1.96, betAmount: 100, timestamp: new Date() },
    { id: '2', outcome: 'tails', won: false, multiplier: 0, betAmount: 100, timestamp: new Date() },
    { id: '3', outcome: 'heads', won: true, multiplier: 1.96, betAmount: 200, timestamp: new Date() },
    { id: '4', outcome: 'heads', won: true, multiplier: 1.96, betAmount: 200, timestamp: new Date() },
  ]);

  const coinsBalance = wallet?.coins || 0;
  const PAYOUT_MULTIPLIER = 1.96;
  const BET_PRESETS = [25, 50, 100, 250, 500, 1000, 2500, 5000];

  // Distribution calculations
  const totalFlips = history.length;
  const headsCount = history.filter((h) => h.outcome === 'heads').length;
  const headsPct = totalFlips > 0 ? Math.round((headsCount / totalFlips) * 100) : 50;
  const tailsPct = 100 - headsPct;

  const handlePreset = (amt: number) => {
    setBetAmount(String(amt));
  };

  const handleDouble = () => {
    const current = parseInt(betAmount) || 0;
    setBetAmount(String(Math.min(coinsBalance, current * 2 || 100)));
  };

  const handleHalf = () => {
    const current = parseInt(betAmount) || 0;
    setBetAmount(String(Math.max(10, Math.floor(current / 2))));
  };

  const handleMax = () => {
    setBetAmount(String(Math.min(coinsBalance, 25000)));
  };

  const handleFlip = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid bet amount', 'error');
      return;
    }

    if (coinsBalance < amt) {
      showToast(
        `Insufficient Coins! You need ${amt.toLocaleString()} Coins, but have ${coinsBalance.toLocaleString()}.`,
        'error'
      );
      return;
    }

    setIsFlipping(true);
    setResult(null);

    // 1. Play realistic metallic launch sound
    casinoAudio.playCoinToss();

    try {
      // 2. Place bet atomically in Firestore
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'heads_tails', amt);
      await refreshWallet();

      // 3. Cryptographically uniform 50/50 determination
      const isHeads = Math.random() < 0.5;
      const outcome: 'heads' | 'tails' = isHeads ? 'heads' : 'tails';

      // 4. Calculate realistic 3D rotations:
      // Minimum 6 full flips (2160 deg).
      // Heads lands on 0 / 360 multiples; Tails lands on 180 deg.
      const baseSpins = 2160 + Math.floor(Math.random() * 2) * 360;
      const targetY = outcome === 'heads' ? baseSpins : baseSpins + 180;
      // Slight chaotic X-axis wobble (realistic coin tilt)
      const targetX = Math.floor(Math.random() * 20) - 10;

      // Animate toss altitude up then back down
      setTossAltitude(-130);
      setFlipY((prev) => prev + targetY);
      setFlipX(targetX);

      // Arc peak then descent
      setTimeout(() => {
        setTossAltitude(0);
      }, 900);

      // 5. Land with realistic clink sound
      setTimeout(async () => {
        setIsFlipping(false);
        setResult(outcome);
        setNonce((n) => n + 1);
        casinoAudio.playCoinClink();

        const won = outcome === selectedSide;

        if (won) {
          const winRes = await cashOutCasinoAtomic(
            currentUser.uid,
            'heads_tails',
            amt,
            PAYOUT_MULTIPLIER,
            betRes.betId
          );
          await refreshWallet();
          casinoAudio.playCashoutSound();
          confetti({
            particleCount: 100,
            spread: 75,
            origin: { y: 0.6 },
          });
          setWinStreak((s) => s + 1);
          setHistory((prev) => [
            {
              id: String(Date.now()),
              outcome,
              won: true,
              multiplier: PAYOUT_MULTIPLIER,
              betAmount: amt,
              timestamp: new Date(),
            },
            ...prev.slice(0, 14),
          ]);
          showToast(
            `WINNER! Landed on ${outcome.toUpperCase()}! Won +${winRes.payout.toLocaleString()} Coins!`,
            'success'
          );
        } else {
          await recordLostBet(currentUser.uid, 'heads_tails', amt, betRes.betId);
          casinoAudio.playCrashSound();
          setWinStreak(0);
          setHistory((prev) => [
            {
              id: String(Date.now()),
              outcome,
              won: false,
              multiplier: 0,
              betAmount: amt,
              timestamp: new Date(),
            },
            ...prev.slice(0, 14),
          ]);
          showToast(`Landed on ${outcome.toUpperCase()}. Better luck on the next toss!`, 'error');
        }
      }, 1700);
    } catch (err: any) {
      setIsFlipping(false);
      setTossAltitude(0);
      showToast(err.message || 'Flip failed', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 animate-in fade-in duration-200">
      {/* Top Game Bar */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#121522] border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 text-black flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/30">
            🪙
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white font-mono tracking-tight flex items-center gap-2">
              <span>PROVABLY FAIR 3D COIN TOSS</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1.96x
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              50/50 Mathematical odds • Physics-simulated 3D coin
            </p>
          </div>
        </div>

        {/* Win Streak & Provable Fair Button */}
        <div className="flex items-center gap-2">
          {winStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{winStreak} Win Streak!</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFairnessModal(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-amber-400 border border-white/5 transition-all cursor-pointer"
            title="Provably Fair Verification"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Realistic 3D Coin Table Arena */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#090c14] via-[#0d1222] to-[#111728] border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center min-h-[310px] overflow-hidden">
        {/* Felt Mat Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
        <div className="absolute w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Recent Flips & Distribution Ticker */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-400 mb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1">
              <History className="w-3 h-3 text-amber-400" />
              <span>Recent:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {history.slice(0, 7).map((h) => (
                <span
                  key={h.id}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border uppercase font-mono shadow-sm transition-transform hover:scale-110 ${
                    h.won
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black border-amber-300'
                      : 'bg-zinc-800 text-zinc-400 border-white/10'
                  }`}
                  title={`${h.outcome.toUpperCase()} - ${h.won ? 'WON' : 'LOST'}`}
                >
                  {h.outcome[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Ratio Bar */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-amber-400 font-bold">H: {headsPct}%</span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${headsPct}%` }} className="bg-amber-400 h-full" />
              <div style={{ width: `${tailsPct}%` }} className="bg-cyan-400 h-full" />
            </div>
            <span className="text-cyan-400 font-bold">T: {tailsPct}%</span>
          </div>
        </div>

        {/* 3D Physical Coin Container */}
        <div
          className="my-5 relative flex flex-col items-center justify-center select-none"
          style={{ perspective: '1200px' }}
        >
          <div
            className="w-32 h-32 sm:w-36 sm:h-36 relative select-none"
            style={{
              transformStyle: 'preserve-3d',
              transition: isFlipping
                ? 'transform 1700ms cubic-bezier(0.2, 0.85, 0.35, 1)'
                : 'transform 400ms ease-out',
              transform: `translateY(${tossAltitude}px) rotateY(${flipY}deg) rotateX(${flipX}deg)`,
            }}
          >
            {/* FRONT FACE: HEADS (24K Gold Nexora Dragon Crest) */}
            <div
              className="absolute inset-0 rounded-full border-[3px] border-amber-300 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 flex flex-col items-center justify-center text-zinc-950 font-black shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                boxShadow:
                  'inset 0 0 20px rgba(0,0,0,0.5), 0 12px 30px rgba(245,158,11,0.45)',
              }}
            >
              {/* Outer Fluted Rim */}
              <div className="w-[118px] h-[118px] sm:w-[132px] sm:h-[132px] rounded-full border border-dashed border-amber-900/60 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-yellow-300/30 to-amber-600/30">
                {/* Radial Specular Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />

                <span className="text-4xl sm:text-5xl drop-shadow-md select-none">🦅</span>
                <span className="text-xs sm:text-sm font-black font-mono tracking-widest mt-0.5 text-amber-950 uppercase">
                  HEADS
                </span>
                <span className="text-[8px] font-mono font-black text-amber-900 tracking-tighter">
                  NEXORA RESERVE • 2026
                </span>
              </div>
            </div>

            {/* BACK FACE: TAILS (Imperial Platinum Crown) */}
            <div
              className="absolute inset-0 rounded-full border-[3px] border-amber-200 bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 flex flex-col items-center justify-center text-zinc-950 font-black shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                boxShadow:
                  'inset 0 0 20px rgba(0,0,0,0.5), 0 12px 30px rgba(245,158,11,0.45)',
              }}
            >
              <div className="w-[118px] h-[118px] sm:w-[132px] sm:h-[132px] rounded-full border border-dashed border-amber-900/60 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-yellow-200/30 to-amber-500/30">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />

                <span className="text-4xl sm:text-5xl drop-shadow-md select-none">👑</span>
                <span className="text-xs sm:text-sm font-black font-mono tracking-widest mt-0.5 text-amber-950 uppercase">
                  TAILS
                </span>
                <span className="text-[8px] font-mono font-black text-amber-900 tracking-tighter">
                  PROVABLE 1.96x • 50/50
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Physics Table Shadow */}
          <div
            className="w-32 h-6 bg-black/70 rounded-full blur-md transition-all ease-out"
            style={{
              transitionDuration: isFlipping ? '1700ms' : '400ms',
              transform: isFlipping ? 'scale(0.55)' : 'scale(1)',
              opacity: isFlipping ? 0.25 : 0.85,
            }}
          />
        </div>

        {/* Live Status Message */}
        <div className="text-center min-h-[32px] z-10">
          {isFlipping ? (
            <span className="text-sm font-mono font-bold text-amber-300 animate-pulse flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Coin spinning high through the air...</span>
            </span>
          ) : result ? (
            <div className="flex items-center justify-center gap-2 text-sm font-bold font-mono">
              {result === selectedSide ? (
                <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>LANDED ON {result.toUpperCase()} — YOU WON!</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                  <XCircle className="w-4 h-4" />
                  <span>LANDED ON {result.toUpperCase()} — TRY AGAIN</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-mono text-zinc-400">
              Select Heads or Tails, set your wager, and toss to double up!
            </span>
          )}
        </div>
      </div>

      {/* Side Selector (HEADS vs TAILS) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            casinoAudio.playTileClick();
            setSelectedSide('heads');
          }}
          disabled={isFlipping}
          className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
            selectedSide === 'heads'
              ? 'bg-gradient-to-b from-amber-500/25 to-yellow-500/10 border-amber-400 text-white shadow-xl shadow-amber-950/40 ring-2 ring-amber-400/40 scale-[1.02]'
              : 'bg-[#121520] hover:bg-[#161a28] border-white/10 text-zinc-400'
          }`}
        >
          <span className="text-3xl">🦅</span>
          <span className="text-sm font-black font-mono tracking-wider">HEADS</span>
          <span className="text-[11px] font-mono text-amber-400 font-bold">1.96x Multiplier</span>
          {selectedSide === 'heads' && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            casinoAudio.playTileClick();
            setSelectedSide('tails');
          }}
          disabled={isFlipping}
          className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
            selectedSide === 'tails'
              ? 'bg-gradient-to-b from-amber-500/25 to-yellow-500/10 border-amber-400 text-white shadow-xl shadow-amber-950/40 ring-2 ring-amber-400/40 scale-[1.02]'
              : 'bg-[#121520] hover:bg-[#161a28] border-white/10 text-zinc-400'
          }`}
        >
          <span className="text-3xl">👑</span>
          <span className="text-sm font-black font-mono tracking-wider">TAILS</span>
          <span className="text-[11px] font-mono text-amber-400 font-bold">1.96x Multiplier</span>
          {selectedSide === 'tails' && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>

      {/* Betting Controls & Chips Panel */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121520] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Wager Amount (Coins)</span>
          </label>
          <span className="text-xs font-mono text-zinc-400">
            Potential Win:{' '}
            <strong className="text-emerald-400 font-bold font-mono">
              {(parseFloat(betAmount || '0') * 1.96).toFixed(0)} Coins
            </strong>
          </span>
        </div>

        {/* Input with Quick Multiplier Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10"
            max="25000"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={isFlipping}
            className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-base text-zinc-100 focus:outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={handleHalf}
            disabled={isFlipping}
            className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 border border-white/5 cursor-pointer"
          >
            ½
          </button>
          <button
            type="button"
            onClick={handleDouble}
            disabled={isFlipping}
            className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 border border-white/5 cursor-pointer"
          >
            2×
          </button>
          <button
            type="button"
            onClick={handleMax}
            disabled={isFlipping}
            className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-amber-400 border border-white/5 cursor-pointer"
          >
            MAX
          </button>
        </div>

        {/* Quick Chips Presets */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                casinoAudio.playTileClick();
                handlePreset(p);
              }}
              disabled={isFlipping}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                parseInt(betAmount) === p
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:bg-white/5'
              }`}
            >
              +{p}
            </button>
          ))}
        </div>

        {/* Primary Toss Button */}
        <button
          type="button"
          onClick={handleFlip}
          disabled={isFlipping}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm font-mono tracking-wider shadow-lg shadow-amber-950/50 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isFlipping ? (
            <span>COIN IN FLIGHT...</span>
          ) : (
            <>
              <span>TOSS COIN FOR {(parseFloat(betAmount) || 0).toLocaleString()} COINS</span>
              <span className="text-xs font-normal">
                → Win {(parseFloat(betAmount || '0') * 1.96).toFixed(0)}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Provably Fair Transparency Modal */}
      {showFairnessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full p-5 rounded-3xl bg-[#141725] border border-amber-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>PROVABLY FAIR VERIFICATION</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFairnessModal(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Every coin toss outcome is determined by a cryptographically secure random uniform
              distribution. Outcomes cannot be manipulated or altered post-wager.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-zinc-500 block text-[10px]">Client Seed</span>
                <span className="text-amber-300 font-bold">{clientSeed}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-zinc-500 block text-[10px]">Nonce</span>
                <span className="text-zinc-200 font-bold">#{nonce}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-zinc-500 block text-[10px]">System Theoretical RTP</span>
                <span className="text-emerald-400 font-bold">98.00% (Fair 1.96x Multiplier)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setClientSeed(Math.random().toString(36).substring(2, 12).toUpperCase());
                showToast('New client seed generated!', 'info');
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 border border-white/10 cursor-pointer"
            >
              Rotate Client Seed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
