import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Gem,
  Gift,
  ShoppingBag,
  ArrowLeftRight,
} from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionRowProps {
  tx: Transaction;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ tx }) => {
  const isPositive = tx.amount > 0;
  const isCoins = tx.currency === 'coins';

  const getIcon = () => {
    switch (tx.type) {
      case 'topup':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'purchase':
        return <ShoppingBag className="w-4 h-4 text-rose-400" />;
      case 'exchange_debit':
      case 'exchange_credit':
        return <ArrowLeftRight className="w-4 h-4 text-violet-400" />;
      case 'referral_reward':
      case 'redeem_reward':
        return <Gift className="w-4 h-4 text-amber-400" />;
      default:
        return isPositive ? (
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
        );
    }
  };

  const formattedDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141721] border border-white/5 hover:border-white/15 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center border border-white/5">
          {getIcon()}
        </div>
        <div>
          <h5 className="text-xs font-semibold text-zinc-100">{tx.description}</h5>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span>{formattedDate}</span>
            {tx.referenceId && (
              <>
                <span>•</span>
                <span className="font-mono">{tx.referenceId.slice(0, 16)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
        <span className={isPositive ? 'text-emerald-400' : 'text-zinc-200'}>
          {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
        </span>
        {isCoins ? (
          <Coins className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Gem className="w-3.5 h-3.5 text-cyan-400" />
        )}
      </div>
    </div>
  );
};
