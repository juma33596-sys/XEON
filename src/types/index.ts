export type Role = 'user' | 'admin';

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  role: Role;
}

export interface Wallet {
  userId: string;
  coins: number;
  diamonds: number;
  updatedAt: string;
}

export type CurrencyType = 'coins' | 'diamonds';
export type DeliveryType = 'download' | 'manual';
export type ProductStatus = 'published' | 'unpublished' | 'archived';

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  imageUrls: string[];
  price: number;
  currency: CurrencyType;
  status: ProductStatus;
  deliveryType: DeliveryType;
  featured: boolean;
  version?: string;
  platform?: string;
  downloadSize?: string;
  downloadUrl?: string; // Revealed only to admin or authorized orders
  createdAt: string;
  updatedAt: string;
}

export interface ProductSecret {
  productId: string;
  downloadUrl: string;
  fileSize?: string;
  instructions?: string;
  licenseKeyTemplate?: string;
}

export type OrderStatus = 'completed' | 'processing' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  pricePaid: number;
  currency: CurrencyType;
  deliveryType: DeliveryType;
  status: OrderStatus;
  licenseKey?: string;
  downloadUrl?: string;
  createdAt: string;
}

export type TransactionType =
  | 'topup'
  | 'exchange_debit'
  | 'exchange_credit'
  | 'purchase'
  | 'referral_reward'
  | 'redeem_reward'
  | 'casino_bet'
  | 'casino_win'
  | 'hosting_hold'
  | 'hosting_charge'
  | 'hosting_refund'
  | 'hosting_deploy_static'
  | 'betting_code_purchase';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  currency: CurrencyType;
  amount: number; // positive for credit, negative for debit
  description: string;
  referenceId?: string;
  createdAt: string;
}

export type TopupStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PaymentNetwork = 'airtel' | 'vodacom' | 'mixx' | 'halopesa';

export interface Topup {
  id: string;
  userId: string;
  userEmail?: string;
  packId: string;
  rewardCurrency: CurrencyType;
  rewardAmount: number;
  tshPrice: number;
  paymentNetwork: PaymentNetwork;
  senderPhone: string;
  transactionReference: string;
  proofUrl?: string;
  status: TopupStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Pack {
  id: string;
  title: string;
  currency: CurrencyType;
  amount: number;
  tshPrice: number;
  popular?: boolean;
  badge?: string;
  description: string;
}

export interface PaymentMethod {
  id: PaymentNetwork;
  name: string;
  paybillOrAccount: string;
  accountName: string;
  recipientNumber: string;
  recipientName: string;
  instructions: string;
  instructionsSw?: string;
  color: string;
  isActive: boolean;
}

export interface ExchangeRateConfig {
  coinsPerDiamond: number; // e.g. 2000 coins = 1 diamond
  feePercentage: number; // e.g. 2%
  minExchangeDiamonds: number;
  minExchangeCoins: number;
  updatedAt: string;
}

export interface RedeemCode {
  code: string;
  rewardCurrency: CurrencyType;
  rewardAmount: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  itemCount?: number;
}

export interface SiteSettings {
  siteName: string;
  maintenanceMode: boolean;
  currencySymbol: string;
  supportWhatsApp: string;
  recipientNumber: string;
  recipientName: string;
  imgbbApiKey?: string;
  registrationBonusCoins: number;
  registrationBonusDiamonds: number;
  referralRewardCoins: number;
  coinsPerDiamond: number;
  feePercentage: number;
}

export interface SiteEvent {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  actionUrl?: string;
  badge?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

// Casino Models (10 Provably Fair Games)
export type CasinoGameId =
  | 'aviator'
  | 'heads_tails'
  | 'color_game'
  | 'grid_7x7'
  | 'dice'
  | 'plinko'
  | 'hilo'
  | 'penalty'
  | 'roulette'
  | 'crypto_wheel';

export interface CasinoBetResult {
  betId: string;
  userId: string;
  gameId: CasinoGameId;
  betAmount: number; // in Coins
  multiplier: number;
  payout: number;
  outcome: 'won' | 'lost';
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  timestamp: string;
}

// NEXORA Hosting Models
export type HostingProjectType = 'static' | 'backend';
export type HostingSourceMode = 'paste' | 'zip' | 'github';
export type HostingStatus = 'draft' | 'queued' | 'building' | 'live' | 'stopped' | 'failed' | 'rejected' | 'suspended';

export interface HostingFile {
  path: string;
  content: string;
  size: number;
  isBinary?: boolean;
}

export interface HostingProject {
  id: string;
  userId: string;
  userEmail?: string;
  name: string;
  slug: string;
  description: string;
  projectType: HostingProjectType;
  sourceMode: HostingSourceMode;
  framework: string;
  status: HostingStatus;
  entryHtml?: string;
  filesCount: number;
  totalSizeBytes: number;
  liveUrl?: string;
  githubUrl?: string;
  buildLogs: string[];
  buildError?: string;
  deployedAt?: string;
  visitsCount?: number;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HostingBackendRequest {
  id: string;
  projectId: string;
  userId: string;
  userEmail?: string;
  projectName: string;
  projectSlug: string;
  backendStack: string;
  envVarsNotes?: string;
  sourceUrlOrRepo: string;
  heldCoins: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'changes_requested';
  adminFeedback?: string;
  deployedExternalUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// BETTING CODES STORE TYPES
// -------------------------------------------------------------

export type BettingApp =
  | 'BetPawa'
  | 'Betika'
  | 'Betway'
  | 'SportyBet'
  | '21.com'
  | '1win'
  | 'FanSport'
  | 'MozzartBet'
  | 'Other';

export interface BettingCode {
  id: string;
  title: string;
  bettingApp: BettingApp;
  appLogoUrl: string;
  bookingCode: string; // Secret code revealed only after purchase
  odds: number; // e.g. 24.50
  costCoins: number; // Cost in NEXORA Coins
  description: string;
  leagueOrSport?: string;
  matchDate?: string;
  winRatePercent?: number; // e.g. 94%
  status: 'active' | 'won' | 'lost' | 'expired';
  expiresAt?: string; // ISO date timestamp for auto-expiry and auto-deletion
  purchasesCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasedBettingCode {
  id: string;
  userId: string;
  userEmail?: string;
  codeId: string;
  bettingApp: BettingApp;
  appLogoUrl: string;
  bookingCode: string;
  odds: number;
  costPaidCoins: number;
  title: string;
  description: string;
  purchasedAt: string;
}
