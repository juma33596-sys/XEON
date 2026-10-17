import React from 'react';
import {
  Sparkles,
  User,
  Shield,
  Coins,
  Gem,
  PlusCircle,
  ArrowLeftRight,
  LogOut,
  Library,
  Gamepad2,
  Layers,
  Flame,
  Globe,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useLanguage } from '../../context/LanguageContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { language, setLanguage, t } = useLanguage();

  const coins = wallet?.coins ?? 0;
  const diamonds = wallet?.diamonds ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0c0e14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('catalog')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-900/30">
            <div className="w-full h-full bg-[#0d0f17] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono">
              NEXORA
            </span>
            <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold -mt-1">
              Marketplace
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#141721] p-1 rounded-2xl border border-white/5">
          {[
            { id: 'catalog', label: t('nav_store'), icon: Layers },
            { id: 'topup', label: t('nav_topup'), icon: PlusCircle },
            { id: 'exchange', label: t('nav_exchange'), icon: ArrowLeftRight },
            { id: 'library', label: t('nav_library'), icon: Library },
            { id: 'casino', label: t('nav_casino'), icon: Flame },
            { id: 'hosting', label: t('nav_hosting') || 'Hosting', icon: Server },
            { id: 'xora', label: t('nav_xora'), icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/30'
                  : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        {/* Right Section: Wallets Pill + Language Switcher + Auth */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            title={language === 'en' ? 'Badili lugha kuwa Kiswahili' : 'Switch language to English'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141721] border border-white/10 hover:border-violet-500/30 text-xs text-zinc-300 font-mono font-bold transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-violet-400" />
            <span className="uppercase text-[11px]">{language}</span>
          </button>

          {currentUser ? (
            <>
              {/* Dual Wallet Display Pill */}
              <div
                onClick={() => onSelectTab('topup')}
                title="Click to Top Up or manage currency"
                className="flex items-center gap-1 p-1 rounded-2xl bg-[#141721] border border-white/10 hover:border-violet-500/40 cursor-pointer transition-all backdrop-blur-md"
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold font-mono">
                    {walletLoading ? '...' : coins.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300">
                  <Gem className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold font-mono">
                    {walletLoading ? '...' : diamonds}
                  </span>
                </div>
              </div>

              {/* Profile Avatar / Trigger */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-2xl bg-[#141721] border border-white/10 hover:border-violet-500/40 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-xl overflow-hidden bg-violet-600/30 flex items-center justify-center border border-violet-500/30">
                  {userProfile?.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-violet-300" />
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-zinc-200 max-w-[90px] truncate">
                  {userProfile?.username || 'User'}
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-900/30 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('nav_signin')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
