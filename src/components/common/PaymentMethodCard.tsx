import React from 'react';
import { Smartphone, Check, Building2 } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(method)}
      className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
        isSelected
          ? 'bg-violet-950/40 border-violet-500 shadow-xl shadow-violet-900/20 ring-2 ring-violet-500/30'
          : 'bg-[#141721] border-white/10 hover:border-violet-500/30 hover:bg-[#181d2a]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
            style={{ backgroundColor: method.color || '#7c3aed' }}
          >
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100">{method.name}</h4>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Building2 className="w-3 h-3 text-zinc-500" />
              <span>{method.accountName}</span>
            </div>
          </div>
        </div>

        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-zinc-500">Paybill / Merchant:</span>
        <span className="font-mono font-bold text-zinc-200 bg-black/40 px-2 py-0.5 rounded border border-white/5">
          {method.paybillOrAccount}
        </span>
      </div>
    </div>
  );
};
