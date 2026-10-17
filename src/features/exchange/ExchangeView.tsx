import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Coins,
  Gem,
  AlertCircle,
  CheckCircle2,
  Percent,
  Sparkles,
  ArrowRight,
  Loader2,
  History,
  ShieldCheck,
  PlusCircle,
  Clock,
  RotateCcw,
  Check,
  AlertTriangle,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import { ExchangeRateConfig, CurrencyType, Transaction } from '../../types';
import {
  getExchangeRate,
  calculateExchange,
  executeExchangeAtomic,
} from '../../services/exchangeService';
import { getUserTransactions } from '../../services/walletService';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { casinoAudio } from '../casino/casinoAudio';
import confetti from 'canvas-confetti';

interface ExchangeViewProps {
  onOpenAuth: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ExchangeView: React.FC<ExchangeViewProps> = ({
  onOpenAuth,
  onNavigateTab,
}) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [rateConfig, setRateConfig] = useState<ExchangeRateConfig | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [rateError, setRateError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'coins_to_diamonds' | 'diamonds_to_coins'>('coins_to_diamonds');
  const [inputAmount, setInputAmount] = useState<string>('2000');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [exchangeHistory, setExchangeHistory] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);

  // Load Authoritative Exchange Rate from Firebase
  useEffect(() => {
    setLoadingRate(true);
    getExchangeRate()
      .then((config) => {
        setRateConfig(config);
        setRateError(null);
      })
      .catch((err) => {
        console.error('Failed to load authoritative exchange rate:', err);
        setRateError('Could not load authoritative rate from server. Please try again.');
      })
      .finally(() => {
        setLoadingRate(false);
      });
  }, []);

  // Load User Exchange Transactions
  useEffect(() => {
    if (currentUser) {
      setLoadingHistory(true);
      getUserTransactions(currentUser.uid)
        .then((txs) => {
          const exchanges = txs.filter(
            (t) => t.type === 'exchange_debit' || t.type === 'exchange_credit'
          );
          setExchangeHistory(exchanges.slice(0, 15));
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [currentUser]);

  const coinsBalance = wallet?.coins || 0;
  const diamondsBalance = wallet?.diamonds || 0;

  const sourceCurrency: CurrencyType = direction === 'coins_to_diamonds' ? 'coins' : 'diamonds';
  const targetCurrency: CurrencyType = direction === 'coins_to_diamonds' ? 'diamonds' : 'coins';
  const numericAmount = Math.max(0, parseFloat(inputAmount) || 0);

  const calculation = useMemo(() => {
    if (!rateConfig) return null;
    return calculateExchange(sourceCurrency, numericAmount, rateConfig);
  }, [rateConfig, sourceCurrency, numericAmount]);

  const maxAvailable = sourceCurrency === 'coins' ? coinsBalance : diamondsBalance;
  const hasInsufficientBalance = numericAmount > maxAvailable;

  const handleQuickPercent = (pct: number) => {
    casinoAudio.playTileClick();
    const amt = (maxAvailable * pct) / 100;
    setInputAmount(
      sourceCurrency === 'coins'
        ? String(Math.floor(amt))
        : String(Number(amt.toFixed(2)))
    );
  };

  const toggleDirection = () => {
    casinoAudio.playTileClick();
    setDirection((prev) =>
      prev === 'coins_to_diamonds' ? 'diamonds_to_coins' : 'coins_to_diamonds'
    );
    setInputAmount((prev) => {
      const current = parseFloat(prev) || 0;
      if (direction === 'coins_to_diamonds') {
        return '1';
      } else {
        return '1000';
      }
    });
  };

  const handleStartExchange = () => {
    if (!currentUser) {
      showToast('Please sign in to exchange currency.', 'info');
      onOpenAuth();
      return;
    }

    if (numericAmount <= 0) {
      showToast('Please enter an amount greater than 0.', 'error');
      return;
    }

    if (hasInsufficientBalance) {
      showToast(`Insufficient balance in ${sourceCurrency}.`, 'error');
      return;
    }

    if (rateConfig) {
      if (sourceCurrency === 'coins' && numericAmount < rateConfig.minExchangeCoins) {
        showToast(
          `Minimum exchange is ${rateConfig.minExchangeCoins.toLocaleString()} Coins.`,
          'error'
        );
        return;
      }
      if (sourceCurrency === 'diamonds' && numericAmount < rateConfig.minExchangeDiamonds) {
        showToast(
          `Minimum exchange is ${rateConfig.minExchangeDiamonds} Diamond.`,
          'error'
        );
        return;
      }
    }

    setShowConfirm(true);
  };

  const handleConfirmExchange = async () => {
    if (!currentUser || isExecuting) return;
    setIsExecuting(true);

    try {
      await executeExchangeAtomic(currentUser.uid, sourceCurrency, numericAmount);
      await refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast(
        `Exchange successful! Received +${calculation?.targetNet} ${targetCurrency}.`,
        'success'
      );
      setShowConfirm(false);

      // Refresh history
      if (currentUser) {
        getUserTransactions(currentUser.uid).then((txs) => {
          const exchanges = txs.filter(
            (t) => t.type === 'exchange_debit' || t.type === 'exchange_credit'
          );
          setExchangeHistory(exchanges.slice(0, 15));
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Exchange failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#141725] border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
              <span>CURRENCY EXCHANGE VAULT</span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Instant atomic swap between Coins & Diamonds with 0% slippage
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Atomic Ledger</span>
        </span>
      </div>

      {/* COMPACT TOP CARDS - RESIZED TO STORE SIZE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* CARD 1: Compact Coin Reserve */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#141721] border border-amber-500/30 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>Coins</span>
            </div>
            <button
              onClick={() => onNavigateTab('topup')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Top Up</span>
            </button>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-zinc-100 truncate">
              {coinsBalance.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500">Marketplace Coins</span>
          </div>
        </div>

        {/* CARD 2: Compact Diamond Vault */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#141721] border border-cyan-500/30 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              <Gem className="w-3.5 h-3.5" />
              <span>Diamonds</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              ELITE
            </span>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-zinc-100 truncate">
              {diamondsBalance}
            </div>
            <span className="text-[10px] text-zinc-500">Crystal Currency</span>
          </div>
        </div>

        {/* CARD 3: Compact Rate Card */}
        <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-[#141721] border border-violet-500/30 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
              System Rate
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono">
              Fee: {rateConfig?.feePercentage ?? 2}%
            </span>
          </div>
          <div>
            {loadingRate ? (
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                <span>Reading rate...</span>
              </div>
            ) : rateError ? (
              <span className="text-[10px] text-rose-400 font-mono">{rateError}</span>
            ) : (
              <div className="text-sm sm:text-base font-black font-mono text-zinc-100">
                1 💎 = {rateConfig?.coinsPerDiamond.toLocaleString()} 🪙
              </div>
            )}
            <span className="text-[10px] text-zinc-500">Atomic 0% Slippage</span>
          </div>
        </div>
      </div>

      {/* PHONE-OPTIMIZED ULTRA-CLEAN UNIFIED SWAP CARD */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#131623] to-[#0d101a] border border-white/10 shadow-2xl space-y-3.5">
        {/* PAY BLOCK */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 focus-within:border-violet-500/60 transition-all">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 font-bold uppercase text-[11px]">You Pay</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <span>Bal:</span>
              <strong className="text-zinc-200">
                {sourceCurrency === 'coins' ? coinsBalance.toLocaleString() : diamondsBalance}
              </strong>
              <button
                type="button"
                onClick={() => handleQuickPercent(100)}
                className="ml-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 underline cursor-pointer"
              >
                MAX
              </button>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent font-mono text-2xl sm:text-3xl font-black text-zinc-100 focus:outline-none placeholder-zinc-600"
            />

            {/* Currency Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 shadow-sm ${
                sourceCurrency === 'coins'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {sourceCurrency === 'coins' ? (
                <Coins className="w-4 h-4 text-amber-400" />
              ) : (
                <Gem className="w-4 h-4 text-cyan-400" />
              )}
              <span className="uppercase">{sourceCurrency}</span>
            </div>
          </div>

          {/* Quick % Chips */}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickPercent(pct)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-mono font-bold border border-white/5 transition-all cursor-pointer"
              >
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* FLOATING SWAP BUTTON (CENTER) */}
        <div className="relative flex items-center justify-center -my-2 z-10">
          <button
            type="button"
            onClick={toggleDirection}
            className="w-10 h-10 rounded-2xl bg-[#1b2032] hover:bg-violet-600 border border-violet-500/40 hover:border-violet-400 text-violet-300 hover:text-white flex items-center justify-center shadow-lg shadow-black/50 transition-all duration-300 active:scale-90 cursor-pointer group"
            title="Switch swap direction"
          >
            <ArrowUpDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
          </button>
        </div>

        {/* RECEIVE BLOCK */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 font-bold uppercase text-[11px]">You Receive (Net)</span>
            <span className="text-emerald-400 text-[11px] font-mono font-bold">
              +0% Slippage
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 truncate">
              +{calculation?.targetNet.toLocaleString() || '0'}
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 shadow-sm ${
                targetCurrency === 'coins'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {targetCurrency === 'coins' ? (
                <Coins className="w-4 h-4 text-amber-400" />
              ) : (
                <Gem className="w-4 h-4 text-cyan-400" />
              )}
              <span className="uppercase">{targetCurrency}</span>
            </div>
          </div>

          {/* Insufficient balance warning if applicable */}
          {hasInsufficientBalance && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Insufficient {sourceCurrency} balance ({maxAvailable.toLocaleString()} available)</span>
            </div>
          )}
        </div>

        {/* MINIMAL COLLAPSIBLE DETAILS BAR */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setShowDetailsDropdown((prev) => !prev)}
            className="w-full flex items-center justify-between text-zinc-400 hover:text-zinc-200 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1.5">
              <span>Rate:</span>
              <strong className="text-zinc-200">
                1 💎 = {rateConfig?.coinsPerDiamond.toLocaleString()} 🪙
              </strong>
            </span>
            <div className="flex items-center gap-1 text-[11px] text-violet-400 font-bold">
              <span>Details</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showDetailsDropdown ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showDetailsDropdown && calculation && (
            <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-zinc-400 animate-in fade-in">
              <div className="flex justify-between">
                <span>Gross Output:</span>
                <span className="text-zinc-200 font-bold">
                  {calculation.targetGross.toLocaleString()} {targetCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee ({rateConfig?.feePercentage}%):</span>
                <span className="text-rose-400 font-bold">
                  -{calculation.feeAmount.toLocaleString()} {targetCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Amount:</span>
                <span className="text-zinc-300">
                  {sourceCurrency === 'coins'
                    ? `${rateConfig?.minExchangeCoins.toLocaleString()} Coins`
                    : `${rateConfig?.minExchangeDiamonds} Diamond`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Post-Swap Balance:</span>
                <span className="text-emerald-400 font-bold">
                  {targetCurrency === 'coins'
                    ? (coinsBalance + calculation.targetNet).toLocaleString() + ' Coins'
                    : (diamondsBalance + calculation.targetNet).toFixed(2) + ' Diamonds'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY ACTION CTA */}
        <button
          type="button"
          onClick={handleStartExchange}
          disabled={hasInsufficientBalance || numericAmount <= 0 || loadingRate}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-black text-sm font-mono tracking-wider shadow-xl shadow-violet-950/50 active:scale-98 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
        >
          {hasInsufficientBalance ? (
            <span>INSUFFICIENT {sourceCurrency.toUpperCase()}</span>
          ) : numericAmount <= 0 ? (
            <span>ENTER AN AMOUNT TO SWAP</span>
          ) : (
            <>
              <span>SWAP NOW</span>
              <span className="text-xs font-normal opacity-90">
                ({numericAmount.toLocaleString()} {sourceCurrency} → +{calculation?.targetNet}{' '}
                {targetCurrency})
              </span>
            </>
          )}
        </button>
      </div>

      {/* RECENT EXCHANGES LIST (MOBILE-CLEAN) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121520] border border-white/10 space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
              Recent Vault Swaps
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {exchangeHistory.length} Record(s)
          </span>
        </div>

        <div className="space-y-2">
          {loadingHistory ? (
            <div className="py-6 flex justify-center text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            </div>
          ) : exchangeHistory.length > 0 ? (
            exchangeHistory.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-300 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block text-[11px] sm:text-xs">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(tx.createdAt).toLocaleDateString()} •{' '}
                      {new Date(tx.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div
                  className={`font-mono font-bold text-xs sm:text-sm shrink-0 ml-2 ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{' '}
                  {tx.currency}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-zinc-500 font-mono italic">
              No exchange transactions recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && calculation && (
        <ConfirmDialog
          isOpen={showConfirm}
          title="Confirm Vault Currency Exchange"
          message="Review transaction parameters before executing atomic wallet conversion. This action updates both coin and diamond ledgers authoritatively."
          confirmLabel={`Confirm Swap (+${calculation.targetNet} ${targetCurrency})`}
          cancelLabel="Cancel"
          isLoading={isExecuting}
          details={[
            {
              label: 'You are sending',
              value: `${numericAmount.toLocaleString()} ${sourceCurrency}`,
            },
            {
              label: 'Authoritative Rate',
              value: `1 Diamond = ${rateConfig?.coinsPerDiamond.toLocaleString()} Coins`,
            },
            {
              label: 'Platform Network Fee',
              value: `${calculation.feeAmount} ${targetCurrency} (${rateConfig?.feePercentage}%)`,
            },
            {
              label: 'Net Credited to Vault',
              value: `+${calculation.targetNet} ${targetCurrency}`,
            },
          ]}
          onConfirm={handleConfirmExchange}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};
