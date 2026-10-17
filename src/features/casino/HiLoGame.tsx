import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Equal, Coins, Sparkles, Check, Play, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { placeCasinoBetAtomic, cashOutCasinoAtomic, recordLostBet } from '../../services/casinoService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from './casinoAudio';

interface HiLoGameProps {
  onOpenAuth: () => void;
}

const CARD_NAMES: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};
const SUITS = ['♠', '♥', '♦', '♣'];

export const HiLoGame: React.FC<HiLoGameProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [betAmount, setBetAmount] = useState('50');
  const [isPlaying, setIsPlaying] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);

  const [currentCard, setCurrentCard] = useState<{ value: number; suit: string }>({ value: 8, suit: '♠' });
  const [cardHistory, setCardHistory] = useState<Array<{ value: number; suit: string }>>([]);
  const [multiplier, setMultiplier] = useState(1.0);
  const [streak, setStreak] = useState(0);

  const coinsBalance = wallet?.coins || 0;

  const handleStartGame = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid bet amount', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    try {
      const res = await placeCasinoBetAtomic(currentUser.uid, 'hilo', amt);
      await refreshWallet();
      casinoAudio.playBetPlacedSound();

      const startVal = Math.floor(Math.random() * 13) + 2;
      const startSuit = SUITS[Math.floor(Math.random() * SUITS.length)];

      setCurrentCard({ value: startVal, suit: startSuit });
      setCardHistory([{ value: startVal, suit: startSuit }]);
      setMultiplier(1.0);
      setStreak(0);
      setBetId(res.betId);
      setIsPlaying(true);
      showToast('Card dealt! Guess Higher or Lower.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Game init failed', 'error');
    }
  };

  const handleGuess = async (guess: 'higher' | 'lower' | 'equal') => {
    if (!isPlaying || !currentUser || !betId) return;

    const nextVal = Math.floor(Math.random() * 13) + 2;
    const nextSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const nextCard = { value: nextVal, suit: nextSuit };

    const isHigher = nextVal > currentCard.value;
    const isLower = nextVal < currentCard.value;
    const isEqual = nextVal === currentCard.value;

    const won =
      (guess === 'higher' && isHigher) ||
      (guess === 'lower' && isLower) ||
      (guess === 'equal' && isEqual);

    setCurrentCard(nextCard);
    setCardHistory((prev) => [nextCard, ...prev.slice(0, 5)]);

    if (won) {
      const stepMult = guess === 'equal' ? 8.0 : nextVal >= 8 ? 1.45 : 1.35;
      const newMult = Number((multiplier * stepMult).toFixed(2));
      setMultiplier(newMult);
      setStreak((s) => s + 1);
      casinoAudio.playAlertPop();
      showToast(`Correct! Card was ${CARD_NAMES[nextVal]}${nextSuit}. Multiplier: ${newMult}x`, 'success');
    } else {
      setIsPlaying(false);
      await recordLostBet(currentUser.uid, 'hilo', parseInt(betAmount), betId);
      await refreshWallet();
      casinoAudio.playCrashSound();
      showToast(`Missed! Next card was ${CARD_NAMES[nextVal]}${nextSuit}. Round ended.`, 'error');
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || !currentUser || !betId || multiplier <= 1.0) return;
    try {
      const amt = parseInt(betAmount);
      const res = await cashOutCasinoAtomic(currentUser.uid, 'hilo', amt, multiplier, betId);
      setIsPlaying(false);
      await refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({ particleCount: 70, spread: 60 });
      showToast(`Cashed out at ${multiplier}x! Won +${res.payout.toLocaleString()} Coins!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Cashout failed', 'error');
    }
  };

  const isRed = currentCard.suit === '♥' || currentCard.suit === '♦';

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
      {/* Playing Arena */}
      <div className="flex-1 bg-[#090b13] border border-white/10 rounded-3xl p-6 relative flex flex-col items-center justify-between overflow-hidden shadow-2xl min-h-[360px]">
        {/* Top Info */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Hi-Lo Cyber Cards (Streak Mode)</span>
          </span>
          <span className="text-zinc-400">Streak: {streak} Win(s)</span>
        </div>

        {/* Card Arena */}
        <div className="my-auto flex flex-col items-center space-y-4">
          <div
            className={`w-36 h-52 rounded-2xl border-2 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ${
              isRed
                ? 'bg-gradient-to-br from-rose-950/80 to-[#18111a] border-rose-500/60 text-rose-400 shadow-rose-950/50'
                : 'bg-gradient-to-br from-indigo-950/80 to-[#0e111a] border-indigo-500/60 text-indigo-300 shadow-indigo-950/50'
            }`}
          >
            <div className="flex items-center justify-between font-mono font-black text-2xl">
              <span>{CARD_NAMES[currentCard.value]}</span>
              <span>{currentCard.suit}</span>
            </div>

            <div className="text-center text-5xl font-black">{currentCard.suit}</div>

            <div className="flex items-center justify-between font-mono font-black text-2xl rotate-180">
              <span>{CARD_NAMES[currentCard.value]}</span>
              <span>{currentCard.suit}</span>
            </div>
          </div>

          {isPlaying && (
            <div className="text-center font-mono">
              <span className="text-xs text-zinc-400 block">CURRENT MULTIPLIER</span>
              <span className="text-2xl font-black text-amber-400">{multiplier.toFixed(2)}x</span>
            </div>
          )}
        </div>

        {/* Previous Cards History */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto">
          <span className="text-[10px] font-mono text-zinc-500">History:</span>
          {cardHistory.slice(1).map((c, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                c.suit === '♥' || c.suit === '♦' ? 'bg-rose-500/10 text-rose-300' : 'bg-white/5 text-zinc-300'
              }`}
            >
              {CARD_NAMES[c.value]}
              {c.suit}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
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
              className="w-full bg-[#080a0f] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
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
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm tracking-wide shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>DEAL CARDS</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 my-auto">
            <span className="text-xs font-mono font-bold text-zinc-400 block text-center uppercase">
              Predict Next Card:
            </span>

            <button
              onClick={() => handleGuess('higher')}
              className="w-full py-3.5 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <ArrowUp className="w-5 h-5" />
              <span>HIGHER</span>
            </button>

            <button
              onClick={() => handleGuess('lower')}
              className="w-full py-3.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <ArrowDown className="w-5 h-5" />
              <span>LOWER</span>
            </button>

            <button
              onClick={() => handleGuess('equal')}
              className="w-full py-2.5 rounded-2xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Equal className="w-4 h-4" />
              <span>SAME RANK (8.0x)</span>
            </button>

            {multiplier > 1.0 && (
              <button
                onClick={handleCashout}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 mt-2"
              >
                <span>CASHOUT {(parseInt(betAmount) * multiplier).toLocaleString()} COINS</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
