import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Coins,
  Gem,
  Sparkles,
  X,
  Download,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { Product, SiteEvent } from '../../types';
import { getPublishedProducts } from '../../services/catalogService';
import { getSiteEvents } from '../../services/adminService';
import { purchaseProductAtomic } from '../../services/purchaseService';
import { ProductCard } from '../../components/common/ProductCard';
import { CategoryCard } from '../../components/common/CategoryCard';
import { EventCard } from '../../components/common/EventCard';
import { ImageCarousel } from '../../components/common/ImageCarousel';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { BettingCodesSection } from './BettingCodesSection';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import { AnnouncementSlider } from '../../components/common/AnnouncementSlider';

interface CatalogViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuth: () => void;
}

const CATEGORIES = [
  'All Products',
  '🎯 VIP Betting Codes',
  'PC Games',
  'Mobile Games',
  'Bots',
  'Special APKs',
  'Tools',
  'Other digital products',
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  onNavigateTab,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'coins' | 'diamonds'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'newest'>('featured');

  // Detail Modal & Purchase State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToBuy, setProductToBuy] = useState<Product | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prods, evts] = await Promise.all([
          getPublishedProducts(),
          getSiteEvents(),
        ]);
        setProducts(prods);
        setEvents(evts.filter((e) => e.isActive));
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        if (selectedCategory !== 'All Products' && item.category !== selectedCategory) {
          return false;
        }
        if (currencyFilter !== 'all' && item.currency !== currencyFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesDesc = item.description.toLowerCase().includes(q);
          const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        }
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [products, selectedCategory, currencyFilter, searchQuery, sortBy]);

  const handleInitiatePurchase = (product: Product) => {
    if (!currentUser) {
      showToast('Please sign in to purchase digital assets.', 'info');
      onOpenAuth();
      return;
    }

    const isCoins = product.currency === 'coins';
    const balance = isCoins ? wallet?.coins || 0 : wallet?.diamonds || 0;

    if (balance < product.price) {
      showToast(
        `Insufficient ${isCoins ? 'Coins' : 'Diamonds'}. You need ${product.price.toLocaleString()}, but have ${balance.toLocaleString()}.`,
        'error'
      );
      setProductToBuy(null);
      return;
    }

    setProductToBuy(product);
  };

  const handleConfirmPurchase = async () => {
    if (!productToBuy || !currentUser) return;

    setIsPurchasing(true);
    try {
      const order = await purchaseProductAtomic(currentUser.uid, productToBuy.id);
      await refreshWallet();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast(`Successfully purchased "${productToBuy.title}"! Added to My Library.`, 'success');
      setProductToBuy(null);
      setSelectedProduct(null);
      onNavigateTab('library');
    } catch (err: any) {
      showToast(err.message || 'Purchase failed', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const activeEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Featured Banner / Event */}
      {activeEvent && (
        <div className="mb-4">
          <EventCard
            event={activeEvent}
            onActionClick={(url) => {
              if (url?.startsWith('/')) {
                onNavigateTab(url.replace('/', ''));
              }
            }}
          />
        </div>
      )}

      {/* Search & Currency Toggle Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mods, bots, APKs, tools..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#141721] border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Currency Filter & Sort Selector */}
        <div className="flex items-center gap-2">
          {/* Currency Pill Selector */}
          <div className="flex items-center p-1 rounded-2xl bg-[#141721] border border-white/10 text-xs">
            <button
              onClick={() => setCurrencyFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                currencyFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCurrencyFilter('coins')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                currencyFilter === 'coins'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Coins</span>
            </button>
            <button
              onClick={() => setCurrencyFilter('diamonds')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                currencyFilter === 'diamonds'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              <span>Diamonds</span>
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-[#141721] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest Releases</option>
          </select>
        </div>
      </div>

      {/* Dynamic Sliding Announcements (Auto-Advance & Auto-Disappear Timers) */}
      <AnnouncementSlider
        onNavigateTab={(tab, payload) => {
          if (tab === 'catalog' && payload?.category) {
            setSelectedCategory(payload.category);
            window.scrollTo({ top: 350, behavior: 'smooth' });
          } else {
            onNavigateTab(tab);
          }
        }}
      />

      {/* Category Pills List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat}
            name={cat}
            isSelected={selectedCategory === cat}
            onSelect={setSelectedCategory}
          />
        ))}
      </div>

      {/* RENDER BETTING CODES IF CATEGORY SELECTED */}
      {selectedCategory === '🎯 VIP Betting Codes' ? (
        <BettingCodesSection
          onOpenAuth={onOpenAuth}
          onNavigateTab={onNavigateTab}
        />
      ) : (
        <>
          {/* Products Grid (2-Column Mobile Grid) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <LoadingSkeleton count={8} type="card" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={setSelectedProduct}
                  onQuickBuy={handleInitiatePurchase}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No digital assets found"
              description="Try broadening your search query or switching categories."
              actionLabel="Clear Filters"
              onAction={() => {
                setSelectedCategory('All Products');
                setSearchQuery('');
                setCurrencyFilter('all');
              }}
            />
          )}
        </>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#12151f] border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-violet-400">
                  {selectedProduct.category}
                </span>
                {selectedProduct.version && (
                  <span className="text-xs font-mono text-zinc-500">
                    {selectedProduct.version}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-xl bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Carousel */}
              <ImageCarousel
                images={selectedProduct.imageUrls}
                alt={selectedProduct.title}
                aspectRatio="aspect-[16/9]"
              />

              <div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">
                  {selectedProduct.title}
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Tags & System Specs */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Delivery</span>
                  <span className="text-zinc-200 font-semibold flex items-center gap-1 mt-0.5">
                    {selectedProduct.deliveryType === 'download' ? (
                      <>
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Instant Verified</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Manual Dispatch</span>
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Platform</span>
                  <span className="text-zinc-200 font-semibold block mt-0.5">
                    {selectedProduct.platform || 'Cross-Platform'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Download Size</span>
                  <span className="text-zinc-200 font-semibold block mt-0.5">
                    {selectedProduct.downloadSize || 'Optimized Archive'}
                  </span>
                </div>
              </div>

              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-white/5 text-[11px] font-medium text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-white/10 bg-zinc-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Total Price:</span>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border ${
                    selectedProduct.currency === 'coins'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {selectedProduct.currency === 'coins' ? (
                    <Coins className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Gem className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>
                    {selectedProduct.price.toLocaleString()}{' '}
                    {selectedProduct.currency === 'coins' ? 'Coins' : 'Diamonds'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleInitiatePurchase(selectedProduct)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all active:scale-95 cursor-pointer"
              >
                <span>Purchase Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Dialog */}
      {productToBuy && (
        <ConfirmDialog
          isOpen={!!productToBuy}
          title="Confirm Asset Purchase"
          message={`Are you sure you want to purchase "${productToBuy.title}"?`}
          confirmLabel={`Buy for ${productToBuy.price.toLocaleString()} ${productToBuy.currency}`}
          isLoading={isPurchasing}
          details={[
            { label: 'Product Item', value: productToBuy.title },
            {
              label: 'Price',
              value: `${productToBuy.price.toLocaleString()} ${productToBuy.currency}`,
            },
            {
              label: 'Your Balance',
              value: `${
                productToBuy.currency === 'coins'
                  ? (wallet?.coins || 0).toLocaleString() + ' Coins'
                  : (wallet?.diamonds || 0) + ' Diamonds'
              }`,
            },
            {
              label: 'Balance After',
              value: `${
                productToBuy.currency === 'coins'
                  ? ((wallet?.coins || 0) - productToBuy.price).toLocaleString() + ' Coins'
                  : ((wallet?.diamonds || 0) - productToBuy.price) + ' Diamonds'
              }`,
            },
            {
              label: 'Delivery Type',
              value: productToBuy.deliveryType === 'download' ? 'Instant Authorized Download' : 'Manual Dispatch by Admin',
            },
          ]}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setProductToBuy(null)}
        />
      )}
    </div>
  );
};
