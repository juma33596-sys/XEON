import React, { useState, useEffect } from 'react';
import {
  Coins,
  Gem,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Send,
  Loader2,
  History,
  ShieldCheck,
  X,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Pack, PaymentMethod, Topup } from '../../types';
import {
  getPacks,
  getPaymentMethods,
  submitTopupRequest,
  getUserTopups,
} from '../../services/topupService';
import { PackCard } from '../../components/common/PackCard';
import { PaymentMethodCard } from '../../components/common/PaymentMethodCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

interface TopupViewProps {
  onOpenAuth: () => void;
}

export const TopupView: React.FC<TopupViewProps> = ({ onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [userTopups, setUserTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'packs' | 'history'>('packs');
  const [currencyTab, setCurrencyTab] = useState<'coins' | 'diamonds'>('coins');

  // Checkout Modal State
  const [checkoutPack, setCheckoutPack] = useState<Pack | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [txReference, setTxReference] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Copy Feedback states
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pkList, mthList] = await Promise.all([getPacks(), getPaymentMethods()]);
        setPacks(pkList);
        setMethods(mthList.filter((m) => m.isActive));
        if (mthList.length > 0) {
          setSelectedMethod(mthList[0]);
        }
      } catch (err) {
        console.error('Failed to load topup data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (currentUser && activeTab === 'history') {
      getUserTopups(currentUser.uid).then(setUserTopups);
    }
  }, [currentUser, activeTab]);

  const filteredPacks = packs.filter((p) => p.currency === currencyTab);

  const handleStartPurchase = (pack: Pack) => {
    if (!currentUser) {
      showToast('Please sign in to top up your wallet.', 'info');
      onOpenAuth();
      return;
    }
    setCheckoutPack(pack);
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0]);
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    showToast(`Copied recipient number: ${num}`, 'info');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyAllDetails = () => {
    if (!selectedMethod || !checkoutPack) return;
    const text = `NEXORA PAYMENT:\nNetwork: ${selectedMethod.name}\nRecipient Number: ${selectedMethod.recipientNumber}\nRecipient Name: ${selectedMethod.recipientName}\nAmount Due: TSh ${checkoutPack.tshPrice.toLocaleString()}\nReward: ${checkoutPack.amount.toLocaleString()} ${checkoutPack.currency.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    showToast('Payment details copied to clipboard!', 'info');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSubmitTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !checkoutPack || !selectedMethod) return;

    if (!senderPhone.trim() || !txReference.trim()) {
      showToast('Please enter your sender phone number and SMS reference ID.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitTopupRequest({
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        packId: checkoutPack.id,
        rewardCurrency: checkoutPack.currency,
        rewardAmount: checkoutPack.amount,
        tshPrice: checkoutPack.tshPrice,
        paymentNetwork: selectedMethod.id,
        senderPhone: senderPhone.trim(),
        transactionReference: txReference.trim().toUpperCase(),
        proofUrl: proofNote.trim() || '',
      });

      showToast('Payment submitted! Awaiting administrator verification.', 'success');
      setSenderPhone('');
      setTxReference('');
      setProofNote('');
      setCheckoutPack(null);
      setActiveTab('history');
      const updated = await getUserTopups(currentUser.uid);
      setUserTopups(updated);
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
            <span>{t('topup_title')}</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">{t('topup_subtitle')}</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-2xl bg-[#141721] border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'packs'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('topup_coin_packs')} & {t('topup_diamond_packs')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t('topup_my_topups')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'packs' ? (
        <div className="space-y-6">
          {/* Currency Pill Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrencyTab('coins')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                currencyTab === 'coins'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/20 ring-2 ring-amber-500/20'
                  : 'bg-[#141721] border-white/10 text-zinc-400 hover:border-white/20'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{t('topup_coin_packs')}</span>
            </button>
            <button
              onClick={() => setCurrencyTab('diamonds')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                currencyTab === 'diamonds'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/20 ring-2 ring-cyan-500/20'
                  : 'bg-[#141721] border-white/10 text-zinc-400 hover:border-white/20'
              }`}
            >
              <Gem className="w-4 h-4 text-cyan-400" />
              <span>{t('topup_diamond_packs')}</span>
            </button>
          </div>

          {/* COMPACT STORE-SIZED TOPUP PACK CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {filteredPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onPurchase={handleStartPurchase}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Topups History View */
        <div className="space-y-3">
          {userTopups.length > 0 ? (
            userTopups.map((item) => {
              const isApproved = item.status === 'approved';
              const isPending = item.status === 'pending';
              const isRejected = item.status === 'rejected';

              return (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141721] border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : isPending
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-5 h-5" />}
                      {isPending && <Clock className="w-5 h-5" />}
                      {isRejected && <AlertCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100 font-mono">
                          +{item.rewardAmount.toLocaleString()}{' '}
                          {item.rewardCurrency === 'coins' ? t('coins') : t('diamonds')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.status === 'approved' && t('topup_status_approved')}
                          {item.status === 'pending' && t('topup_status_pending')}
                          {item.status === 'rejected' && t('topup_status_rejected')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span className="uppercase font-semibold text-violet-400">{item.paymentNetwork}</span>
                        <span>•</span>
                        <span>TSh {item.tshPrice.toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-mono">Ref: {item.transactionReference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-zinc-500">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    {item.adminNotes && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 italic">
                        Note: {item.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No Top-Up Submissions"
              description="You have not submitted any mobile money top-up requests yet."
              actionLabel="Browse Available Packs"
              onAction={() => setActiveTab('packs')}
            />
          )}
        </div>
      )}

      {/* CHECKOUT MODAL SCREEN */}
      {checkoutPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl my-6 rounded-3xl bg-[#121520] border border-white/15 p-6 md:p-8 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-100 font-mono tracking-tight">
                    {t('topup_checkout_title')}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Selected Pack: <strong className="text-zinc-200">{checkoutPack.title}</strong> (+{checkoutPack.amount.toLocaleString()} {checkoutPack.currency.toUpperCase()})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCheckoutPack(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-xl bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent Amount Due & Reward Box */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/50 border border-violet-500/20 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                  {t('topup_amount_due')}
                </span>
                <span className="text-2xl font-black font-mono text-zinc-100">
                  TSh {checkoutPack.tshPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                  Reward Unlocked
                </span>
                <span
                  className={`text-2xl font-black font-mono ${
                    checkoutPack.currency === 'coins' ? 'text-amber-400' : 'text-cyan-400'
                  }`}
                >
                  +{checkoutPack.amount.toLocaleString()} {checkoutPack.currency.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Network Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                {t('topup_select_network')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      selectedMethod?.id === method.id
                        ? 'bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/30'
                        : 'bg-zinc-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full mb-1.5"
                      style={{ backgroundColor: method.color }}
                    />
                    <div className="text-xs font-bold text-zinc-100 truncate">{method.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configured Recipient Information & Step-by-Step Instructions */}
            {selectedMethod && (
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                {/* Recipient Details & Quick Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900/80 border border-white/5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      {t('topup_recipient_number')}
                    </span>
                    <span className="text-base font-black font-mono text-zinc-100 block mt-0.5">
                      {selectedMethod.recipientNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      {t('topup_recipient_name')}
                    </span>
                    <span className="text-sm font-bold text-zinc-100 block mt-0.5">
                      {selectedMethod.recipientName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(selectedMethod.recipientNumber)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
                  >
                    {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{t('topup_copy_number')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyAllDetails}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{t('topup_copy_details')}</span>
                  </button>
                </div>

                {/* Numbered Payment Steps */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1 text-xs">
                  <span className="font-bold text-zinc-300 block mb-1">
                    {t('topup_payment_steps')}:
                  </span>
                  <div className="whitespace-pre-line text-zinc-300 leading-relaxed font-sans">
                    {language === 'sw' && selectedMethod.instructionsSw
                      ? selectedMethod.instructionsSw
                      : selectedMethod.instructions}
                  </div>
                </div>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitTopup} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    {t('topup_your_phone')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0755XXXXXX"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    {t('topup_reference')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9JA28X199"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  {t('topup_proof_note')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent from M-Pesa account name John"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {submitting ? 'Submitting...' : t('topup_submit_btn')}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
