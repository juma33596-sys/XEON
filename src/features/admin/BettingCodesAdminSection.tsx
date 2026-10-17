import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Coins,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  TrendingUp,
  Loader2,
  Calendar,
  Clock,
  Upload,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { BettingCode, BettingApp } from '../../types';
import {
  getBettingCodes,
  createBettingCode,
  updateBettingCode,
  deleteBettingCode,
  approveBettingCodeResult,
  cleanupExpiredCodes,
  getBettingAppLogos,
  saveBettingAppLogo,
  BETTING_APPS_META,
} from '../../services/bettingCodeService';
import { useToast } from '../../context/ToastContext';

const APPS: BettingApp[] = [
  'SportyBet',
  'BetPawa',
  'Betika',
  'Betway',
  '1win',
  '21.com',
  'FanSport',
  'MozzartBet',
  'Other',
];

export const BettingCodesAdminSection: React.FC = () => {
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'codes' | 'app_logos'>('codes');
  const [codes, setCodes] = useState<BettingCode[]>([]);
  const [appLogos, setAppLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appFilter, setAppFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Inline delete confirm state (avoids window.confirm in iframe)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [bettingApp, setBettingApp] = useState<BettingApp>('SportyBet');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [odds, setOdds] = useState('25.00');
  const [costCoins, setCostCoins] = useState('50');
  const [description, setDescription] = useState('');
  const [leagueOrSport, setLeagueOrSport] = useState('EPL & Champions League');
  const [matchDate, setMatchDate] = useState('Upcoming Matches');
  const [winRatePercent, setWinRatePercent] = useState('90');
  const [status, setStatus] = useState<'active' | 'won' | 'lost' | 'expired'>('active');
  const [expiresAt, setExpiresAt] = useState('');

  // App Logos Manager form state
  const [selectedLogoApp, setSelectedLogoApp] = useState<BettingApp>('SportyBet');
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [savingLogo, setSavingLogo] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [fetchedCodes, logos] = await Promise.all([
        getBettingCodes(true),
        getBettingAppLogos(),
      ]);
      setCodes(fetchedCodes);
      setAppLogos(logos);
    } catch (err) {
      console.error('Error fetching admin betting codes:', err);
    } finally {
      setLoading(false);
    }
  }

  // Purge expired codes
  const handlePurgeExpired = async () => {
    setPurging(true);
    try {
      const purged = await cleanupExpiredCodes();
      if (purged.length > 0) {
        showToast(`Successfully auto-purged ${purged.length} expired codes.`, 'success');
        await loadAll();
      } else {
        showToast('All active codes are still valid. None expired yet.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to purge expired codes', 'error');
    } finally {
      setPurging(false);
    }
  };

  // Safe Inline Delete
  const handleDeleteCode = async (codeId: string) => {
    try {
      // Optimistic update so it disappears immediately
      setCodes((prev) => prev.filter((c) => c.id !== codeId));
      setConfirmDeleteId(null);
      await deleteBettingCode(codeId);
      showToast('Betting code permanently deleted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete code.', 'error');
      await loadAll();
    }
  };

  // 1-Click Status Approval (Won / Lost / Active)
  const handleSetStatus = async (codeId: string, newStatus: 'won' | 'lost' | 'active') => {
    try {
      setCodes((prev) =>
        prev.map((c) => (c.id === codeId ? { ...c, status: newStatus } : c))
      );
      await approveBettingCodeResult(codeId, newStatus);
      showToast(
        newStatus === 'won'
          ? '🎉 Slip marked as WON! Badge updated in VIP store.'
          : newStatus === 'lost'
          ? 'Slip marked as Settled (Lost).'
          : 'Slip set back to Active status.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
      await loadAll();
    }
  };

  // Set Expiry Preset
  const setExpiryHours = (hours: number) => {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    setExpiresAt(d.toISOString().slice(0, 16)); // format for datetime-local
  };

  const handleSelectApp = (app: BettingApp) => {
    setBettingApp(app);
    const custom = appLogos[app];
    if (custom) {
      setAppLogoUrl(custom);
    } else if (BETTING_APPS_META[app]?.logoUrl) {
      setAppLogoUrl(BETTING_APPS_META[app].logoUrl);
    }
  };

  const handleOpenAdd = () => {
    setEditingCodeId(null);
    setTitle('');
    handleSelectApp('SportyBet');
    setBookingCode('');
    setOdds('25.00');
    setCostCoins('50');
    setDescription('');
    setLeagueOrSport('Premier League / Multi');
    setMatchDate('Weekend Primetime');
    setWinRatePercent('90');
    setStatus('active');
    setExpiryHours(24); // default 24h
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: BettingCode) => {
    setEditingCodeId(c.id);
    setTitle(c.title);
    setBettingApp(c.bettingApp);
    setAppLogoUrl(c.appLogoUrl || appLogos[c.bettingApp] || BETTING_APPS_META[c.bettingApp]?.logoUrl || '');
    setBookingCode(c.bookingCode);
    setOdds(c.odds.toString());
    setCostCoins(c.costCoins.toString());
    setDescription(c.description || '');
    setLeagueOrSport(c.leagueOrSport || '');
    setMatchDate(c.matchDate || '');
    setWinRatePercent((c.winRatePercent || 90).toString());
    setStatus(c.status);
    setExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bookingCode.trim() || !odds) {
      showToast('Please fill out all required fields (Title, Booking Code, Odds).', 'error');
      return;
    }

    const parsedOdds = parseFloat(odds);
    const parsedCost = parseInt(costCoins, 10);
    const parsedWinRate = parseInt(winRatePercent, 10);

    if (isNaN(parsedOdds) || parsedOdds <= 1) {
      showToast('Please enter valid odds greater than 1.00.', 'error');
      return;
    }

    if (isNaN(parsedCost) || parsedCost < 0) {
      showToast('Please enter a valid cost in Coins.', 'error');
      return;
    }

    setSaving(true);
    try {
      const finalLogo = appLogoUrl.trim() || appLogos[bettingApp] || BETTING_APPS_META[bettingApp]?.logoUrl || '';
      const finalExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : undefined;

      if (editingCodeId) {
        await updateBettingCode(editingCodeId, {
          title: title.trim(),
          bettingApp,
          appLogoUrl: finalLogo,
          bookingCode: bookingCode.trim(),
          odds: parsedOdds,
          costCoins: parsedCost,
          description: description.trim(),
          leagueOrSport: leagueOrSport.trim(),
          matchDate: matchDate.trim(),
          winRatePercent: isNaN(parsedWinRate) ? undefined : parsedWinRate,
          status,
          expiresAt: finalExpiresAt,
        });
        showToast('Betting code updated successfully.', 'success');
      } else {
        await createBettingCode({
          title: title.trim(),
          bettingApp,
          appLogoUrl: finalLogo,
          bookingCode: bookingCode.trim(),
          odds: parsedOdds,
          costCoins: parsedCost,
          description: description.trim(),
          leagueOrSport: leagueOrSport.trim(),
          matchDate: matchDate.trim(),
          winRatePercent: isNaN(parsedWinRate) ? undefined : parsedWinRate,
          status,
          expiresAt: finalExpiresAt,
          featured: parsedOdds >= 30,
        });
        showToast('New betting code published to VIP store.', 'success');
      }

      setIsModalOpen(false);
      await loadAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to save betting code.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Upload/Save Bookmaker App Logo
  const handleSaveAppLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoInputUrl.trim()) {
      showToast('Please enter an image URL or choose a file.', 'error');
      return;
    }

    setSavingLogo(true);
    try {
      await saveBettingAppLogo(selectedLogoApp, logoInputUrl.trim());
      setAppLogos((prev) => ({ ...prev, [selectedLogoApp]: logoInputUrl.trim() }));
      showToast(`Custom logo saved for ${selectedLogoApp}! All slips will now use this image.`, 'success');
      // Also update any current codes in state with new logo
      setCodes((prev) =>
        prev.map((c) => (c.bettingApp === selectedLogoApp ? { ...c, appLogoUrl: logoInputUrl.trim() } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save app logo.', 'error');
    } finally {
      setSavingLogo(false);
    }
  };

  // Handle direct file upload for app logo (Base64)
  const handleAppLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoInputUrl(result);
      showToast(`Loaded ${file.name}. Click "Save App Logo" to apply.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Filtered codes
  const filtered = codes.filter((c) => {
    if (appFilter !== 'All' && c.bettingApp !== appFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.bettingApp.toLowerCase().includes(q) ||
        c.bookingCode.toLowerCase().includes(q) ||
        c.odds.toString().includes(q)
      );
    }
    return true;
  });

  const totalPurchases = codes.reduce((acc, c) => acc + (c.purchasesCount || 0), 0);
  const totalRevenue = codes.reduce((acc, c) => acc + (c.purchasesCount || 0) * c.costCoins, 0);
  const wonCount = codes.filter((c) => c.status === 'won').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e111a] border border-white/5 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white font-mono tracking-tight">
              VIP Betting Codes & Odds Chamber
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Publish booking slips, approve Won/Lost outcomes, manage bookmaker app logos, and auto-purge expired slips.
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#141824] p-1 rounded-2xl border border-white/5 flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('codes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'codes'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎯 Slips ({codes.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('app_logos');
                setLogoInputUrl(appLogos[selectedLogoApp] || BETTING_APPS_META[selectedLogoApp]?.logoUrl || '');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeSubTab === 'app_logos'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>App Logos</span>
            </button>
          </div>

          <button
            onClick={handlePurgeExpired}
            disabled={purging}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer border border-white/5"
            title="Auto-Clean Expired Codes"
          >
            <Clock className={`w-4 h-4 ${purging ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={loadAll}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Betting Slip</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Active Slips</span>
          <div className="text-xl font-black font-mono text-cyan-400">
            {codes.filter((c) => c.status === 'active').length}
          </div>
        </div>

        <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Approved WON</span>
          <div className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{wonCount}</span>
          </div>
        </div>

        <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Unlocked Slips</span>
          <div className="text-xl font-black font-mono text-white">{totalPurchases}</div>
        </div>

        <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Coins Revenue</span>
          <div className="text-xl font-black font-mono text-amber-400 flex items-center gap-1">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: BOOKING CODES LIST & MANAGEMENT                     */}
      {/* ============================================================== */}
      {activeSubTab === 'codes' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search slip title, bookmaker, odds, booking code..."
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
            >
              <option value="All">All Apps</option>
              {APPS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="won">Won Only</option>
              <option value="lost">Lost Only</option>
            </select>
          </div>

          {/* 2-Column Responsive Cards Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-xs text-zinc-400 font-mono">Loading betting slips...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0e111a] border border-white/5 space-y-3">
              <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-300 font-bold">No betting slips match criteria</p>
              <p className="text-xs text-zinc-500">Click &quot;Add Betting Slip&quot; above to publish a fresh high-odds code.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filtered.map((item) => {
                const meta = BETTING_APPS_META[item.bettingApp] || BETTING_APPS_META['Other'];
                const effectiveLogo = item.appLogoUrl || appLogos[item.bettingApp] || meta.logoUrl;
                const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now();
                const isConfirmingDelete = confirmDeleteId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-[#0e111a] border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-lg ${
                      item.status === 'won'
                        ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-[#0e111a]'
                        : item.status === 'lost'
                        ? 'border-rose-500/30 opacity-75'
                        : isExpired
                        ? 'border-amber-500/30 opacity-75'
                        : 'border-white/10 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header: App Logo + Odds Box */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={effectiveLogo}
                            alt={item.bettingApp}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40"
                          />
                          <div className="min-w-0">
                            <h4 className="font-black text-white text-sm truncate font-mono">{item.bettingApp}</h4>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {item.leagueOrSport || 'Multi-Bet'}
                            </span>
                          </div>
                        </div>

                        {/* Bold Odds Pill */}
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-sm shadow-sm">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.odds.toFixed(2)} ODDS</span>
                          </div>
                          {/* Status Badge */}
                          <div className="mt-1">
                            {item.status === 'won' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                                <span>WON</span>
                              </span>
                            )}
                            {item.status === 'lost' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>LOST</span>
                              </span>
                            )}
                            {item.status === 'active' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                                <span>ACTIVE</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h5 className="font-bold text-white text-xs line-clamp-1">{item.title}</h5>
                        {item.description && (
                          <p className="text-zinc-400 text-[11px] line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Key Details Strip */}
                      <div className="bg-[#141824] p-2.5 rounded-xl border border-white/5 space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                          <span>Booking Code:</span>
                          <span className="text-amber-300 font-black tracking-widest bg-black/40 px-2 py-0.5 rounded">
                            {item.bookingCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                          <span>Cost:</span>
                          <span className="text-amber-400 font-bold">{item.costCoins} Coins</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                          <span>Purchases:</span>
                          <span className="text-zinc-300 font-bold">{item.purchasesCount || 0} unlocked</span>
                        </div>
                        {item.expiresAt && (
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                            <span className="text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span>Expires:</span>
                            </span>
                            <span className={isExpired ? 'text-rose-400 font-bold' : 'text-amber-300/90'}>
                              {isExpired ? 'Expired (Auto-Purging)' : new Date(item.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Outcome Approval Quick Buttons */}
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-zinc-400 block mb-1.5 uppercase font-bold">
                          Set Outcome:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono font-bold">
                          <button
                            onClick={() => handleSetStatus(item.id, 'won')}
                            className={`py-1 px-1.5 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                              item.status === 'won'
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                            title="Approve as WON"
                          >
                            <Check className="w-3 h-3" />
                            <span>WON</span>
                          </button>

                          <button
                            onClick={() => handleSetStatus(item.id, 'lost')}
                            className={`py-1 px-1.5 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                              item.status === 'lost'
                                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                            title="Mark as LOST"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>LOST</span>
                          </button>

                          <button
                            onClick={() => handleSetStatus(item.id, 'active')}
                            className={`py-1 px-1.5 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                              item.status === 'active'
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                            }`}
                            title="Set as ACTIVE"
                          >
                            <span>ACTIVE</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions: Edit & Safe Delete */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-white/5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Slip</span>
                      </button>

                      {/* Safe Inline Deletion (No window.confirm) */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteCode(item.id)}
                            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] font-mono cursor-pointer transition-colors"
                          >
                            Delete? Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[11px] font-mono cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Delete Code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: BOOKMAKER APP LOGOS & BRANDING MANAGER             */}
      {/* ============================================================== */}
      {activeSubTab === 'app_logos' && (
        <div className="space-y-6">
          <div className="bg-[#0e111a] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Upload Custom App Logos (SportyBet, BetPawa, Betika, Betway, 1win, etc.)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Admin can upload or update the image for each betting app. Every slip for that app in the VIP store will automatically display this official logo!
              </p>
            </div>

            {/* App Selection Grid */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-300">
                1. Select Bookmaker App to Customize:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {APPS.map((app) => {
                  const isSelected = selectedLogoApp === app;
                  const currentImg = appLogos[app] || BETTING_APPS_META[app]?.logoUrl;
                  return (
                    <button
                      key={app}
                      type="button"
                      onClick={() => {
                        setSelectedLogoApp(app);
                        setLogoInputUrl(appLogos[app] || BETTING_APPS_META[app]?.logoUrl || '');
                      }}
                      className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20'
                          : 'bg-[#121520] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <img
                        src={currentImg}
                        alt={app}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-white truncate font-mono">{app}</span>
                        <span className="text-[10px] text-zinc-400 truncate block">
                          {appLogos[app] ? 'Custom Logo' : 'Default'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo Upload Form */}
            <form onSubmit={handleSaveAppLogo} className="bg-[#121520] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoInputUrl || appLogos[selectedLogoApp] || BETTING_APPS_META[selectedLogoApp]?.logoUrl}
                  alt={selectedLogoApp}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shrink-0 bg-black/40 shadow-md"
                />
                <div>
                  <h4 className="text-sm font-black text-white font-mono">
                    Customizing Logo for: <span className="text-amber-400">{selectedLogoApp}</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Upload an image file from your computer or paste an external image link below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Image File from Device:</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAppLogoFileUpload}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer bg-[#080a0f] p-2 rounded-xl border border-white/10"
                  />
                </div>

                {/* Direct Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 block">
                    Or Paste Image URL:
                  </label>
                  <input
                    type="url"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or any image URL"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingLogo}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Save App Logo for {selectedLogoApp}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT SLIP MODAL                                         */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#121624] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-base">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span>{editingCodeId ? 'Edit Betting Slip' : 'Publish VIP Betting Slip'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* App selector buttons */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">
                  Select Bookmaker App <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {APPS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleSelectApp(a)}
                      className={`p-2 rounded-xl text-center text-xs font-bold transition-all border cursor-pointer ${
                        bettingApp === a
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[#090b10] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 block">
                  Title / Slip Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekend Mega 12-Match Accumulator"
                  required
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Secret Booking Code & Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">
                    Booking Code (Secret) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SB-892147X"
                    required
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono font-bold tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">
                    Total Odds <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="25.50"
                    required
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cost in Coins & Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">
                    Cost in Coins <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costCoins}
                    onChange={(e) => setCostCoins(e.target.value)}
                    placeholder="50"
                    required
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">Confidence / Win Rate %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={winRatePercent}
                    onChange={(e) => setWinRatePercent(e.target.value)}
                    placeholder="90"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Auto-Expiry Time Presets */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#080a0f] border border-white/10">
                <label className="font-semibold text-zinc-300 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Expiry & Self-Deletion Time:</span>
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    { label: '+3 Hours', h: 3 },
                    { label: '+6 Hours', h: 6 },
                    { label: '+12 Hours', h: 12 },
                    { label: '+24 Hours', h: 24 },
                    { label: '+48 Hours', h: 48 },
                    { label: 'Weekend (72h)', h: 72 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setExpiryHours(p.h)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-mono cursor-pointer border border-white/5"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-[#121520] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-zinc-500 block">
                  When this time expires, the slip will automatically delete itself from the store.
                </span>
              </div>

              {/* League & Match Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">League / Sport</label>
                  <input
                    type="text"
                    value={leagueOrSport}
                    onChange={(e) => setLeagueOrSport(e.target.value)}
                    placeholder="EPL / Champions League"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">Match Date / Round</label>
                  <input
                    type="text"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    placeholder="Weekend Primetime"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 block">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="active">Active (Available for purchase)</option>
                  <option value="won">Won (Verified Winner)</option>
                  <option value="lost">Lost</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 block">Analysis / Match Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about matches, goals, banker legs..."
                  rows={2}
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCodeId ? 'Update Slip' : 'Publish Slip'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
