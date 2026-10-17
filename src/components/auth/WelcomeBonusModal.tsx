import React from 'react';
import { Sparkles, Coins, Gem, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface WelcomeBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeBonusModal: React.FC<WelcomeBonusModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#181d2c] via-[#121521] to-[#0d0f17] border border-violet-500/40 p-6 md:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-violet-600 to-cyan-400 p-[2px] mx-auto shadow-xl shadow-violet-900/40">
          <div className="w-full h-full bg-[#121521] rounded-[22px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
            OFFICIAL SIGN-UP REWARD
          </span>
          <h2 className="text-xl md:text-2xl font-black text-zinc-100 font-mono tracking-tight mt-3">
            {t('auth_welcome_title')}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {t('auth_welcome_desc')}
          </p>
        </div>

        {/* Dual Reward Pills */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/60 border border-white/5">
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Coins className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-black font-mono text-amber-300">+1,000</span>
            <span className="text-[10px] uppercase font-bold text-zinc-400">{t('coins')}</span>
          </div>

          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Gem className="w-6 h-6 text-cyan-400" />
            <span className="text-lg font-black font-mono text-cyan-300">+1</span>
            <span className="text-[10px] uppercase font-bold text-zinc-400">{t('diamonds')}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all active:scale-95 cursor-pointer"
        >
          <span>Claim & Start Exploring</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
