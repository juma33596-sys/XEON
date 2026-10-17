import React, { useState } from 'react';
import { Target, Shield, Trophy, Coins, Sparkles, Play, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { placeCasinoBetAtomic, cashOutCasinoAtomic, recordLostBet } from '../../services/casinoService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from './casinoAudio';

interface PenaltyShootoutGameProps {
  onOpenAuth: () => void;
}

const LADDER = [1.92, 3.84, 7.68, 15.36, 30.72];
const ZONES = [
  { id: 'top_left', label: 'Top Left ↗', x: '18%', y: '25%' },
  { id: 'top_right', label: 'Top Right ↖', x: '82%', y: '25%' },
  { id: 'middle', label: 'Roof Middle ↑', x: '50%', y: '35%' },
  { id: 'bottom_left', label: 'Bottom Left ↘', x: '22%', y: '75%' },
  { id: 'bottom_right', label: 'Bottom Right ↙', x: '78%', y: '75%' },
];

export const PenaltyShootoutGame: React.FC<PenaltyShootoutGameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [betAmount, setBetAmount] = useState('50');
  const [isPlaying, setIsPlaying] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);

  const [goalsScored, setGoalsScored] = useState(0);
  const [gkZone, setGkZone] = useState<string | null>(null);
  const [shotZone, setShotZone] = useState<string | null>(null);
  const [shooting, setShooting] = useState(false);

  const coinsBalance = wallet?.coins || 0;
  const currentMult = goalsScored > 0 ? LADDER[goalsScored - 1] : 1.0;

  const handleStartGame = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid stake amount', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    try {
      const res = await placeCasinoBetAtomic(currentUser.uid, 'penalty', amt);
      await refreshWallet();
      casinoAudio.playBetPlacedSound();

      setBetId(res.betId);
      setGoalsScored(0);
      setGkZone(null);
      setShotZone(null);
      setIsPlaying(true);
      showToast('Game started! Pick a target zone to shoot.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Game init failed', 'error');
    }
  };

  const handleShoot = async (targetId: string) => {
    if (!isPlaying || shooting || !currentUser || !betId) return;

    setShooting(true);
    setShotZone(targetId);

    // AI Keeper picks a zone with 20% probability per zone
    const chosenGkZone = ZONES[Math.floor(Math.random() * ZONES.length)].id;
    setGkZone(chosenGkZone);

    setTimeout(async () => {
      setShooting(false);
      const isSaved = chosenGkZone === targetId;

      if (!isSaved) {
        // Goal scored!
        const nextGoals = goalsScored + 1;
        setGoalsScored(nextGoals);
        const newMultiplier = LADDER[nextGoals - 1];
        casinoAudio.playCashoutSound();
        showToast(`GOAL!! Scored ${nextGoals}/5! Current Multiplier: ${newMultiplier}x`, 'success');

        if (nextGoals === 5) {
          // Completed entire ladder! Auto-cashout top tier 30.72x
          const amt = parseInt(betAmount);
          const winRes = await cashOutCasinoAtomic(currentUser.uid, 'penalty', amt, newMultiplier, betId);
          setIsPlaying(false);
          await refreshWallet();
          confetti({ particleCount: 100, spread: 80 });
          showToast(`🏆 FULL PENALTY SWEEP! Won +${winRes.payout.toLocaleString()} Coins!`, 'success');
        }
      } else {
        // Saved by Keeper!
        setIsPlaying(false);
        await recordLostBet(currentUser.uid, 'penalty', parseInt(betAmount), betId);
        await refreshWallet();
        casinoAudio.playCrashSound();
        showToast('SAVED BY KEEPER! Round ended.', 'error');
      }
    }, 700);
  };

  const handleCashout = async () => {
    if (!isPlaying || !currentUser || !betId || goalsScored === 0) return;
    try {
      const amt = parseInt(betAmount);
      const mult = LADDER[goalsScored - 1];
      const winRes = await cashOutCasinoAtomic(currentUser.uid, 'penalty', amt, mult, betId);
      setIsPlaying(false);
      await refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({ particleCount: 70, spread: 60 });
      showToast(`Cashed out at ${mult}x! Won +${winRes.payout.toLocaleString()} Coins!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Cashout failed', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
      {/* Soccer Goal Arena */}
      <div className="flex-1 bg-[#090b13] border border-white/10 rounded-3xl p-6 relative flex flex-col items-center justify-between overflow-hidden shadow-2xl min-h-[360px]">
        {/* Top Info */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>Cyber Penalty Shootout (Ladder Multiplier)</span>
          </span>
          <span className="text-zinc-400">Goals: {goalsScored} / 5</span>
        </div>

        {/* Goal Visual Frame */}
        <div className="relative w-full max-w-[480px] h-[230px] my-auto bg-gradient-to-b from-[#0e1628] to-[#070b14] border-4 border-white/80 rounded-t-3xl shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Goal Net Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* AI Cyber Keeper Avatar in Center */}
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center text-white transition-all duration-300 ${
              gkZone === 'top_left'
                ? '-translate-x-28 -translate-y-12'
                : gkZone === 'top_right'
                ? 'translate-x-28 -translate-y-12'
                : gkZone === 'bottom_left'
                ? '-translate-x-24 translate-y-10'
                : gkZone === 'bottom_right'
                ? 'translate-x-24 translate-y-10'
                : ''
            }`}
          >
            <Shield className="w-7 h-7" />
          </div>

          {/* Shooting Target Zones */}
          {isPlaying &&
            ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() => handleShoot(zone.id)}
                disabled={shooting}
                style={{ left: zone.x, top: zone.y }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-yellow-400/80 bg-yellow-400/20 hover:bg-yellow-400/50 hover:scale-110 flex items-center justify-center text-yellow-300 font-bold text-xs cursor-pointer transition-all shadow-[0_0_12px_rgba(250,204,21,0.5)] active:scale-95"
              >
                <Target className="w-5 h-5 animate-spin" />
              </button>
            ))}
        </div>

        {/* Multiplier Ladder Strip */}
        <div className="w-full grid grid-cols-5 gap-1.5 pt-3 border-t border-white/5">
          {LADDER.map((m, idx) => {
            const isCompleted = goalsScored > idx;
            const isCurrent = goalsScored === idx + 1;
            return (
              <div
                key={idx}
                className={`py-2 rounded-xl text-center font-mono font-bold text-xs transition-all ${
                  isCurrent
                    ? 'bg-yellow-500 text-black shadow-lg scale-105'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-zinc-500 border border-white/5'
                }`}
              >
                <span className="block text-[9px] uppercase">Shot {idx + 1}</span>
                <span className="font-black text-sm">{m}x</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-72 bg-[#121520] border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-4">
        {!isPlaying ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300">STAKE AMOUNT</span>
              <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
                <Coins className="w-3.5 h-3.5" />
                <span>{coinsBalance.toLocaleString()}</span>
              </div>
            </div>

            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-[#080a0f] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-yellow-500"
            />

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

            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-sm tracking-wide shadow-xl shadow-yellow-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START PENALTY</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 my-auto">
            <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-center font-mono space-y-1">
              <span className="text-xs text-zinc-400 block">CURRENT MULTIPLIER</span>
              <span className="text-2xl font-black text-yellow-400">{currentMult}x</span>
            </div>

            <p className="text-xs text-zinc-400 text-center">
              Click any of the 5 crosshair targets on the goal to take your shot!
            </p>

            {goalsScored > 0 && (
              <button
                onClick={handleCashout}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>CASHOUT {(parseInt(betAmount) * currentMult).toLocaleString()} COINS</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
