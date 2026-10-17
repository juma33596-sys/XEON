import React, { useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  Library,
  Coins,
  Share2,
  HelpCircle,
} from 'lucide-react';
import { XoraAction } from '../../types/xora';

interface XoraActionButtonsProps {
  actions: XoraAction[];
  onNavigateInternal: (route: string) => void;
}

export const XoraActionButtons: React.FC<XoraActionButtonsProps> = ({
  actions,
  onNavigateInternal,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!actions || actions.length === 0) return null;

  const handleActionClick = (action: XoraAction, index: number) => {
    switch (action.type) {
      case 'navigate_internal':
        if (action.route) onNavigateInternal(action.route.replace(/^[/\\#]+/, ''));
        break;
      case 'open_product':
        onNavigateInternal('catalog');
        break;
      case 'open_user_library':
        onNavigateInternal('library');
        break;
      case 'open_wallet':
        onNavigateInternal('topup');
        break;
      case 'open_referrals':
        onNavigateInternal('topup');
        break;
      case 'copy_text':
        if (action.textToCopy) {
          navigator.clipboard.writeText(action.textToCopy);
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        }
        break;
      case 'open_external_link':
        if (action.url) {
          window.open(action.url, '_blank', 'noopener,noreferrer');
        }
        break;
      default:
        if (action.route) onNavigateInternal(action.route.replace(/^[/\\#]+/, ''));
        break;
    }
  };

  const getActionIcon = (action: XoraAction, index: number) => {
    if (action.type === 'copy_text') {
      return copiedIndex === index ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-zinc-400" />
      );
    }
    if (action.type === 'open_product') return <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />;
    if (action.type === 'open_user_library') return <Library className="w-3.5 h-3.5 text-cyan-400" />;
    if (action.type === 'open_wallet') return <Coins className="w-3.5 h-3.5 text-amber-400" />;
    if (action.type === 'open_referrals') return <Share2 className="w-3.5 h-3.5 text-pink-400" />;
    if (action.type === 'open_external_link') return <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />;
    return <ArrowRight className="w-3.5 h-3.5 text-violet-400" />;
  };

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
      {actions.map((act, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => handleActionClick(act, idx)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1a1f30] border border-violet-500/30 hover:border-violet-500/60 text-xs font-bold text-zinc-200 transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          {getActionIcon(act, idx)}
          <span>{act.label}</span>
        </button>
      ))}
    </div>
  );
};
