import React from 'react';
import { Coins, Gem, Download, Truck, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { ImageCarousel } from './ImageCarousel';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickBuy?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickBuy,
}) => {
  const isCoins = product.currency === 'coins';

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col justify-between rounded-2xl bg-[#141721] border border-white/10 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/20 cursor-pointer overflow-hidden p-2.5 sm:p-3.5"
    >
      <div>
        {/* Top media container with Carousel */}
        <div className="relative mb-2 sm:mb-3">
          <ImageCarousel
            images={product.imageUrls}
            alt={product.title}
            aspectRatio="aspect-[16/10]"
          />

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/90 text-white text-[9px] sm:text-[11px] font-semibold backdrop-blur-md shadow-md">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>FEATURED</span>
            </div>
          )}

          {/* Delivery Type Badge */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/60 text-zinc-300 text-[9px] sm:text-[11px] font-medium backdrop-blur-md border border-white/10">
            {product.deliveryType === 'download' ? (
              <>
                <Download className="w-2.5 h-2.5 text-cyan-400" />
                <span>Instant</span>
              </>
            ) : (
              <>
                <Truck className="w-2.5 h-2.5 text-amber-400" />
                <span>Manual</span>
              </>
            )}
          </div>
        </div>

        {/* Category & Platform */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1 px-0.5">
          <span className="text-violet-400 truncate">{product.category}</span>
          {product.platform && <span className="text-zinc-500 truncate">{product.platform}</span>}
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-base font-semibold text-zinc-100 group-hover:text-violet-300 transition-colors line-clamp-1 mb-1 px-0.5">
          {product.title}
        </h3>

        {/* Short description */}
        <p className="text-[10px] sm:text-xs text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2 sm:mb-3 px-0.5">
          {product.description}
        </p>
      </div>

      {/* Footer: Price Pill & Action */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5 sm:gap-2 mt-auto">
        <div
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold border truncate ${
            isCoins
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
          }`}
        >
          {isCoins ? (
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
          )}
          <span className="truncate">
            {product.price.toLocaleString()} {isCoins ? 'Coins' : 'Dia'}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickBuy) onQuickBuy(product);
            else onSelect(product);
          }}
          className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] sm:text-xs font-semibold shadow-md shadow-violet-900/30 transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <span>Buy</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  );
};
