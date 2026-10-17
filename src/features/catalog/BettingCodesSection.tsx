import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Flame,
  Coins,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  TrendingUp,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Clock,
  CheckCheck,
  XCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BettingCode,
  PurchasedBettingCode,
  BettingApp,
} from '../../types';
import {
  getBettingCodes,
  getUserPurchasedBettingCodes,
  purchaseBettingCodeAtomic,
  getBettingAppLogos,
  BETTING_APPS_META,
} from '../../services/bettingCodeService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';

interface BettingCodesSectionProps {
  onOpenAuth: () => void;
  onNavigateTab?: (tab: string) => void;
}

const APPS_LIST: (BettingApp | 'All')[] = [
  'All',
  'SportyBet',
  'BetPawa',
  'Betika',
  'Betway',
  '1win',
  '21.com',
  'FanSport',
  'MozzartBet',
];

export const BettingCodesSection: React.FC<BettingCodesSectionProps> = ({
  onOpenAuth,
  onNavigateTab,
}) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [codes, setCodes] = useState<BettingCode[]>([]);
  const [appLogos, setAppLogos] = useState<Record<string, string>>({});
  const [purchasedCodes, setPurchasedCodes] = useState<PurchasedBettingCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedApp, setSelectedApp] = useState<BettingApp | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'won'>('all');
  const [oddsRange, setOddsRange] = useState<'all' | 'safe' | 'medium' | 'high' | 'mega'>('all');
  const [activeTab, setActiveTab] = useState<'store' | 'my_codes'>('store');

  // Purchase modal
  const [codeToBuy, setCodeToBuy] = useState<BettingCode | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  async function loadData() {
    setLoading(true);
    try {
      const [allCodes, logos] = await Promise.all([
        getBettingCodes(true),
        getBettingAppLogos(),
      ]);
      setCodes(allCodes);
      setAppLogos(logos);

      if (currentUser) {
        const owned = await getUserPurchasedBettingCodes(currentUser.uid);
        setPurchasedCodes(owned);
      }
    } catch (err) {
      console.error('Error loading betting codes:', err);
    } finally {
      setLoading(false);
    }
  }

  // Set of purchased code IDs for quick lookup
  const purchasedMap = useMemo(() => {
    const map = new Map<string, string>();
    purchasedCodes.forEach((p) => {
      map.set(p.codeId, p.bookingCode);
    });
    return map;
  }, [purchasedCodes]);

  // Filtered codes
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      if (selectedApp !== 'All' && c.bettingApp !== selectedApp) {
        return false;
      }
      if (statusFilter === 'active' && c.status !== 'active') return false;
      if (statusFilter === 'won' && c.status !== 'won') return false;

      if (oddsRange === 'safe' && c.odds >= 10) return false;
      if (oddsRange === 'medium' && (c.odds < 10 || c.odds > 50)) return false;
      if (oddsRange === 'high' && (c.odds < 50 || c.odds > 100)) return false;
      if (oddsRange === 'mega' && c.odds <= 100) return false;
      return true;
    });
  }, [codes, selectedApp, statusFilter, oddsRange]);

  const handleCopy = (codeString: string, id: string) => {
    navigator.clipboard.writeText(codeString);
    setCopiedId(id);
    showToast(`Booking Code "${codeString}" copied!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePurchase = async () => {
    if (!codeToBuy) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!wallet || (wallet.coins || 0) < codeToBuy.costCoins) {
      showToast(
        `Insufficient Coins! You need ${codeToBuy.costCoins} Coins to unlock this ${codeToBuy.odds} Odds ticket. You currently have ${wallet?.coins || 0} Coins.`,
        'error'
      );
      return;
    }

    setPurchasing(true);
    try {
      const res = await purchaseBettingCodeAtomic({
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        codeId: codeToBuy.id,
      });

      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast(`Booking code unlocked successfully! ${codeToBuy.costCoins} Coins deducted.`, 'success');

      await refreshWallet();
      await loadData();
      setCodeToBuy(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to purchase betting code.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const wonTotal = codes.filter((c) => c.status === 'won').length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/40 via-amber-950/30 to-zinc-950/80 border border-amber-500/20 p-5 sm:p-7">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP BETTING CODES STORE (2-COLUMN GRID)</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
            Verified Booking Codes & High-Odds Slips
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Select verified slips by Odds from <strong className="text-amber-300">BetPawa</strong>,{' '}
            <strong className="text-amber-300">SportyBet</strong>, <strong className="text-amber-300">Betika</strong>,{' '}
            <strong className="text-amber-300">Betway</strong>, <strong className="text-amber-300">1win</strong>,{' '}
            <strong className="text-amber-300">21.com</strong> & <strong className="text-amber-300">FanSport</strong>.
            Unlock booking code instantly with in-app Coins!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 bg-[#090b10]/80 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-zinc-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>
                Your Coins: <strong className="text-white">{wallet?.coins?.toLocaleString() || 0}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#090b10]/80 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-zinc-300">
              <Ticket className="w-4 h-4 text-cyan-400" />
              <span>
                My Unlocked: <strong className="text-white">{purchasedCodes.length}</strong>
              </span>
            </div>

            {wonTotal > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-300 font-bold">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>{wonTotal} Verified Wins</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Tabs: Store vs My Unlocked Codes */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Available Slips</span>
          </button>

          <button
            onClick={() => setActiveTab('my_codes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_codes'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>My Unlocked Slips ({purchasedCodes.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'store' && (
        <>
          {/* Filter Bar: Bookmaker Apps */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" /> Filter Bookmaker
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {APPS_LIST.map((app) => (
                <button
                  key={app}
                  onClick={() => setSelectedApp(app)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedApp === app
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-[#11141f] border border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {app !== 'All' && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: BETTING_APPS_META[app]?.brandColor || '#e53935' }}
                    />
                  )}
                  <span>{app}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status & Odds Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Outcome Filter */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Slips' },
                { id: 'active', label: '⚡ Active Slips' },
                { id: 'won', label: '🏆 Verified Won' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-[11px] font-mono ${
                    statusFilter === s.id
                      ? 'bg-white/20 text-white font-bold border border-white/30'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Odds Range */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-zinc-500 font-mono text-[11px] shrink-0">ODDS:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'safe', label: '< 10' },
                { id: 'medium', label: '10 - 50' },
                { id: 'high', label: '50 - 100' },
                { id: 'mega', label: '100+ Mega' },
              ].map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOddsRange(o.id as any)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap text-[11px] font-mono ${
                    oddsRange === o.id
                      ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2-COLUMN SMALL CARDS GRID AS REQUESTED */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-zinc-400 text-xs font-mono">Loading verified slips...</p>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0f121b] border border-white/5 space-y-3">
              <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-white font-bold text-base">No betting slips found</h3>
              <p className="text-zinc-400 text-xs">Try selecting a different betting app or odds range.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredCodes.map((item) => {
                const isOwned = purchasedMap.has(item.id);
                const revealedCode = isOwned ? purchasedMap.get(item.id) : null;
                const meta = BETTING_APPS_META[item.bettingApp] || BETTING_APPS_META['Other'];
                const effectiveLogo = item.appLogoUrl || appLogos[item.bettingApp] || meta.logoUrl;
                const isWon = item.status === 'won';
                const isLost = item.status === 'lost';

                return (
                  <div
                    key={item.id}
                    className={`group relative bg-[#0e111a] border rounded-2xl overflow-hidden transition-all shadow-lg flex flex-col justify-between p-2.5 sm:p-3.5 ${
                      isWon
                        ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/25 to-[#0e111a] shadow-emerald-950/30'
                        : isLost
                        ? 'border-rose-500/30 opacity-80'
                        : 'border-white/10 hover:border-amber-500/40 hover:shadow-xl'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Top Header: App Logo + Name + Status */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={effectiveLogo}
                            alt={item.bettingApp}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-white/10 shrink-0 bg-black/40"
                          />
                          <span className="font-extrabold text-white text-xs sm:text-sm truncate font-mono">
                            {item.bettingApp}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isWon && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black font-mono animate-pulse">
                              <CheckCheck className="w-2.5 h-2.5" />
                              <span>WON</span>
                            </span>
                          )}
                          {isLost && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold font-mono">
                              <XCircle className="w-2.5 h-2.5" />
                              <span>LOST</span>
                            </span>
                          )}
                          {!isWon && !isLost && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold font-mono">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CLEAR, PROMINENT ODDS HIGHLIGHT BLOCK */}
                      <div className="text-center py-2 px-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 border border-amber-500/30 shadow-inner">
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400/90 block">
                          TICKET ODDS
                        </span>
                        <div className="text-lg sm:text-2xl font-black font-mono text-amber-300 tracking-tight flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{item.odds.toFixed(2)}</span>
                        </div>
                        {item.winRatePercent && (
                          <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 block mt-0.5 font-bold">
                            {item.winRatePercent}% Win Rate
                          </span>
                        )}
                      </div>

                      {/* Title & Sport */}
                      <div className="space-y-0.5">
                        <h4 className="text-white font-bold text-xs line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate block">
                          {item.leagueOrSport || 'Multi-Bet Banker'}
                        </span>
                      </div>

                      {/* Match Date / Expiry Timer */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                        <span className="truncate">{item.matchDate || 'Upcoming'}</span>
                        <span className="text-zinc-500 shrink-0">{item.purchasesCount || 0} unlocked</span>
                      </div>
                    </div>

                    {/* Bottom Action Area: Locked vs Unlocked */}
                    <div className="pt-2 mt-2 border-t border-white/5">
                      {isOwned && revealedCode ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Unlock className="w-3 h-3" /> Unlocked
                            </span>
                            <span className="text-[9px] text-zinc-400">Ready</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-[#141824] border border-emerald-500/40 rounded-xl px-2 py-1 text-center font-mono font-black text-xs text-emerald-300 truncate tracking-wider">
                              {revealedCode}
                            </div>
                            <button
                              onClick={() => handleCopy(revealedCode, item.id)}
                              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shrink-0"
                              title="Copy Code"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {meta.websiteUrl && (
                            <a
                              href={meta.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <span>Load in {item.bettingApp}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1 text-amber-400 font-black text-xs font-mono">
                            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item.costCoins}</span>
                          </div>

                          <button
                            onClick={() => setCodeToBuy(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-[11px] transition-all shadow-md shadow-amber-500/20 flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Unlock</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MY PURCHASED CODES TAB */}
      {activeTab === 'my_codes' && (
        <div className="space-y-4">
          {purchasedCodes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0f121b] border border-white/5 space-y-3">
              <Lock className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-white font-bold text-base">You haven&apos;t unlocked any betting slips yet</h3>
              <p className="text-zinc-400 text-xs">
                Select any code in the VIP store and unlock it using your Coins!
              </p>
              <button
                onClick={() => setActiveTab('store')}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer"
              >
                Browse Slips
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {purchasedCodes.map((p) => {
                const meta = BETTING_APPS_META[p.bettingApp] || BETTING_APPS_META['Other'];
                const effectiveLogo = p.appLogoUrl || appLogos[p.bettingApp] || meta.logoUrl;

                return (
                  <div
                    key={p.id}
                    className="bg-[#0e111a] border border-emerald-500/30 rounded-2xl p-3 flex flex-col justify-between space-y-2.5 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={effectiveLogo}
                            alt={p.bettingApp}
                            className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0 bg-black/40"
                          />
                          <span className="font-extrabold text-white text-xs truncate font-mono">{p.bettingApp}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold font-mono">
                          UNLOCKED
                        </span>
                      </div>

                      <div className="text-center py-1.5 px-1 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-amber-500/30">
                        <span className="text-[9px] font-mono text-amber-400 block font-bold">ODDS</span>
                        <span className="text-lg font-black font-mono text-amber-300">{p.odds.toFixed(2)}</span>
                      </div>

                      <h4 className="text-white font-bold text-xs line-clamp-1">{p.title}</h4>

                      {/* Code Box */}
                      <div className="bg-[#141824] border border-emerald-500/40 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-zinc-400 font-mono block">Booking Code:</span>
                        <div className="font-mono font-black text-sm text-emerald-300 tracking-wider">
                          {p.bookingCode}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleCopy(p.bookingCode, p.id)}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === p.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Code</span>
                      </button>

                      {meta.websiteUrl && (
                        <a
                          href={meta.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                          title={`Open ${p.bettingApp}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRM PURCHASE MODAL */}
      {codeToBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121624] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-mono">Unlock Betting Code</h3>
              </div>
              <button
                onClick={() => setCodeToBuy(null)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#090b10] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={codeToBuy.appLogoUrl || appLogos[codeToBuy.bettingApp] || BETTING_APPS_META[codeToBuy.bettingApp]?.logoUrl}
                    alt={codeToBuy.bettingApp}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-white font-bold text-xs">{codeToBuy.bettingApp}</h4>
                    <span className="text-[10px] text-zinc-400">{codeToBuy.leagueOrSport}</span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-sm border border-amber-500/30">
                  {codeToBuy.odds.toFixed(2)} ODDS
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-white/5">
                <h5 className="text-zinc-200 font-semibold text-xs">{codeToBuy.title}</h5>
                {codeToBuy.description && (
                  <p className="text-zinc-400 text-xs leading-relaxed">{codeToBuy.description}</p>
                )}
              </div>
            </div>

            {/* Price Confirmation */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono">
              <span className="text-zinc-300">Cost:</span>
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{codeToBuy.costCoins} Coins</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCodeToBuy(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay {codeToBuy.costCoins} Coins</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
