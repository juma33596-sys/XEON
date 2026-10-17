import React, { useState, useEffect } from 'react';
import {
  Library,
  Download,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import { Order } from '../../types';
import { getUserOrders, getAuthorizedDownload } from '../../services/purchaseService';
import { OrderCard } from '../../components/common/OrderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface LibraryViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onNavigateTab,
  onOpenAuth,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // License Key Modal state
  const [activeKeyOrder, setActiveKeyOrder] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserOrders(currentUser.uid)
      .then((ords) => setOrders(ords))
      .catch((err) => console.error('Failed to load library:', err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleDownload = async (order: Order) => {
    if (!currentUser) return;
    setDownloadingId(order.id);

    try {
      const authorized = await getAuthorizedDownload(currentUser.uid, order.productId, isAdmin);
      showToast('Download authorized! Commencing file delivery...', 'success');

      // Trigger safe download in new tab or element
      const link = document.createElement('a');
      link.href = authorized.downloadUrl;
      link.setAttribute('download', `${order.productTitle.replace(/\s+/g, '_')}.zip`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showToast(err.message || 'Download authorization failed', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    showToast('License key copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!currentUser) {
    return (
      <EmptyState
        icon={Library}
        title="Sign In to Access Your Library"
        description="Your purchased game mods, Discord bots, APKs, and tool licenses will appear here."
        actionLabel="Sign In Now"
        onAction={onOpenAuth}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
            <Library className="w-5 h-5 text-violet-400" />
            <span>MY DIGITAL LIBRARY</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Access your purchased digital files, installation instructions, and activation keys.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton count={3} type="row" />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onDownload={handleDownload}
              onViewKey={setActiveKeyOrder}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Library}
          title="Your Vault is Empty"
          description="Browse the Nexora marketplace to unlock VIP bots, game mods, and optimizer tools."
          actionLabel="Explore Catalog"
          onAction={() => onNavigateTab('catalog')}
        />
      )}

      {/* License Key Modal */}
      {activeKeyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#141721] border border-white/15 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">
                    Product License Key
                  </h3>
                  <p className="text-xs text-zinc-400 truncate max-w-[240px]">
                    {activeKeyOrder.productTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveKeyOrder(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Container */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-bold text-amber-300 tracking-wider select-all">
                {activeKeyOrder.licenseKey || 'NEX-PRO-ACTIVE-2026'}
              </span>
              <button
                onClick={() => handleCopyKey(activeKeyOrder.licenseKey || 'NEX-PRO-ACTIVE-2026')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-xs text-zinc-400 leading-relaxed p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="font-bold text-zinc-300 block mb-1">Activation Note:</span>
              Enter this key in the application registration wizard or command line console upon first launch.
            </div>

            <button
              onClick={() => setActiveKeyOrder(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
