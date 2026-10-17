import React, { useState } from 'react';
import {
  Download,
  Key,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Coins,
  Gem,
} from 'lucide-react';
import { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  onDownload: (order: Order) => void;
  onViewKey: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onDownload,
  onViewKey,
}) => {
  const isCoins = order.currency === 'coins';
  const isDownload = order.deliveryType === 'download';
  const isCompleted = order.status === 'completed';

  const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141721] border border-white/10 hover:border-violet-500/30 transition-all">
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-white/5">
          <img
            src={order.productImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80'}
            alt={order.productTitle}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-zinc-500">#{order.id.slice(-8)}</span>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCompleted
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              <span className="uppercase">{order.status}</span>
            </div>
          </div>

          <h4 className="text-sm font-bold text-zinc-100 mb-1">{order.productTitle}</h4>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>{formattedDate}</span>
            <span>•</span>
            <div className="flex items-center gap-1 font-mono font-semibold">
              <span>{order.pricePaid.toLocaleString()}</span>
              {isCoins ? <Coins className="w-3 h-3 text-amber-400" /> : <Gem className="w-3 h-3 text-cyan-400" />}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
        {order.licenseKey && (
          <button
            onClick={() => onViewKey(order)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>License Key</span>
          </button>
        )}

        {isDownload ? (
          <button
            onClick={() => onDownload(order)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-900/30 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5" />
            <span>Manual Delivery</span>
          </div>
        )}
      </div>
    </div>
  );
};
