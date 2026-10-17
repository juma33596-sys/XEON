import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Copy,
  Check,
  Share2,
  Gift,
  Coins,
  Gem,
  LogOut,
  History,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { getUserTransactions } from '../../services/walletService';
import { redeemCodeAtomic } from '../../services/redeemService';
import { getReferralStats } from '../../services/referralService';
import { Transaction } from '../../types';
import { TransactionRow } from '../common/TransactionRow';
import confetti from 'canvas-confetti';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateAdmin?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onNavigateAdmin }) => {
  const { userProfile, currentUser, isAdmin, logout } = useAuth();
  const { wallet } = useWallet();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'ledger' | 'referrals'>('profile');
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [referralStats, setReferralStats] = useState<{ totalReferred: number; friends: Array<{ username: string; date: string }> }>({
    totalReferred: 0,
    friends: [],
  });

  const referralLink = typeof window !== 'undefined' && userProfile?.referralCode
    ? `${window.location.origin}/?ref=${userProfile.referralCode}`
    : '';

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    if (activeTab === 'ledger') {
      setLoadingTx(true);
      getUserTransactions(currentUser.uid)
        .then((txs) => setTransactions(txs))
        .catch(() => {})
        .finally(() => setLoadingTx(false));
    } else if (activeTab === 'referrals' && userProfile?.referralCode) {
      getReferralStats(userProfile.referralCode).then((stats) => {
        setReferralStats(stats);
      });
    }
  }, [isOpen, activeTab, currentUser, userProfile]);

  if (!isOpen || !userProfile) return null;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setRedeemLoading(true);
    try {
      const result = await redeemCodeAtomic(userProfile.userId, promoCode.trim());
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      showToast(`Voucher claimed! Received +${result.amount} ${result.currency}!`, 'success');
      setPromoCode('');
    } catch (err: any) {
      showToast(err.message || 'Failed to claim promo code', 'error');
    } finally {
      setRedeemLoading(false);
    }
  };

  const memberSince = new Date(userProfile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#12151f] border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.username}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-zinc-100 font-mono">
                  {userProfile.username}
                </h3>
                {isAdmin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    <Shield className="w-3 h-3 text-rose-400" />
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">{userProfile.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-xl bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-white/5 bg-zinc-950/40 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Profile & Vault
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'referrals'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Referrals</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Ledger History</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'profile' && (
            <>
              {/* Balances overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-amber-500/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>Coins Balance</span>
                  </div>
                  <div className="text-xl font-mono font-black text-zinc-100">
                    {wallet?.coins?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-cyan-500/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                    <Gem className="w-4 h-4" />
                    <span>Diamonds Balance</span>
                  </div>
                  <div className="text-xl font-mono font-black text-zinc-100">
                    {wallet?.diamonds || 0}
                  </div>
                </div>
              </div>

              {/* Redeem Promo Code Section */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Gift className="w-4 h-4 text-violet-400" />
                  <span>Redeem Voucher or Promo Code</span>
                </div>
                <form onSubmit={handleRedeem} className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME1000"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs font-mono uppercase text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={redeemLoading || !promoCode.trim()}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-900/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {redeemLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Claim</span>
                  </button>
                </form>
                <p className="text-[11px] text-zinc-500">
                  Try promo code <code className="text-violet-300 font-mono">WELCOME1000</code> or <code className="text-violet-300 font-mono">NEXORA2026</code>.
                </p>
              </div>

              {/* User Metadata */}
              <div className="rounded-2xl bg-zinc-900/30 border border-white/5 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>User ID:</span>
                  <span className="font-mono text-zinc-300">{userProfile.userId.slice(0, 14)}...</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Member Since:</span>
                  <span className="text-zinc-300">{memberSince}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Account Status:</span>
                  <span className="text-emerald-400 font-semibold">Verified Member</span>
                </div>
                {isAdmin && onNavigateAdmin && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateAdmin();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span>Launch Admin Control Chamber</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 via-zinc-900/60 to-zinc-950 border border-violet-500/20">
                <h4 className="text-sm font-bold text-zinc-100 mb-1">
                  Invite Friends & Earn +500 Coins
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Share your unique referral link. Whenever a gaming friend signs up or uses your link, both of you immediately receive 500 Coins in your wallets!
                </p>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-white/10">
                  <span className="flex-1 text-xs font-mono text-zinc-300 truncate pl-1">
                    {referralLink}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400">Total Referrals:</span>
                  <span className="text-sm font-bold font-mono text-violet-400">
                    {referralStats.totalReferred} Gamers
                  </span>
                </div>
                {referralStats.friends.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {referralStats.friends.map((friend, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/30"
                      >
                        <span className="font-semibold text-zinc-200">{friend.username}</span>
                        <span className="text-zinc-500 text-[10px]">
                          {new Date(friend.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic mt-2">
                    No friends registered through your link yet. Share it on Discord or WhatsApp!
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-2">
              {loadingTx ? (
                <div className="py-8 flex justify-center text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No transactions recorded yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
