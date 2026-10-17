import React from 'react';
import {
  Layers,
  PlusCircle,
  ArrowLeftRight,
  Library,
  Flame,
  Shield,
  User,
  Sparkles,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { id: 'catalog', label: t('nav_store'), icon: Layers },
    { id: 'hosting', label: t('nav_hosting') || 'Hosting', icon: Server },
    { id: 'topup', label: t('nav_topup'), icon: PlusCircle },
    { id: 'casino', label: t('nav_casino'), icon: Flame },
    { id: 'xora', label: t('nav_xora'), icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e14]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-violet-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-violet-500/20 shadow-md shadow-violet-950/40' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {isAdmin ? (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentTab === 'admin'
                ? 'text-rose-400 font-bold'
                : 'text-rose-500/70 hover:text-rose-400'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                currentTab === 'admin' ? 'bg-rose-500/20' : ''
              }`}
            >
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Admin</span>
          </button>
        ) : (
          <button
            onClick={currentUser ? onOpenProfile : onOpenAuth}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentTab === 'profile' ? 'text-violet-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <div className="p-1 rounded-xl">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">
              {currentUser ? 'Profile' : 'Sign In'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
