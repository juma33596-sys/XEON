import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Coins,
  Gem,
  Smartphone,
  Tag,
  ArrowLeftRight,
  Gift,
  FileText,
  Calendar,
  Eye,
  Loader2,
  Check,
  AlertTriangle,
  RefreshCw,
  Users,
  CreditCard,
  Settings,
  Share2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Search,
  Lock,
  Menu,
  X,
  Store,
  DollarSign,
  KeyRound,
  Sparkles,
  Server,
  Ticket,
  Crown,
  Dices,
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../../services/authService';
import {
  Product,
  Pack,
  PaymentMethod,
  ExchangeRateConfig,
  Topup,
  Order,
  RedeemCode,
  AuditLog,
  SiteEvent,
  UserProfile,
  Category,
  SiteSettings,
  Role,
} from '../../types';
import {
  getAllProductsAdmin,
  saveProduct,
  deleteProduct,
} from '../../services/catalogService';
import {
  getAllTopupsAdmin,
  approveTopupAtomic,
  rejectTopup,
  getPacks,
} from '../../services/topupService';
import {
  savePack,
  deletePack,
  getAuditLogs,
  logAdminAction,
  getSiteEvents,
  saveSiteEvent,
  deleteSiteEvent,
  getAllUsers,
  updateUserRole,
  getCategories,
  saveCategory,
  deleteCategory,
  getSiteSettings,
  saveSiteSettings,
  getPaymentMethodsAdmin,
  savePaymentMethod,
  deletePaymentMethod,
  verifyAdminAuthorization,
  grantAdminToEmail,
  revokeAdminEmail,
  getAuthorizedAdminEmails,
  AuthorizedAdminEmail,
} from '../../services/adminService';
import {
  getExchangeRate,
  updateExchangeRate,
} from '../../services/exchangeService';
import {
  getAllRedeemCodes,
  saveRedeemCode,
} from '../../services/redeemService';
import { getAllOrdersAdmin } from '../../services/purchaseService';
import {
  uploadImageFile,
  getStoredImgbbKey,
  setStoredImgbbKey,
  DEFAULT_IMGBB_API_KEY,
} from '../../services/imageUploadService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { XoraAdminSection } from './XoraAdminSection';
import { HostingAdminSection } from './HostingAdminSection';
import { BettingCodesAdminSection } from './BettingCodesAdminSection';
import { CasinoAdminSection } from './CasinoAdminSection';

type AdminSection =
  | 'overview'
  | 'xora'
  | 'hosting'
  | 'betting_codes'
  | 'casino'
  | 'products'
  | 'categories'
  | 'topups'
  | 'orders'
  | 'users'
  | 'packs'
  | 'exchange'
  | 'payments'
  | 'referrals'
  | 'codes'
  | 'events'
  | 'audit'
  | 'settings';

interface AdminViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigateTab }) => {
  const { currentUser, userProfile, isAdmin, loginWithGoogleProvider } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Data states
  const [topups, setTopups] = useState<Topup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [rateConfig, setRateConfig] = useState<ExchangeRateConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [authorizedAdminEmails, setAuthorizedAdminEmails] = useState<AuthorizedAdminEmail[]>([]);
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [grantAdminLoading, setGrantAdminLoading] = useState(false);

  // Search & Filter
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals & Forms
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewTopup, setReviewTopup] = useState<Topup | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Product Editor Modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingSecretUrl, setEditingSecretUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Category Editor Modal
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Pack Editor Modal
  const [editingPack, setEditingPack] = useState<Partial<Pack> | null>(null);

  // Redeem Code Editor Modal
  const [editingCode, setEditingCode] = useState<Partial<RedeemCode> | null>(null);

  // Event Editor Modal
  const [editingEvent, setEditingEvent] = useState<Partial<SiteEvent> | null>(null);

  // Payment Method Modal
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);

  // Verify Admin Authorization
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (!currentUser) {
        if (isMounted) setIsAuthorized(false);
        return;
      }

      const cleanEmail = (currentUser.email || '').toLowerCase().trim();
      if (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() || isAdmin) {
        if (isMounted) setIsAuthorized(true);
      }

      try {
        const authorized = await verifyAdminAuthorization(currentUser);
        if (isMounted) {
          setIsAuthorized(authorized || isAdmin || cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase());
        }
      } catch (err) {
        if (isMounted) setIsAuthorized(isAdmin || cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase());
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [currentUser, isAdmin]);

  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [
        tps,
        prods,
        cats,
        pks,
        mths,
        ords,
        usrs,
        rdc,
        rates,
        logs,
        evts,
        settings,
        adminEmails,
      ] = await Promise.all([
        getAllTopupsAdmin(),
        getAllProductsAdmin(),
        getCategories(),
        getPacks(),
        getPaymentMethodsAdmin(),
        getAllOrdersAdmin(),
        getAllUsers(),
        getAllRedeemCodes(),
        getExchangeRate(),
        getAuditLogs(),
        getSiteEvents(),
        getSiteSettings(),
        getAuthorizedAdminEmails(),
      ]);

      setTopups(tps);
      setProducts(prods);
      setCategories(cats);
      setPacks(pks);
      setMethods(mths);
      setOrders(ords);
      setUsers(usrs);
      setRedeemCodes(rdc);
      setRateConfig(rates);
      setAuditLogs(logs);
      setEvents(evts);
      setSiteSettings(settings);
      setAuthorizedAdminEmails(adminEmails);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      refreshAllData();
    }
  }, [isAuthorized]);

  // Handle Image Upload using ImgBB / Storage
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    setUploadingImage(true);
    setUploadProgress(10);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadImageFile(
          file,
          (pct) => setUploadProgress(Math.round(((i + pct / 100) / files.length) * 100)),
          siteSettings?.imgbbApiKey
        );
        uploadedUrls.push(result.url);
        showToast(`Uploaded ${file.name} via ${result.provider}`, 'success');
      } catch (err: any) {
        showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }

    if (uploadedUrls.length > 0) {
      const existing = editingProduct.imageUrls || [];
      setEditingProduct({
        ...editingProduct,
        imageUrls: [...existing, ...uploadedUrls],
      });
    }

    setUploadingImage(false);
    setUploadProgress(0);
    // Reset file input
    e.target.value = '';
  };

  // 1. Topup Actions
  const handleApproveTopup = async (topup: Topup) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await approveTopupAtomic(topup.id, currentUser.uid, 'Payment verified by administrator');
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'APPROVE_TOPUP',
        topup.id,
        `Approved TSh ${topup.tshPrice.toLocaleString()} for +${topup.rewardAmount.toLocaleString()} ${topup.rewardCurrency} (User: ${topup.userId})`
      );
      showToast('Top-up verified! Wallet credited atomically.', 'success');
      setReviewTopup(null);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTopup = async (topup: Topup) => {
    if (!currentUser) return;
    if (!rejectReason.trim()) {
      showToast('Please specify a rejection reason.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await rejectTopup(topup.id, currentUser.uid, rejectReason.trim());
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'REJECT_TOPUP',
        topup.id,
        `Rejected top-up: ${rejectReason.trim()}`
      );
      showToast('Top-up request rejected.', 'info');
      setReviewTopup(null);
      setRejectReason('');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title || !currentUser) return;

    setActionLoading(true);
    try {
      const prodId = editingProduct.id || `prod_${Date.now()}`;
      const slug =
        editingProduct.slug ||
        editingProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const productObj: Product = {
        id: prodId,
        title: editingProduct.title,
        slug,
        description: editingProduct.description || '',
        category: editingProduct.category || 'PC Games',
        tags: editingProduct.tags || ['Gaming'],
        imageUrls:
          editingProduct.imageUrls && editingProduct.imageUrls.length > 0
            ? editingProduct.imageUrls
            : [
                'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
              ],
        price: Number(editingProduct.price) || 1000,
        currency: editingProduct.currency || 'coins',
        status: editingProduct.status || 'published',
        deliveryType: editingProduct.deliveryType || 'download',
        featured: Boolean(editingProduct.featured),
        version: editingProduct.version || 'v1.0.0',
        platform: editingProduct.platform || 'Cross-Platform',
        downloadSize: editingProduct.downloadSize || '100 MB',
        createdAt: editingProduct.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveProduct(
        productObj,
        editingSecretUrl
          ? {
              productId: prodId,
              downloadUrl: editingSecretUrl,
              fileSize: productObj.downloadSize,
              instructions: 'Installation setup script enclosed.',
              licenseKeyTemplate: `NEX-${Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()}-2026`,
            }
          : undefined
      );

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'SAVE_PRODUCT',
        prodId,
        `Saved product "${productObj.title}"`
      );

      showToast('Product saved successfully!', 'success');
      setEditingProduct(null);
      setEditingSecretUrl('');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await deleteProduct(id);
      showToast('Product deleted.', 'info');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // 3. Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name || !currentUser) return;
    try {
      const catId = editingCategory.id || `cat_${editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const catObj: Category = {
        id: catId,
        name: editingCategory.name,
        description: editingCategory.description || '',
        icon: editingCategory.icon || 'Tag',
      };
      await saveCategory(catObj, currentUser);
      showToast('Category saved successfully!', 'success');
      setEditingCategory(null);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCategory(id, currentUser || undefined);
      showToast('Category removed.', 'info');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  // 4. User Role Updates
  const handleToggleUserRole = async (user: UserProfile) => {
    if (!currentUser) return;
    const nextRole: Role = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to switch ${user.username || user.email} to ${nextRole.toUpperCase()}?`)) {
      return;
    }
    try {
      await updateUserRole(user.userId, nextRole, currentUser);
      showToast(`User role updated to ${nextRole.toUpperCase()}`, 'success');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to change role', 'error');
    }
  };

  const handleGrantAdminPower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmailInput.trim() || !currentUser) return;
    setGrantAdminLoading(true);
    try {
      await grantAdminToEmail(newAdminEmailInput.trim(), currentUser);
      showToast(`Admin privileges granted to ${newAdminEmailInput.trim()}`, 'success');
      setNewAdminEmailInput('');
      const updatedList = await getAuthorizedAdminEmails();
      setAuthorizedAdminEmails(updatedList);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to grant admin privileges', 'error');
    } finally {
      setGrantAdminLoading(false);
    }
  };

  const handleRevokeAdminPower = async (email: string) => {
    if (!currentUser) return;
    if (!confirm(`Are you sure you want to revoke administrative clearance from ${email}?`)) return;
    try {
      await revokeAdminEmail(email, currentUser);
      showToast(`Administrative clearance revoked from ${email}`, 'info');
      const updatedList = await getAuthorizedAdminEmails();
      setAuthorizedAdminEmails(updatedList);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke admin privileges', 'error');
    }
  };

  // 5. Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings || !currentUser) return;
    try {
      await saveSiteSettings(siteSettings, currentUser);
      if (siteSettings.imgbbApiKey) {
        setStoredImgbbKey(siteSettings.imgbbApiKey);
      }
      showToast('Site settings updated successfully!', 'success');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  // 6. Packs
  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPack?.title || !currentUser) return;
    try {
      const packId = editingPack.id || `pack_${Date.now()}`;
      const packObj: Pack = {
        id: packId,
        title: editingPack.title,
        currency: editingPack.currency || 'coins',
        amount: Number(editingPack.amount) || 1000,
        tshPrice: Number(editingPack.tshPrice) || 500,
        popular: Boolean(editingPack.popular),
        badge: editingPack.badge || '',
        description: editingPack.description || '',
      };
      await savePack(packObj);
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'SAVE_PACK',
        packId,
        `Configured pack "${packObj.title}"`
      );
      showToast('Pack configured successfully!', 'success');
      setEditingPack(null);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save pack', 'error');
    }
  };

  // 7. Redeem Code
  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode?.code || !currentUser) return;
    try {
      const codeObj: RedeemCode = {
        code: editingCode.code.trim().toUpperCase(),
        rewardCurrency: editingCode.rewardCurrency || 'coins',
        rewardAmount: Number(editingCode.rewardAmount) || 500,
        maxUses: Number(editingCode.maxUses) || 100,
        currentUses: Number(editingCode.currentUses) || 0,
        expiresAt: editingCode.expiresAt || '2028-12-31T23:59:59Z',
        isActive: editingCode.isActive !== undefined ? editingCode.isActive : true,
      };
      await saveRedeemCode(codeObj);
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'SAVE_CODE',
        codeObj.code,
        `Voucher code "${codeObj.code}" saved`
      );
      showToast('Voucher code saved!', 'success');
      setEditingCode(null);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save code', 'error');
    }
  };

  // 8. Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title || !currentUser) return;
    try {
      const eventId = editingEvent.id || `evt_${Date.now()}`;
      const eventObj: SiteEvent = {
        id: eventId,
        title: editingEvent.title,
        description: editingEvent.description || '',
        bannerUrl: editingEvent.bannerUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        actionUrl: editingEvent.actionUrl || '',
        badge: editingEvent.badge || 'PROMO',
        isActive: editingEvent.isActive !== undefined ? editingEvent.isActive : true,
      };
      await saveSiteEvent(eventObj, currentUser);
      showToast('Site event updated!', 'success');
      setEditingEvent(null);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save event', 'error');
    }
  };

  // 9. Payment Method
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod?.name || !editingMethod?.id || !currentUser) return;
    try {
      const mthObj: PaymentMethod = {
        id: editingMethod.id as any,
        name: editingMethod.name,
        paybillOrAccount: editingMethod.paybillOrAccount || '',
        accountName: editingMethod.accountName || '',
        recipientNumber: editingMethod.recipientNumber || '',
        recipientName: editingMethod.recipientName || '',
        instructions: editingMethod.instructions || '',
        instructionsSw: editingMethod.instructionsSw || '',
        color: editingMethod.color || '#3b82f6',
        isActive: editingMethod.isActive !== undefined ? editingMethod.isActive : true,
      };
      await savePaymentMethod(mthObj, currentUser);
      showToast('Payment method saved!', 'success');
      setEditingMethod(null);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save method', 'error');
    }
  };

  const pendingTopupsCount = topups.filter((t) => t.status === 'pending').length;

  // ACCESS DENIED / UNAUTHORIZED SCREEN
  if (isAuthorized === false) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#141721] border border-rose-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-100 font-mono tracking-tight">
              ADMIN CLEARANCE REQUIRED
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The Nexora Administrative Terminal is restricted to verified administrators.
              {currentUser ? (
                <>
                  <br />
                  Signed in as: <strong className="text-zinc-200">{currentUser.email}</strong>
                  <br />
                  <span className="text-rose-400 font-semibold">
                    Current account role: {userProfile?.role || 'user'} (Unauthorized)
                  </span>
                </>
              ) : (
                ' You must authenticate with an authorized administrator account to proceed.'
              )}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {!currentUser ? (
              <button
                onClick={() => loginWithGoogleProvider()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all active:scale-95 cursor-pointer"
              >
                Sign In with Google Admin Account
              </button>
            ) : (
              <button
                onClick={() => loginWithGoogleProvider()}
                className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 transition-all cursor-pointer"
              >
                Switch Account
              </button>
            )}

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('catalog')}
                className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Return to Marketplace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminSection; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'xora', label: 'Xora AI Assistant', icon: Sparkles },
    { id: 'hosting', label: 'Hosting & Deployments', icon: Server },
    { id: 'betting_codes', label: 'VIP Betting Codes', icon: Ticket },
    { id: 'casino', label: 'Casino Games & Covers', icon: Dices },
    { id: 'topups', label: 'Top-Up Reviews', icon: Smartphone, badge: pendingTopupsCount },
    { id: 'products', label: 'Products', icon: Layers, badge: products.length },
    { id: 'categories', label: 'Categories', icon: Tag, badge: categories.length },
    { id: 'orders', label: 'Orders', icon: FileText, badge: orders.length },
    { id: 'users', label: 'Users', icon: Users, badge: users.length },
    { id: 'packs', label: 'Wallet Packs', icon: Coins, badge: packs.length },
    { id: 'exchange', label: 'Exchange Settings', icon: ArrowLeftRight },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard, badge: methods.length },
    { id: 'referrals', label: 'Referral Settings', icon: Share2 },
    { id: 'codes', label: 'Redeem Codes', icon: Gift, badge: redeemCodes.length },
    { id: 'events', label: 'Events & Banners', icon: Calendar, badge: events.length },
    { id: 'audit', label: 'Audit Logs', icon: KeyRound, badge: auditLogs.length },
    { id: 'settings', label: 'Site Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Admin Shell Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-[#161a29] to-[#12151f] border border-rose-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-100 font-mono tracking-tight">
                ADMIN CONTROL CHAMBER
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Authorized admin: <strong className="text-zinc-200">{currentUser?.email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('catalog')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-violet-400" />
              <span>Back to Store</span>
            </button>
          )}

          <button
            onClick={refreshAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </header>

      {/* Main Shell: Left Sidebar + Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`md:col-span-3 lg:col-span-3 space-y-1 ${
            mobileMenuOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="p-3 rounded-3xl bg-[#141721] border border-white/10 space-y-1 shadow-xl">
            <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Navigation
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        active
                          ? 'bg-rose-900/60 text-white'
                          : item.id === 'topups' && item.badge > 0
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="md:col-span-9 lg:col-span-9 space-y-6">
          {/* SECTION: XORA AI */}
          {activeSection === 'xora' && <XoraAdminSection />}

          {/* SECTION: NEXORA HOSTING */}
          {activeSection === 'hosting' && <HostingAdminSection />}

          {/* SECTION: VIP BETTING CODES */}
          {activeSection === 'betting_codes' && <BettingCodesAdminSection />}

          {/* SECTION: CASINO GAMES & COVERS */}
          {activeSection === 'casino' && <CasinoAdminSection />}

          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#141721] border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Pending Top-Ups
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-mono block">
                    {pendingTopupsCount}
                  </span>
                  <span className="text-[10px] text-zinc-500">Requires verification</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141721] border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Orders Placed
                  </span>
                  <span className="text-2xl font-black text-cyan-400 font-mono block">
                    {orders.length}
                  </span>
                  <span className="text-[10px] text-zinc-500">Total customer orders</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141721] border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Catalog Items
                  </span>
                  <span className="text-2xl font-black text-violet-400 font-mono block">
                    {products.length}
                  </span>
                  <span className="text-[10px] text-zinc-500">In {categories.length} categories</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141721] border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Registered Users
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono block">
                    {users.length}
                  </span>
                  <span className="text-[10px] text-zinc-500">Live gamer profiles</span>
                </div>
              </div>

              {/* Alert if Pending Reviews */}
              {pendingTopupsCount > 0 && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">
                        {pendingTopupsCount} mobile money transaction(s) pending review!
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Verify incoming carrier SMS codes and approve wallet credits atomically.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('topups')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow cursor-pointer shrink-0"
                  >
                    Open Top-Up Queue
                  </button>
                </div>
              )}

              {/* Recent Orders Preview */}
              <div className="p-5 rounded-3xl bg-[#141721] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-100">Recent Customer Orders</h3>
                  <button
                    onClick={() => setActiveSection('orders')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 italic">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-200">{order.productTitle}</span>
                          <span className="text-[10px] text-zinc-500 block">
                            Order: {order.id} • {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400">
                            {order.pricePaid.toLocaleString()} {order.currency}
                          </span>
                          <span className="text-[10px] text-zinc-400 block capitalize">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: PRODUCTS */}
          {activeSection === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      title: '',
                      category: categories[0]?.name || 'PC Games',
                      price: 1000,
                      currency: 'coins',
                      deliveryType: 'download',
                      status: 'published',
                      imageUrls: [],
                      tags: ['Gaming'],
                    });
                    setEditingSecretUrl('');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#141721] border border-white/10 text-zinc-500 text-xs">
                  No products in the catalog yet. Click &quot;Add Product&quot; to seed or create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products
                    .filter((p) =>
                      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-[#141721] border border-white/10 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="w-full h-32 rounded-xl overflow-hidden bg-black/40 border border-white/5 relative">
                            {p.imageUrls && p.imageUrls.length > 0 ? (
                              <img
                                src={p.imageUrls[0]}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                            )}
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-zinc-300">
                              {p.imageUrls?.length || 0} image(s)
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-rose-400 font-bold uppercase text-[10px]">
                                {p.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'published'
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-zinc-400 bg-zinc-800'
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-100 line-clamp-1">{p.title}</h4>
                            <p className="text-xs text-zinc-400 font-mono mt-1">
                              {p.price.toLocaleString()} {p.currency}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditingSecretUrl('');
                            }}
                            className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white font-semibold cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-rose-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: CATEGORIES */}
          {activeSection === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Category Management</h3>
                  <p className="text-xs text-zinc-400">
                    Configure store sections (PC Games, Mobile Games, Bots, Special APKs, Tools, etc.)
                  </p>
                </div>
                <button
                  onClick={() => setEditingCategory({ name: '', description: '', icon: 'Tag' })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-[#141721] border border-white/10 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                          <Tag className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-100">{cat.name}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-rose-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: TOP-UP REVIEWS */}
          {activeSection === 'topups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Mobile Money Verification Queue
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Review customer transactions and approve coin/diamond credits atomically.
                  </p>
                </div>
              </div>

              {topups.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#141721] border border-white/10 text-zinc-500 text-xs">
                  No top-up transactions in history.
                </div>
              ) : (
                <div className="space-y-3">
                  {topups.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141721] border border-white/10"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-300">
                            Ref: {item.transactionReference}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                          <span>
                            Sender: <strong className="text-zinc-200">{item.senderPhone}</strong>
                          </span>
                          <span>•</span>
                          <span className="uppercase text-rose-400 font-bold">{item.paymentNetwork}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-zinc-100">
                            TSh {item.tshPrice.toLocaleString()}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">
                            +{item.rewardAmount.toLocaleString()} {item.rewardCurrency}
                          </span>
                        </div>
                        {item.proofUrl && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <span>Proof:</span>
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 underline truncate max-w-xs"
                            >
                              {item.proofUrl}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        {item.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveTopup(item)}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Credit</span>
                            </button>

                            <button
                              onClick={() => setReviewTopup(item)}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 transition-all cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500">
                            Reviewed:{' '}
                            {item.reviewedAt
                              ? new Date(item.reviewedAt).toLocaleDateString()
                              : 'Yes'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: ORDERS */}
          {activeSection === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Customer Purchase Orders</h3>
                  <p className="text-xs text-zinc-400">
                    Track all fulfilled purchases, license codes, and authorized downloads.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#141721] border border-white/10 text-zinc-500 text-xs">
                  No orders found.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-[#141721] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-100 text-sm">{ord.productTitle}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-zinc-400 flex items-center gap-2 flex-wrap">
                          <span>User ID: <strong className="text-zinc-200">{ord.userId}</strong></span>
                          <span>•</span>
                          <span>Paid: <strong className="text-zinc-100 font-mono">{ord.pricePaid.toLocaleString()} {ord.currency}</strong></span>
                          <span>•</span>
                          <span>{new Date(ord.createdAt).toLocaleString()}</span>
                        </div>
                        {ord.licenseKey && (
                          <div className="text-[11px] font-mono text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20 w-fit">
                            License: {ord.licenseKey}
                          </div>
                        )}
                      </div>

                      {ord.downloadUrl && (
                        <a
                          href={ord.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <span>Authorized Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: USERS & ADMIN CLEARANCES */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              {/* ADMIN CLEARANCE & DELEGATION CHAMBER */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#181528] via-[#141721] to-[#12141c] border border-rose-500/30 shadow-xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                        <span>Admin Clearance & Delegated Powers</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold uppercase border border-rose-500/30">
                          Authority Hub
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Primary Super Admin <strong className="text-rose-300 font-mono">{PRIMARY_ADMIN_EMAIL}</strong> and authorized administrators can grant or revoke full admin privileges to any email address.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grant Admin Form */}
                <form onSubmit={handleGrantAdminPower} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      placeholder="Enter email to grant admin powers (e.g. partner@example.com)..."
                      value={newAdminEmailInput}
                      onChange={(e) => setNewAdminEmailInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={grantAdminLoading || !newAdminEmailInput.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {grantAdminLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 text-rose-200" />
                    )}
                    <span>Grant Admin Powers</span>
                  </button>
                </form>
                <p className="text-[11px] text-zinc-400">
                  ⚡ <strong>Automatic Clearance:</strong> When this email logs in or signs up via Google or Email/Password, they will automatically be granted full administrator access and can also grant admin powers to others.
                </p>

                {/* List of Authorized Admin Accounts */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Active Authorized Administrator Clearances ({authorizedAdminEmails.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {authorizedAdminEmails.map((authAdmin) => {
                      const isSuper = authAdmin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
                      return (
                        <div
                          key={authAdmin.email}
                          className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-xs border transition-all ${
                            isSuper
                              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                              : 'bg-zinc-900/60 border-white/10 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isSuper ? (
                              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-zinc-100 truncate">
                                  {authAdmin.email}
                                </span>
                                {isSuper ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                                    Primary Super Admin
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                                    Authorized Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 block truncate">
                                Granted by: {authAdmin.grantedBy}
                              </span>
                            </div>
                          </div>

                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleRevokeAdminPower(authAdmin.email)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* REGISTERED USERS LIST */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">Registered Gamer Accounts</h3>
                    <p className="text-xs text-zinc-400">
                      Manage roles, inspect referrals, and maintain platform security.
                    </p>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#141721] border border-white/10 text-zinc-500 text-xs">
                    No users recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users
                      .filter(
                        (u) =>
                          u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.userId.includes(userSearch)
                      )
                      .map((usr) => (
                        <div
                          key={usr.userId}
                          className="p-4 rounded-2xl bg-[#141721] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                              {usr.avatarUrl ? (
                                <img src={usr.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-5 h-5 text-zinc-500 m-2.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-100">{usr.username}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    usr.role === 'admin'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  {usr.role}
                                </span>
                              </div>
                              <span className="text-zinc-400 block">{usr.email || 'No email'}</span>
                              <span className="text-[10px] text-zinc-500">
                                Ref Code: <strong className="text-zinc-300">{usr.referralCode}</strong> • Joined:{' '}
                                {new Date(usr.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleUserRole(usr)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              usr.role === 'admin'
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                : 'bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                            }`}
                          >
                            {usr.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: WALLET PACKS */}
          {activeSection === 'packs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Top-Up Packs & Pricing</h3>
                  <p className="text-xs text-zinc-400">
                    Define Coin and Diamond packages purchasable via mobile money.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingPack({
                      title: '',
                      currency: 'coins',
                      amount: 1000,
                      tshPrice: 500,
                      description: '',
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pack</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {packs.map((pk) => (
                  <div
                    key={pk.id}
                    className="p-4 rounded-2xl bg-[#141721] border border-white/10 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-zinc-100">{pk.title}</span>
                        <span className="text-xs uppercase font-bold text-rose-400">{pk.currency}</span>
                      </div>
                      <div className="text-lg font-black text-zinc-200 font-mono">
                        {pk.amount.toLocaleString()} {pk.currency}
                      </div>
                      <span className="text-xs text-zinc-400 block mt-1">
                        Price: <strong>TSh {pk.tshPrice.toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => setEditingPack(pk)}
                        className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-rose-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this pack?')) {
                            await deletePack(pk.id);
                            refreshAllData();
                          }
                        }}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 8: EXCHANGE SETTINGS */}
          {activeSection === 'exchange' && rateConfig && (
            <div className="max-w-xl p-6 rounded-3xl bg-[#141721] border border-white/10 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Exchange Rate Engine</h3>
                <p className="text-xs text-zinc-400">
                  Configure authoritative conversion ratios and transaction fees for Coins and Diamonds.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateExchangeRate(rateConfig);
                  if (currentUser) {
                    await logAdminAction(
                      currentUser.uid,
                      currentUser.email || '',
                      'UPDATE_EXCHANGE_RATE',
                      'rate_config',
                      `Updated rate: 1 Diamond = ${rateConfig.coinsPerDiamond} Coins, fee: ${rateConfig.feePercentage}%`
                    );
                  }
                  showToast('Authoritative exchange rate saved to Firebase!', 'success');
                  refreshAllData();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Coins Per 1 Diamond (System Ratio)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rateConfig.coinsPerDiamond}
                    onChange={(e) =>
                      setRateConfig({ ...rateConfig, coinsPerDiamond: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Platform Exchange Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={rateConfig.feePercentage}
                    onChange={(e) =>
                      setRateConfig({ ...rateConfig, feePercentage: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Min Coins per Exchange
                    </label>
                    <input
                      type="number"
                      value={rateConfig.minExchangeCoins}
                      onChange={(e) =>
                        setRateConfig({ ...rateConfig, minExchangeCoins: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Min Diamonds per Exchange
                    </label>
                    <input
                      type="number"
                      value={rateConfig.minExchangeDiamonds}
                      onChange={(e) =>
                        setRateConfig({ ...rateConfig, minExchangeDiamonds: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 cursor-pointer"
                >
                  Save Authoritative Exchange Rates
                </button>
              </form>
            </div>
          )}

          {/* SECTION 9: PAYMENT METHODS */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Mobile Money Gateway Options</h3>
                  <p className="text-xs text-zinc-400">
                    M-Pesa, Airtel Money, HaloPesa, and Mixx by Yas account specifications.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingMethod({
                      id: 'vodacom',
                      name: '',
                      paybillOrAccount: '',
                      accountName: '',
                      recipientNumber: '',
                      recipientName: '',
                      instructions: '',
                      color: '#ef4444',
                      isActive: true,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Gateway</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {methods.map((mth) => (
                  <div
                    key={mth.id}
                    className="p-5 rounded-2xl bg-[#141721] border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: mth.color }}
                        />
                        <h4 className="text-sm font-bold text-zinc-100">{mth.name}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          mth.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {mth.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 space-y-1 bg-black/40 p-3 rounded-xl">
                      <div>Paybill / Till: <strong className="text-zinc-200">{mth.paybillOrAccount || 'Direct Number'}</strong></div>
                      <div>Recipient: <strong className="text-zinc-200">{mth.recipientNumber}</strong> ({mth.recipientName})</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => setEditingMethod(mth)}
                        className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-rose-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete payment method?')) {
                            await deletePaymentMethod(mth.id, currentUser || undefined);
                            refreshAllData();
                          }
                        }}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 10: REFERRAL SETTINGS */}
          {activeSection === 'referrals' && siteSettings && (
            <div className="max-w-xl p-6 rounded-3xl bg-[#141721] border border-white/10 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Referral Program Settings</h3>
                <p className="text-xs text-zinc-400">
                  Reward rules for inviters and newly registered gamers.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Registration Welcome Bonus (Coins)
                  </label>
                  <input
                    type="number"
                    value={siteSettings.registrationBonusCoins}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        registrationBonusCoins: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Registration Welcome Bonus (Diamonds)
                  </label>
                  <input
                    type="number"
                    value={siteSettings.registrationBonusDiamonds}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        registrationBonusDiamonds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Referrer Reward Bonus (Coins per invited gamer)
                  </label>
                  <input
                    type="number"
                    value={siteSettings.referralRewardCoins}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        referralRewardCoins: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Referral Settings
                </button>
              </form>
            </div>
          )}

          {/* SECTION 11: REDEEM CODES */}
          {activeSection === 'codes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Voucher / Promo Codes</h3>
                  <p className="text-xs text-zinc-400">
                    Create redeemable gift codes for marketing campaigns.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingCode({
                      code: '',
                      rewardCurrency: 'coins',
                      rewardAmount: 1000,
                      maxUses: 100,
                      currentUses: 0,
                      expiresAt: '2028-12-31T23:59:59Z',
                      isActive: true,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Code</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {redeemCodes.map((c) => (
                  <div
                    key={c.code}
                    className="p-4 rounded-2xl bg-[#141721] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-black text-amber-400">{c.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-300">
                      Reward: <strong>+{c.rewardAmount} {c.rewardCurrency}</strong>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Used: {c.currentUses} / {c.maxUses} times
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 12: EVENTS */}
          {activeSection === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Promotions & Site Events</h3>
                  <p className="text-xs text-zinc-400">
                    Manage marketing banners, holiday sales, and special events.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingEvent({
                      title: '',
                      description: '',
                      badge: 'EVENT',
                      bannerUrl: '',
                      actionUrl: '',
                      isActive: true,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl bg-[#141721] border border-white/10 space-y-3"
                  >
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40">
                      <img src={evt.bannerUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-100">{evt.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                          {evt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{evt.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => setEditingEvent(evt)}
                        className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-rose-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this event?')) {
                            await deleteSiteEvent(evt.id, currentUser || undefined);
                            refreshAllData();
                          }
                        }}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 13: AUDIT LOGS */}
          {activeSection === 'audit' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Immutable Audit Trail</h3>
                <p className="text-xs text-zinc-400">
                  Cryptographically structured record of all administrator interventions.
                </p>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#141721] border border-white/10 text-zinc-500 text-xs">
                  No administrative actions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-[#141721] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                            {log.action}
                          </span>
                          <span className="text-zinc-200 font-medium">{log.details}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">By {log.adminEmail}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 14: SITE SETTINGS */}
          {activeSection === 'settings' && siteSettings && (
            <div className="max-w-xl p-6 rounded-3xl bg-[#141721] border border-white/10 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Platform Global Settings</h3>
                <p className="text-xs text-zinc-400">
                  Site branding, ImgBB API Key, and customer support channels.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Marketplace Name
                  </label>
                  <input
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) =>
                      setSiteSettings({ ...siteSettings, siteName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-violet-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-300">
                      ImgBB API Key (Image Hosting Integration)
                    </label>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      Active Forever In Code
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="027e901693380c0de7d21938fdc8dd70"
                      value={siteSettings.imgbbApiKey || DEFAULT_IMGBB_API_KEY}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, imgbbApiKey: e.target.value })
                      }
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSiteSettings({ ...siteSettings, imgbbApiKey: DEFAULT_IMGBB_API_KEY })
                      }
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Default Key
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Hardcoded permanent key <code className="text-violet-300 font-mono">{DEFAULT_IMGBB_API_KEY}</code> is active. Product catalog images and payment proofs automatically upload to ImgBB and return high-speed CDN URLs.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={siteSettings.currencySymbol}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, currencySymbol: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      WhatsApp Support
                    </label>
                    <input
                      type="text"
                      value={siteSettings.supportWhatsApp}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, supportWhatsApp: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Global Configuration
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Reject Top-Up with Mandatory Reason */}
      {reviewTopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141721] border border-white/15 p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100">Reject Top-Up Request</h3>
            <p className="text-xs text-zinc-400">
              Provide a clear reason for rejecting Ref: {reviewTopup.transactionReference}.
            </p>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid carrier SMS transaction code or mismatched payment amount."
              className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewTopup(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectTopup(reviewTopup)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Product with ImgBB Multi-Image Uploader */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-3xl bg-[#141721] border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Category</label>
                  <select
                    value={editingProduct.category || categories[0]?.name || 'PC Games'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Delivery Type</label>
                  <select
                    value={editingProduct.deliveryType || 'download'}
                    onChange={(e: any) =>
                      setEditingProduct({ ...editingProduct, deliveryType: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                  >
                    <option value="download">Instant Authorized Download</option>
                    <option value="manual">Manual Dispatch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 1000}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Currency</label>
                  <select
                    value={editingProduct.currency || 'coins'}
                    onChange={(e: any) =>
                      setEditingProduct({ ...editingProduct, currency: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                  >
                    <option value="coins">Coins</option>
                    <option value="diamonds">Diamonds</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              {/* IMGBB & MULTI-IMAGE UPLOADER ZONE */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    <span>Product Images (Carousel Slideshow)</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    Supports ImgBB & Firebase Storage
                  </span>
                </div>

                {/* Upload File Input */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 cursor-pointer transition-all active:scale-95">
                    <Upload className="w-4 h-4 text-rose-400" />
                    <span>Upload Image Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </label>
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      <span>Uploading... {uploadProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Direct Image URL input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or enter direct image URL (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        const existing = editingProduct.imageUrls || [];
                        setEditingProduct({
                          ...editingProduct,
                          imageUrls: [...existing, newImageUrl.trim()],
                        });
                        setNewImageUrl('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {/* Thumbnail Previews */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {editingProduct.imageUrls?.map((url, i) => (
                    <div
                      key={i}
                      className="relative group/img w-20 h-16 rounded-xl overflow-hidden border border-white/15 bg-black/60"
                    >
                      <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(editingProduct.imageUrls || [])];
                          updated.splice(i, 1);
                          setEditingProduct({ ...editingProduct, imageUrls: updated });
                        }}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protected Download URL Secret */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Protected Download URL (Revealed only upon purchase)
                </label>
                <input
                  type="text"
                  placeholder="https://download.nexora.market/secure/package.zip"
                  value={editingSecretUrl}
                  onChange={(e) => setEditingSecretUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Category Editor */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141721] border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">
              {editingCategory.id ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pack Editor */}
      {editingPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141721] border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">Configure Top-Up Pack</h3>
            <form onSubmit={handleSavePack} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Pack Title</label>
                <input
                  type="text"
                  required
                  value={editingPack.title || ''}
                  onChange={(e) => setEditingPack({ ...editingPack, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Currency</label>
                  <select
                    value={editingPack.currency || 'coins'}
                    onChange={(e: any) =>
                      setEditingPack({ ...editingPack, currency: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                  >
                    <option value="coins">Coins</option>
                    <option value="diamonds">Diamonds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingPack.amount || 1000}
                    onChange={(e) =>
                      setEditingPack({ ...editingPack, amount: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Price (TSh)</label>
                <input
                  type="number"
                  required
                  value={editingPack.tshPrice || 500}
                  onChange={(e) =>
                    setEditingPack({ ...editingPack, tshPrice: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPack(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Pack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Redeem Code Editor */}
      {editingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141721] border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">Create Voucher Promo Code</h3>
            <form onSubmit={handleSaveCode} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Code String</label>
                <input
                  type="text"
                  required
                  value={editingCode.code || ''}
                  onChange={(e) =>
                    setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. ULTRA2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Currency</label>
                  <select
                    value={editingCode.rewardCurrency || 'coins'}
                    onChange={(e: any) =>
                      setEditingCode({ ...editingCode, rewardCurrency: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                  >
                    <option value="coins">Coins</option>
                    <option value="diamonds">Diamonds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    value={editingCode.rewardAmount || 1000}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, rewardAmount: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Max Uses</label>
                <input
                  type="number"
                  required
                  value={editingCode.maxUses || 100}
                  onChange={(e) =>
                    setEditingCode({ ...editingCode, maxUses: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCode(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Site Event Editor */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141721] border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">Configure Site Event</h3>
            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  required
                  value={editingEvent.bannerUrl || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, bannerUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={editingEvent.badge || 'PROMO'}
                  onChange={(e) => setEditingEvent({ ...editingEvent, badge: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Payment Method Editor */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141721] border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">Configure Payment Gateway</h3>
            <form onSubmit={handleSaveMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Network Name</label>
                <input
                  type="text"
                  required
                  value={editingMethod.name || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Recipient Number</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.recipientNumber || ''}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, recipientNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Account / Till</label>
                  <input
                    type="text"
                    value={editingMethod.paybillOrAccount || ''}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, paybillOrAccount: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={editingMethod.recipientName || ''}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, recipientName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Instructions</label>
                <textarea
                  rows={2}
                  value={editingMethod.instructions || ''}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, instructions: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
