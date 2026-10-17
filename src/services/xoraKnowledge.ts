/**
 * NEXORA Authoritative Knowledge Registry
 * Single Source of Truth for Xora AI's understanding of the platform
 */

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'marketplace' | 'currency' | 'topup' | 'casino' | 'referrals' | 'admin' | 'troubleshooting';
  summary: string;
  keywords: string[];
  content: string;
  actionRoute?: string;
  actionLabel?: string;
}

export const NEXORA_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'marketplace_overview',
    title: 'Marketplace & Digital Assets',
    category: 'marketplace',
    summary: 'How to browse, search, and download verified game mods, bots, specialized APKs, and performance tools.',
    keywords: ['buy', 'product', 'download', 'mod', 'bot', 'apk', 'catalog', 'asset', 'price', 'library'],
    content: `NEXORA is a premier digital marketplace for high-performance mobile and PC assets.
- Products can be priced in Coins or Diamonds.
- Delivery types:
  1. Instant Download: Immediate access to direct download links and files in "My Library" upon purchase.
  2. Manual Dispatch: Admin-verified delivery with specialized license keys or private activation.
- Supported categories: Gaming Mods, Automation Bots, Premium APKs, Optimization Tools, Scripts & Source Code.`,
    actionRoute: '/',
    actionLabel: 'Browse Marketplace',
  },
  {
    id: 'currencies_economy',
    title: 'Coins & Diamonds Economy',
    category: 'currency',
    summary: 'The dual-currency system of NEXORA: Coins (utility & gaming) and Diamonds (premium assets).',
    keywords: ['coin', 'diamond', 'exchange', 'currency', 'rate', 'balance', 'fee', 'convert'],
    content: `NEXORA features a dual-currency ecosystem:
- Coins: Used for standard digital assets, casino wagers, and everyday marketplace tools.
- Diamonds: The elite currency used for VIP mods, high-tier developer bots, and exclusive releases.
- Exchange Rate: 1 Diamond = 2,000 Coins (subject to a transparent 2% platform fee).
- Conversion is atomic and instant via the Exchange terminal.`,
    actionRoute: '/exchange',
    actionLabel: 'Open Currency Exchange',
  },
  {
    id: 'mobile_money_topup',
    title: 'Mobile Money Top-Up Vault',
    category: 'topup',
    summary: 'Recharging Coins and Diamonds using Tanzanian mobile money (Airtel, Vodacom M-Pesa, HaloPesa, Tigo/Mixx).',
    keywords: ['topup', 'recharge', 'mpesa', 'airtel', 'halopesa', 'mixx', 'tigo', 'vodacom', 'tsh', 'money', 'deposit'],
    content: `To add Coins or Diamonds to your Nexora wallet:
1. Navigate to the Top-Up Vault.
2. Select a Coin or Diamond package (priced in TSh - Tanzanian Shillings).
3. Choose your mobile network: Vodacom M-Pesa, Airtel Money, HaloPesa, or Mixx by Yas (Tigo).
4. Send funds to the verified official business account number shown on the checkout card.
5. Enter your sender phone number and the SMS transaction reference ID.
6. An administrator verifies the transaction and credits your wallet balance.`,
    actionRoute: '/topup',
    actionLabel: 'Go to Top-Up Vault',
  },
  {
    id: 'provably_fair_casino',
    title: 'Nexora Coins Casino & Aviator Game',
    category: 'casino',
    summary: 'Provably fair casino games using Coins only, featuring dual-bet Aviator Crash, live players, and trends.',
    keywords: ['casino', 'aviator', 'crash', 'bet', 'dice', 'heads tails', 'color wheel', 'grid', 'wager', 'cashout'],
    content: `The Nexora Casino is exclusively COINS ONLY (Diamonds cannot be wagered).
- Games available:
  1. Aviator (Crash): Dual-betting panels (Bet 1 and Bet 2), live real-time players feed, back crash history trend ticker, auto-cashout controls, and 1-tap quick cashout pops.
  2. Heads or Tails: 50/50 instant coin flip with 1.96x payout.
  3. Color Wheel: 4-color wheel with Red/Blue/Green (2x) and Gold (14x jackpot).
  4. 7×7 Cyber Grid: Mines matrix multiplier ladder.
  5. Provably Fair Dice: Over/Under slider with 98% RTP.
- All game outcomes use SHA-256 cryptographic seed hashes ensuring verifiable mathematical fairness.`,
    actionRoute: '/casino',
    actionLabel: 'Enter Nexora Casino',
  },
  {
    id: 'my_digital_library',
    title: 'My Digital Library & Downloads',
    category: 'marketplace',
    summary: 'Accessing purchased tools, bots, APKs, license keys, and file downloads.',
    keywords: ['library', 'download', 'license', 'key', 'orders', 'purchased', 'my items'],
    content: `Every digital product you purchase is permanently preserved in your personal "My Library".
- Access direct download links anytime from any device.
- View license keys, activation credentials, and installation instructions.
- If a product requires manual delivery, your order status will update from "processing" to "completed" once dispatched.`,
    actionRoute: '/library',
    actionLabel: 'Open My Library',
  },
  {
    id: 'referrals_welcome_bonus',
    title: 'Welcome Bonus & Referral Program',
    category: 'referrals',
    summary: 'New user bonus (1,000 Coins + 1 Diamond) and friend invitation rewards.',
    keywords: ['bonus', 'referral', 'invite', 'free coins', 'welcome', 'reward', 'code'],
    content: `New users receive a registration reward of 1,000 Coins and 1 Diamond upon creating their account.
- Every user receives a unique referral code.
- When an invited friend signs up with your code and completes a top-up, you earn bonus Coins and Diamonds directly to your wallet.`,
    actionRoute: '/topup',
    actionLabel: 'View Balance & Bonus',
  },
  {
    id: 'admin_terminal',
    title: 'Admin Control Chamber',
    category: 'admin',
    summary: 'Administrative controls for authorized operators.',
    keywords: ['admin', 'manage', 'products', 'topups', 'audit', 'orders', 'packs', 'rates', 'xora settings'],
    content: `The Admin Control Chamber is restricted to authorized operators (verified via cryptographic token and database records).
- Manage marketplace products, categories, and download secrets.
- Review and verify pending mobile-money top-ups.
- Configure exchange rates, wallet packs, and site events.
- Audit administrator activity and monitor system health.
- Configure Xora AI settings, active model, and usage quotas.
- Review and approve/reject NEXORA Team Backend Hosting requests.`,
    actionRoute: '/admin',
    actionLabel: 'Admin Terminal',
  },
  {
    id: 'nexora_hosting',
    title: 'NEXORA Hosting: Build & Deploy',
    category: 'marketplace',
    summary: 'Instant static website hosting and managed backend cloud without buying a domain.',
    keywords: ['host', 'hosting', 'deploy', 'website', 'build', 'zip', 'github', 'slug', 'domain', 'backend', 'node', 'express', 'python'],
    content: `NEXORA Hosting allows creators and developers to build, deploy, and share websites directly on NEXORA:
1. Static Site Hosting:
   - Deploy single-file HTML, ZIP archives (Vite, React, Vue static dist builds), or public GitHub repositories.
   - Every project receives an instant live URL under: /hosts/<unique-slug> (e.g., https://nexora.vercel.app/hosts/my-app).
   - Strict sandboxing isolates user code from NEXORA cookies, authentication tokens, and private data.
2. Team Backend Hosting:
   - For Node.js, Express, Python (FastAPI/Django), or database-backed web apps, users can submit a "Request NEXORA Team Hosting".
   - 2,500 Coins are placed on secure escrow hold.
   - An administrator/DevOps engineer reviews and deploys the infrastructure.
   - If approved, the live deployment URL is assigned and held coins are confirmed.
   - If rejected, the held coins are automatically refunded in full to the user's wallet.`,
    actionRoute: '/hosting',
    actionLabel: 'Open NEXORA Hosting',
  },
];

export function searchKnowledge(query: string): KnowledgeArticle[] {
  const clean = query.toLowerCase().trim();
  if (!clean) return NEXORA_KNOWLEDGE_ARTICLES.slice(0, 4);

  const words = clean.split(/\s+/).filter(Boolean);

  return NEXORA_KNOWLEDGE_ARTICLES.map((article) => {
    let score = 0;
    for (const w of words) {
      if (article.title.toLowerCase().includes(w)) score += 5;
      if (article.keywords.some((k) => k.includes(w) || w.includes(k))) score += 4;
      if (article.summary.toLowerCase().includes(w)) score += 2;
      if (article.content.toLowerCase().includes(w)) score += 1;
    }
    return { article, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article);
}

export function formatKnowledgeForPrompt(): string {
  return NEXORA_KNOWLEDGE_ARTICLES.map(
    (a) => `[ARTICLE: ${a.title}] (Category: ${a.category}, Route: ${a.actionRoute || 'N/A'})\n${a.content}`
  ).join('\n\n');
}
