import React, { useState } from 'react';
import { Sparkles, Coins, Play, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { placeCasinoBetAtomic, cashOutCasinoAtomic, recordLostBet } from '../../services/casinoService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from './casinoAudio';

interface MegaWheelGameProps {
  onOpenAuth: () => void;
}

const SECTORS = [
  { mult: 2, label: '2x Double', color: 'from-blue-600 to-cyan-500' },
  { mult: 5, label: '5x Multi', color: 'from-amber-500 to-yellow-400' },
  { mult: 2, label: '2x Double', color: 'from-blue-600 to-cyan-500' },
  { mult: 10, label: '10x Super', color: 'from-purple-600 to-pink-500' },
  { mult: 2, label: '2x Double', color: 'from-blue-600 to-cyan-500' },
  { mult: 20, label: '20x Ultra', color: 'from-emerald-500 to-teal-400' },
  { mult: 5, label: '5x Multi', color: 'from-amber-500 to-yellow-400' },
  { mult: 50, label: '50x JACKPOT', color: 'from-rose-600 to-red-500' },
];

export const MegaWheelGame: React.FC<MegaWheelGameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [betAmount, setBetAmount] = useState('50');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonSector, setWonSector] = useState<typeof SECTORS[0] | null>(null);

  const coinsBalance = wallet?.coins || 0;

  const handleSpinWheel = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid stake amount', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    setSpinning(true);
    setWonSector(null);

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'crypto_wheel', amt);
      await refreshWallet();
      casinoAudio.playBetPlacedSound();

      // Pick random winning sector
      const sectorIndex = Math.floor(Math.random() * SECTORS.length);
      const targetSector = SECTORS[sectorIndex];

      // Calculate degrees: 360 / 8 = 45 deg per sector
      const sectorDeg = 45;
      const targetAngle = 360 * 5 + (360 - sectorIndex * sectorDeg);

      setRotation((prev) => prev + targetAngle);

      setTimeout(async () => {
        setSpinning(false);
        setWonSector(targetSector);

        const winRes = await cashOutCasinoAtomic(
          currentUser.uid,
          'crypto_wheel',
          amt,
          targetSector.mult,
          betRes.betId
        );
        await refreshWallet();
        casinoAudio.playCashoutSound();
        if (targetSector.mult >= 10) confetti({ particleCount: 90, spread: 70 });
        showToast(
          `Wheel stopped on ${targetSector.label}! Won +${winRes.payout.toLocaleString()} Coins!`,
          'success'
        );
      }, 3000);
    } catch (err: any) {
      setSpinning(false);
      showToast(err.message || 'Spin failed', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
      {/* Visual Wheel Arena */}
      <div className="flex-1 bg-[#090b13] border border-white/10 rounded-3xl p-6 relative flex flex-col items-center justify-between overflow-hidden shadow-2xl min-h-[360px]">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5 text-teal-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>Mega Multiplier Fortune Wheel (Provably Fair)</span>
          </span>
          <span className="text-amber-400 font-bold">Jackpot: 50x Multiplier</span>
        </div>

        {/* Wheel Graphic */}
        <div className="relative my-auto flex items-center justify-center">
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,1)]" />

          {/* Rotating Wheel Disk */}
          <div
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-amber-500/50 p-2 shadow-[0_0_40px_rgba(20,184,166,0.3)] transition-all duration-[3000ms] ease-out flex items-center justify-center relative overflow-hidden bg-gradient-to-tr from-[#121929] to-[#0a1120]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {SECTORS.map((s, idx) => {
              const deg = idx * 45;
              return (
                <div
                  key={idx}
                  className="absolute w-full h-full flex items-start justify-center pt-3 text-xs font-mono font-black"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  <span className="bg-black/60 px-2 py-0.5 rounded-full border border-white/10 text-white shadow-sm">
                    {s.mult}x
                  </span>
                </div>
              );
            })}

            {/* Center Hub */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 border-2 border-white shadow-xl flex items-center justify-center font-black text-black text-xs font-mono z-10">
              SPIN
            </div>
          </div>
        </div>

        {/* Winner Pill */}
        <div className="w-full text-center py-2 border-t border-white/5 font-mono text-xs">
          {wonSector ? (
            <span className="text-emerald-400 font-black text-sm">
              🎉 WINNER: {wonSector.label} ({wonSector.mult}x Stake)!
            </span>
          ) : (
            <span className="text-zinc-500">Every spin guarantees at least a 2x win!</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-72 bg-[#121520] border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-4">
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
            className="w-full bg-[#080a0f] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-teal-500"
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

          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-1 text-xs font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Sectors:</span>
              <span className="text-white">8 Multipliers</span>
            </div>
            <div className="flex justify-between">
              <span>Min Payout:</span>
              <span className="text-cyan-400 font-bold">2.0x Double</span>
            </div>
            <div className="flex justify-between">
              <span>Max Payout:</span>
              <span className="text-rose-400 font-bold">50.0x Jackpot</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSpinWheel}
          disabled={spinning}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-black font-black text-sm tracking-wide shadow-xl shadow-teal-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{spinning ? 'WHEEL SPINNING...' : 'SPIN MEGA WHEEL'}</span>
        </button>
      </div>
    </div>
  );
};
