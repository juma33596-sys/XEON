import React, { useState } from 'react';
import { Sparkles, Coins, Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { placeCasinoBetAtomic, cashOutCasinoAtomic, recordLostBet } from '../../services/casinoService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from './casinoAudio';

interface RouletteGameProps {
  onOpenAuth: () => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const RouletteGame: React.FC<RouletteGameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [betAmount, setBetAmount] = useState('50');
  const [selectedBet, setSelectedBet] = useState<'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36'>('red');
  const [spinning, setSpinning] = useState(false);
  const [landedNumber, setLandedNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ num: number; color: 'red' | 'black' | 'green' }>>([
    { num: 7, color: 'red' },
    { num: 20, color: 'black' },
    { num: 0, color: 'green' },
    { num: 32, color: 'red' },
  ]);

  const coinsBalance = wallet?.coins || 0;

  const handleSpin = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid stake amount', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    setSpinning(true);
    setLandedNumber(null);

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'roulette', amt);
      await refreshWallet();
      casinoAudio.playBetPlacedSound();

      // Generate random European roulette number 0..36
      const resultNumber = Math.floor(Math.random() * 37);

      setTimeout(async () => {
        setSpinning(false);
        setLandedNumber(resultNumber);

        const isRed = RED_NUMBERS.includes(resultNumber);
        const isGreen = resultNumber === 0;
        const color: 'red' | 'black' | 'green' = isGreen ? 'green' : isRed ? 'red' : 'black';

        setHistory((prev) => [{ num: resultNumber, color }, ...prev.slice(0, 9)]);

        // Check if won
        let won = false;
        let payoutMult = 2.0;

        if (selectedBet === 'red' && isRed) won = true;
        if (selectedBet === 'black' && !isRed && !isGreen) won = true;
        if (selectedBet === 'even' && resultNumber > 0 && resultNumber % 2 === 0) won = true;
        if (selectedBet === 'odd' && resultNumber % 2 !== 0) won = true;
        if (selectedBet === '1-18' && resultNumber >= 1 && resultNumber <= 18) won = true;
        if (selectedBet === '19-36' && resultNumber >= 19 && resultNumber <= 36) won = true;

        if (won) {
          const winRes = await cashOutCasinoAtomic(currentUser.uid, 'roulette', amt, payoutMult, betRes.betId);
          await refreshWallet();
          casinoAudio.playCashoutSound();
          confetti({ particleCount: 70, spread: 60 });
          showToast(`Ball landed on ${resultNumber} (${color.toUpperCase()})! Won +${winRes.payout.toLocaleString()} Coins!`, 'success');
        } else {
          await recordLostBet(currentUser.uid, 'roulette', amt, betRes.betId);
          await refreshWallet();
          casinoAudio.playCrashSound();
          showToast(`Ball landed on ${resultNumber} (${color.toUpperCase()}). Round lost.`, 'error');
        }
      }, 1500);
    } catch (err: any) {
      setSpinning(false);
      showToast(err.message || 'Spin failed', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
      {/* Visual Roulette Arena */}
      <div className="flex-1 bg-[#090b13] border border-white/10 rounded-3xl p-6 relative flex flex-col items-center justify-between overflow-hidden shadow-2xl min-h-[360px]">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5 text-red-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Neon Cyber Roulette (Single Zero 97.3% RTP)</span>
          </span>
          <div className="flex items-center gap-1">
            {history.slice(0, 6).map((h, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  h.color === 'green'
                    ? 'bg-emerald-600 text-white'
                    : h.color === 'red'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-white border border-white/10'
                }`}
              >
                {h.num}
              </span>
            ))}
          </div>
        </div>

        {/* Cylinder / Ball Animation Box */}
        <div className="my-auto flex flex-col items-center space-y-4">
          <div className="relative w-44 h-44 rounded-full border-4 border-amber-500/40 p-2 flex items-center justify-center bg-gradient-to-tr from-[#160e1d] to-[#0c1020] shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <div
              className={`w-36 h-36 rounded-full border-2 border-white/20 flex items-center justify-center transition-transform ${
                spinning ? 'animate-spin' : ''
              }`}
            >
              {landedNumber !== null ? (
                <div
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center font-mono font-black text-2xl shadow-2xl ${
                    landedNumber === 0
                      ? 'bg-emerald-600 text-white shadow-emerald-500/50'
                      : RED_NUMBERS.includes(landedNumber)
                      ? 'bg-rose-600 text-white shadow-rose-500/50'
                      : 'bg-zinc-900 text-white shadow-black/80'
                  }`}
                >
                  <span>{landedNumber}</span>
                  <span className="text-[10px] uppercase">
                    {landedNumber === 0 ? 'Zero' : RED_NUMBERS.includes(landedNumber) ? 'Red' : 'Black'}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-xs font-mono text-zinc-400">
                  {spinning ? 'SPINNING...' : 'READY'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Betting Board */}
        <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-3 border-t border-white/5 text-xs font-mono font-bold">
          <button
            onClick={() => setSelectedBet('red')}
            className={`py-3 rounded-xl border transition-all cursor-pointer ${
              selectedBet === 'red'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg scale-105'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-950/70'
            }`}
          >
            RED (2.0x)
          </button>
          <button
            onClick={() => setSelectedBet('black')}
            className={`py-3 rounded-xl border transition-all cursor-pointer ${
              selectedBet === 'black'
                ? 'bg-zinc-700 text-white border-zinc-400 shadow-lg scale-105'
                : 'bg-black/60 text-zinc-300 border-white/10 hover:bg-zinc-900'
            }`}
          >
            BLACK (2.0x)
          </button>
          <button
            onClick={() => setSelectedBet('even')}
            className={`py-3 rounded-xl border transition-all cursor-pointer ${
              selectedBet === 'even'
                ? 'bg-violet-600 text-white border-violet-400 shadow-lg scale-105'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
            }`}
          >
            EVEN (2.0x)
          </button>
          <button
            onClick={() => setSelectedBet('odd')}
            className={`py-3 rounded-xl border transition-all cursor-pointer ${
              selectedBet === 'odd'
                ? 'bg-violet-600 text-white border-violet-400 shadow-lg scale-105'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
            }`}
          >
            ODD (2.0x)
          </button>
          <button
            onClick={() => setSelectedBet('1-18')}
            className={`py-3 rounded-xl border transition-all cursor-pointer ${
              selectedBet === '1-18'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg scale-105'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
            }`}
          >
            1 - 18 (2.0x)
          </button>
          <button
            onClick={() => setSelectedBet('19-36')}
            className={`py-3 rounded-xl border transition-all cursor-pointer ${
              selectedBet === '19-36'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg scale-105'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
            }`}
          >
            19 - 36 (2.0x)
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-72 bg-[#121520] border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">STAKE AMOUNT</span>
            <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{coinsBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-full bg-[#080a0f] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-red-500"
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

          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-1 text-xs font-mono">
            <span className="text-zinc-400 block">Selected Bet Sector:</span>
            <span className="text-amber-400 font-bold uppercase">{selectedBet} (2.0x Payout)</span>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-xl shadow-red-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{spinning ? 'BALL SPINNING...' : 'SPIN ROULETTE'}</span>
        </button>
      </div>
    </div>
  );
};
