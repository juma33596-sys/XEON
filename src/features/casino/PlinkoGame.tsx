import React, { useState, useRef, useEffect } from 'react';
import { Play, Sparkles, RefreshCw, Volume2, Coins, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { placeCasinoBetAtomic, cashOutCasinoAtomic, recordLostBet } from '../../services/casinoService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from './casinoAudio';

interface PlinkoGameProps {
  onOpenAuth: () => void;
}

const MULTIPLIERS = [15, 5, 2, 0.7, 0.4, 0.7, 2, 5, 15];

export const PlinkoGame: React.FC<PlinkoGameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [betAmount, setBetAmount] = useState('50');
  const [dropping, setDropping] = useState(false);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [lastWinBucket, setLastWinBucket] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const coinsBalance = wallet?.coins || 0;

  const handleDrop = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid bet amount', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    setDropping(true);
    setLastWinBucket(null);

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'plinko', amt);
      await refreshWallet();
      casinoAudio.playBetPlacedSound();

      // Simulate path down 8 rows of pins
      let x = 50; // percentage
      const path: { x: number; y: number }[] = [{ x: 50, y: 5 }];

      for (let row = 1; row <= 8; row++) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        x += dir * 4.2;
        path.push({ x, y: 10 + row * 9.5 });
      }

      // Animate through path
      let step = 0;
      const interval = setInterval(async () => {
        if (step < path.length) {
          setBallPos(path[step]);
          casinoAudio.playAlertPop();
          step++;
        } else {
          clearInterval(interval);
          setDropping(false);
          setBallPos(null);

          // Calculate bucket 0..8 based on final x position
          const finalX = path[path.length - 1].x;
          let bucketIndex = Math.floor((finalX - 16) / 8);
          if (bucketIndex < 0) bucketIndex = 0;
          if (bucketIndex >= MULTIPLIERS.length) bucketIndex = MULTIPLIERS.length - 1;

          setLastWinBucket(bucketIndex);
          const mult = MULTIPLIERS[bucketIndex];
          setHistory((h) => [mult, ...h.slice(0, 7)]);

          if (mult >= 1) {
            const winRes = await cashOutCasinoAtomic(currentUser.uid, 'plinko', amt, mult, betRes.betId);
            await refreshWallet();
            casinoAudio.playCashoutSound();
            if (mult >= 5) confetti({ particleCount: 70, spread: 60 });
            showToast(`Landed on ${mult}x! Won +${winRes.payout.toLocaleString()} Coins!`, 'success');
          } else {
            await recordLostBet(currentUser.uid, 'plinko', amt, betRes.betId);
            await refreshWallet();
            casinoAudio.playCrashSound();
            showToast(`Landed on ${mult}x bucket. Round finished.`, 'info');
          }
        }
      }, 100);
    } catch (err: any) {
      setDropping(false);
      showToast(err.message || 'Drop failed', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
      {/* Visual Plinko Pyramid Board */}
      <div className="flex-1 bg-[#090b13] border border-white/10 rounded-3xl p-6 relative flex flex-col items-center justify-between overflow-hidden shadow-2xl min-h-[360px]">
        {/* Top Header info */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5 text-pink-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Plinko Cyber Drop (98% RTP)</span>
          </span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  h >= 5 ? 'bg-amber-500/20 text-amber-300' : h >= 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-zinc-400'
                }`}
              >
                {h}x
              </span>
            ))}
          </div>
        </div>

        {/* Peg Board Simulation */}
        <div className="relative w-full max-w-[380px] h-[240px] my-auto">
          {/* Pins */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="flex justify-center gap-4 sm:gap-6 my-2">
              {Array.from({ length: row + 1 }).map((_, col) => (
                <div
                  key={col}
                  className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)] border border-cyan-200"
                />
              ))}
            </div>
          ))}

          {/* Dropping Cyber Ball */}
          {ballPos && (
            <div
              className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 shadow-[0_0_15px_rgba(244,114,182,1)] border-2 border-white transition-all duration-100 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
            />
          )}
        </div>

        {/* Bottom Multiplier Buckets */}
        <div className="w-full grid grid-cols-9 gap-1 pt-3 border-t border-white/5">
          {MULTIPLIERS.map((m, idx) => {
            const isHit = lastWinBucket === idx;
            const isHigh = m >= 5;
            const isMid = m >= 1 && m < 5;
            return (
              <div
                key={idx}
                className={`py-2 rounded-xl text-center font-mono font-black text-xs transition-all ${
                  isHit
                    ? 'scale-110 ring-2 ring-white shadow-lg bg-pink-500 text-white'
                    : isHigh
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : isMid
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-zinc-400 border border-white/5'
                }`}
              >
                {m}x
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-72 bg-[#121520] border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">STAKE AMOUNT</span>
            <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{coinsBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-[#080a0f] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-pink-500"
            />
            <span className="absolute right-3.5 top-3.5 text-xs font-mono text-amber-400">Coins</span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
            {['25', '50', '100', '250', '500', '1000', '2500', 'Max'].map((p) => (
              <button
                key={p}
                onClick={() => setBetAmount(p === 'Max' ? coinsBalance.toString() : p)}
                className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold border border-white/5 cursor-pointer text-center"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-xs font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Rows:</span>
              <span className="text-white">8 Peg Levels</span>
            </div>
            <div className="flex justify-between">
              <span>Max Payout:</span>
              <span className="text-pink-400 font-bold">15x Stake</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDrop}
          disabled={dropping}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-xl shadow-pink-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <ArrowDown className="w-4 h-4" />
          <span>{dropping ? 'DROPPING...' : 'DROP BALL'}</span>
        </button>
      </div>
    </div>
  );
};
