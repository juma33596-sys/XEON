import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BettingApp, BettingCode, PurchasedBettingCode, Transaction } from '../types';

export const BETTING_APPS_META: Record<
  BettingApp,
  { name: string; brandColor: string; logoUrl: string; websiteUrl: string; countryFocus: string }
> = {
  SportyBet: {
    name: 'SportyBet',
    brandColor: '#e53935',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://www.sportybet.com',
    countryFocus: 'Tanzania, Kenya, Nigeria, Ghana',
  },
  BetPawa: {
    name: 'BetPawa',
    brandColor: '#00e676',
    logoUrl: 'https://images.unsplash.com/photo-1489944445301-4336b546c92e?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://www.betpawa.co.tz',
    countryFocus: 'Tanzania, Uganda, Kenya, Rwanda',
  },
  Betika: {
    name: 'Betika',
    brandColor: '#fbc02d',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://www.betika.co.tz',
    countryFocus: 'Tanzania, Kenya, Ghana, Ethiopia',
  },
  Betway: {
    name: 'Betway',
    brandColor: '#111827',
    logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://www.betway.co.tz',
    countryFocus: 'Global & East Africa',
  },
  '1win': {
    name: '1win',
    brandColor: '#1e88e5',
    logoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://1win.pro',
    countryFocus: 'International & Multi-Currency',
  },
  '21.com': {
    name: '21.com',
    brandColor: '#7c4dff',
    logoUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://www.21.com',
    countryFocus: 'International Gaming',
  },
  FanSport: {
    name: 'FanSport',
    brandColor: '#00bcd4',
    logoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://fan-sport.com',
    countryFocus: 'Sports & Live Multi-Bets',
  },
  MozzartBet: {
    name: 'MozzartBet',
    brandColor: '#ffb300',
    logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=200&q=80',
    websiteUrl: 'https://www.mozzartbet.co.tz',
    countryFocus: 'Tanzania & East Africa',
  },
  Other: {
    name: 'Sports Bookmaker',
    brandColor: '#6366f1',
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&q=80',
    websiteUrl: '',
    countryFocus: 'All Platforms',
  },
};

export const INITIAL_BETTING_CODES: BettingCode[] = [
  {
    id: 'bcode_sportybet_mega_48',
    title: 'Weekend 12-Match Mega Accumulator',
    bettingApp: 'SportyBet',
    appLogoUrl: BETTING_APPS_META['SportyBet'].logoUrl,
    bookingCode: 'SB-892147X',
    odds: 48.5,
    costCoins: 50,
    description: '12 carefully selected fixtures across Premier League, Serie A, and La Liga. Mixed Over 1.5 Goals & Home Win Bankers.',
    leagueOrSport: 'EPL / Serie A / La Liga',
    matchDate: 'Weekend Special',
    winRatePercent: 89,
    status: 'active',
    purchasesCount: 42,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bcode_betpawa_ucl_26',
    title: 'UEFA Champions League High-Roller Express',
    bettingApp: 'BetPawa',
    appLogoUrl: BETTING_APPS_META['BetPawa'].logoUrl,
    bookingCode: 'PAWA-742918',
    odds: 26.8,
    costCoins: 30,
    description: 'European elite night multi-bet. Both Teams to Score + Double Chances with high mathematical certainty.',
    leagueOrSport: 'Champions League & Europa',
    matchDate: 'Midweek Primetime',
    winRatePercent: 91,
    status: 'active',
    purchasesCount: 67,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bcode_1win_vip_135',
    title: 'VIP 100+ Mega Odds Extreme Multiplier',
    bettingApp: '1win',
    appLogoUrl: BETTING_APPS_META['1win'].logoUrl,
    bookingCode: '1WIN-VIP-9942',
    odds: 135.0,
    costCoins: 100,
    description: 'High-stake risk-reward master ticket. 18 combo legs with goal scorers and corner handicaps. High odds powerhouse.',
    leagueOrSport: 'Global Football / Over 2.5',
    matchDate: 'Saturday Evening',
    winRatePercent: 78,
    status: 'active',
    purchasesCount: 104,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bcode_betway_safe_5',
    title: 'Sure-Fire 5-Banker Ticket (98% Win Rate)',
    bettingApp: 'Betway',
    appLogoUrl: BETTING_APPS_META['Betway'].logoUrl,
    bookingCode: 'BW-SAF-3301',
    odds: 5.45,
    costCoins: 15,
    description: 'Ultra conservative safe ticket for bankroll building. Heavy home favorites and Over 0.5 First Half Goals.',
    leagueOrSport: 'Top 5 European Leagues',
    matchDate: 'Daily Sure Ticket',
    winRatePercent: 98,
    status: 'active',
    purchasesCount: 158,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bcode_betika_jackpot_18',
    title: 'Betika Midweek Jackpot Booster Multi',
    bettingApp: 'Betika',
    appLogoUrl: BETTING_APPS_META['Betika'].logoUrl,
    bookingCode: 'BTK-MID-6612',
    odds: 18.75,
    costCoins: 25,
    description: '8 solid matches tailored for Betika slip. Clean sheets, double chance combos, and African World Cup qualifiers.',
    leagueOrSport: 'International & Leagues',
    matchDate: 'Thursday',
    winRatePercent: 88,
    status: 'active',
    purchasesCount: 51,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bcode_21com_goals_32',
    title: '21.com Goal Frenzy Over 2.5 Specialist Ticket',
    bettingApp: '21.com',
    appLogoUrl: BETTING_APPS_META['21.com'].logoUrl,
    bookingCode: '21C-EPL-8803',
    odds: 32.0,
    costCoins: 40,
    description: 'Specialized attacking analytics ticket. High expected goals (xG) matches across Bundesliga and Dutch Eredivisie.',
    leagueOrSport: 'Bundesliga & Eredivisie',
    matchDate: 'Weekend Goals',
    winRatePercent: 85,
    status: 'active',
    purchasesCount: 38,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bcode_fansport_btts_14',
    title: 'FanSport Both Teams To Score (BTTS) Express',
    bettingApp: 'FanSport',
    appLogoUrl: BETTING_APPS_META['FanSport'].logoUrl,
    bookingCode: 'FSP-BTTS-4190',
    odds: 14.2,
    costCoins: 20,
    description: 'Both Teams to Score (GG) in 6 fierce derby clashes. Verified high conversion rate.',
    leagueOrSport: 'Championship & Ligue 1',
    matchDate: 'Friday Night',
    winRatePercent: 90,
    status: 'active',
    purchasesCount: 29,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const LOCAL_DELETED_CODES_KEY = 'nexora_deleted_betting_codes';
const LOCAL_APP_LOGOS_KEY = 'nexora_betting_app_logos';

export function getDeletedCodeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markCodeDeleted(codeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getDeletedCodeIds();
    if (!list.includes(codeId)) {
      list.push(codeId);
      localStorage.setItem(LOCAL_DELETED_CODES_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

/**
 * Get custom bookmaker app logos uploaded by Admin
 */
export async function getBettingAppLogos(): Promise<Record<string, string>> {
  let map: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_APP_LOGOS_KEY);
      if (raw) map = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  try {
    const snap = await getDoc(doc(db, 'app_settings', 'betting_app_logos'));
    if (snap.exists()) {
      const remote = snap.data()?.logos as Record<string, string> | undefined;
      if (remote) {
        map = { ...map, ...remote };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_APP_LOGOS_KEY, JSON.stringify(map));
        }
      }
    }
  } catch {
    // fallback to memory/localStorage
  }

  return map;
}

/**
 * Save custom bookmaker app logo uploaded by Admin
 */
export async function saveBettingAppLogo(app: BettingApp, logoUrl: string): Promise<void> {
  const cleanUrl = logoUrl.trim();
  if (!cleanUrl) throw new Error('App image cannot be empty');

  let map: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_APP_LOGOS_KEY);
      if (raw) map = JSON.parse(raw);
    } catch {
      // ignore
    }
    map[app] = cleanUrl;
    localStorage.setItem(LOCAL_APP_LOGOS_KEY, JSON.stringify(map));
  }

  try {
    await setDoc(
      doc(db, 'app_settings', 'betting_app_logos'),
      {
        logos: map,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not persist app logo to Firestore, saved locally:', err);
  }
}

/**
 * Auto-delete / purge codes that have expired (expiresAt <= now or status === 'expired')
 */
export async function cleanupExpiredCodes(codesToCheck?: BettingCode[]): Promise<string[]> {
  const now = Date.now();
  const purgedIds: string[] = [];
  const targetCodes = codesToCheck || (await getBettingCodes(false));

  for (const c of targetCodes) {
    const isPastExpiry = c.expiresAt && new Date(c.expiresAt).getTime() <= now;
    const isMarkedExpired = c.status === 'expired';

    if (isPastExpiry || isMarkedExpired) {
      purgedIds.push(c.id);
      markCodeDeleted(c.id);
      try {
        await deleteDoc(doc(db, 'betting_codes', c.id));
      } catch {
        // Continue purging others
      }
    }
  }

  return purgedIds;
}

/**
 * Fetch all available betting codes with auto-expiry cleanup and deleted filter
 */
export async function getBettingCodes(autoPurge: boolean = true): Promise<BettingCode[]> {
  const path = 'betting_codes';
  const deletedIds = new Set(getDeletedCodeIds());
  const now = Date.now();

  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    let rawList: BettingCode[] = [];

    if (snap.empty) {
      // Seed default sample codes so user immediately has live data
      const seeded: BettingCode[] = [];
      for (const sample of INITIAL_BETTING_CODES) {
        if (!deletedIds.has(sample.id)) {
          try {
            await setDoc(doc(db, path, sample.id), sample);
            seeded.push(sample);
          } catch {
            seeded.push(sample);
          }
        }
      }
      rawList = seeded;
    } else {
      rawList = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BettingCode, 'id'>),
      }));
    }

    // Filter out deleted codes
    let activeList = rawList.filter((c) => !deletedIds.has(c.id));

    // Auto-delete / clean up expired codes if requested
    if (autoPurge) {
      const expiredCodes = activeList.filter(
        (c) => (c.expiresAt && new Date(c.expiresAt).getTime() <= now) || c.status === 'expired'
      );
      if (expiredCodes.length > 0) {
        // Trigger auto-delete in background
        cleanupExpiredCodes(expiredCodes).catch(console.error);
        activeList = activeList.filter(
          (c) => !(c.expiresAt && new Date(c.expiresAt).getTime() <= now) && c.status !== 'expired'
        );
      }
    }

    // Merge custom app logos if admin configured them
    try {
      const appLogos = await getBettingAppLogos();
      activeList = activeList.map((c) => {
        if (appLogos[c.bettingApp]) {
          return { ...c, appLogoUrl: appLogos[c.bettingApp] };
        }
        return c;
      });
    } catch {
      // ignore
    }

    return activeList;
  } catch (err) {
    console.warn('Could not query Firestore betting_codes, using default samples:', err);
    return INITIAL_BETTING_CODES.filter((c) => !deletedIds.has(c.id));
  }
}

/**
 * Fetch codes purchased by a specific user
 */
export async function getUserPurchasedBettingCodes(userId: string): Promise<PurchasedBettingCode[]> {
  const path = 'purchased_betting_codes';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PurchasedBettingCode, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

/**
 * Atomically buy a betting code using Coins.
 * Reveals the secret bookingCode and saves it to user's purchased codes.
 */
export async function purchaseBettingCodeAtomic(params: {
  userId: string;
  userEmail?: string;
  codeId: string;
}): Promise<{ success: boolean; bookingCode: string; newCoins: number; alreadyOwned: boolean }> {
  const { userId, userEmail, codeId } = params;
  const purchaseDocId = `${userId}_${codeId}`;
  const purchaseRef = doc(db, 'purchased_betting_codes', purchaseDocId);
  const codeRef = doc(db, 'betting_codes', codeId);
  const walletRef = doc(db, 'wallets', userId);
  const now = new Date().toISOString();

  // First check if user already purchased this code
  try {
    const existingSnap = await getDoc(purchaseRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data() as PurchasedBettingCode;
      return {
        success: true,
        bookingCode: data.bookingCode,
        newCoins: 0,
        alreadyOwned: true,
      };
    }
  } catch {
    // continue
  }

  try {
    return await runTransaction(db, async (txn) => {
      // 1. Get Code
      const codeSnap = await txn.get(codeRef);
      let codeData: BettingCode;

      if (!codeSnap.exists()) {
        // Check initial samples
        const sample = INITIAL_BETTING_CODES.find((s) => s.id === codeId);
        if (!sample) {
          throw new Error('Betting code not found');
        }
        codeData = sample;
      } else {
        codeData = { id: codeSnap.id, ...(codeSnap.data() as Omit<BettingCode, 'id'>) };
      }

      // 2. Get Wallet
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found. Please log in.');
      }

      const currentCoins = walletSnap.data().coins || 0;
      if (currentCoins < codeData.costCoins) {
        throw new Error(
          `Insufficient Coins! This ${codeData.odds} Odds ticket requires ${codeData.costCoins} Coins, but you have ${currentCoins.toLocaleString()} Coins. Top up or spin to get more Coins.`
        );
      }

      const newCoins = currentCoins - codeData.costCoins;
      txn.update(walletRef, {
        coins: newCoins,
        updatedAt: now,
      });

      // 3. Record transaction ledger
      const txId = `tx_bcode_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const ledgerEntry: Transaction = {
        id: txId,
        userId,
        type: 'betting_code_purchase',
        currency: 'coins',
        amount: -codeData.costCoins,
        description: `Unlocked ${codeData.bettingApp} (${codeData.odds} Odds) Booking Code: ${codeData.title}`,
        referenceId: codeId,
        createdAt: now,
      };
      txn.set(doc(db, 'transactions', txId), ledgerEntry);

      // 4. Update purchases count on code if in Firestore
      if (codeSnap.exists()) {
        txn.update(codeRef, {
          purchasesCount: (codeData.purchasesCount || 0) + 1,
          updatedAt: now,
        });
      }

      // 5. Save purchased code doc
      const purchasedRecord: PurchasedBettingCode = {
        id: purchaseDocId,
        userId,
        userEmail,
        codeId,
        bettingApp: codeData.bettingApp,
        appLogoUrl: codeData.appLogoUrl,
        bookingCode: codeData.bookingCode,
        odds: codeData.odds,
        costPaidCoins: codeData.costCoins,
        title: codeData.title,
        description: codeData.description,
        purchasedAt: now,
      };
      txn.set(purchaseRef, purchasedRecord);

      return {
        success: true,
        bookingCode: codeData.bookingCode,
        newCoins,
        alreadyOwned: false,
      };
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Insufficient Coins')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `purchased_betting_codes/${purchaseDocId}`);
    throw err;
  }
}

/**
 * Admin: Add new betting code
 */
export async function createBettingCode(
  data: Omit<BettingCode, 'id' | 'createdAt' | 'updatedAt' | 'purchasesCount'>
): Promise<BettingCode> {
  const codeId = `bcode_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newCode: BettingCode = {
    ...data,
    id: codeId,
    purchasesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const path = `betting_codes/${codeId}`;
  try {
    await setDoc(doc(db, 'betting_codes', codeId), newCode);

    // Auto-create slide announcement with auto-expire
    try {
      const { createAutoAnnouncement } = await import('./announcementService');
      await createAutoAnnouncement({
        title: `🎯 New VIP Slip: ${newCode.bettingApp} (${newCode.odds}x Odds)`,
        message: `${newCode.title} • ${newCode.leagueOrSport || 'VIP Multi-Match'}. Grab the verified booking code before kickoff!`,
        badge: 'VIP Slip',
        badgeColor: 'bg-amber-500 text-black',
        actionLabel: 'View Slip',
        actionTab: 'catalog',
        actionPayload: { category: '🎯 VIP Betting Codes' },
        durationHours: 36,
        durationSeconds: 25,
        entityType: 'betting_code',
      });
    } catch {
      // ignore announcement errors
    }

    return newCode;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

/**
 * Admin: Update betting code
 */
export async function updateBettingCode(codeId: string, updates: Partial<BettingCode>): Promise<void> {
  const path = `betting_codes/${codeId}`;
  try {
    await updateDoc(doc(db, 'betting_codes', codeId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

/**
 * Admin: Delete betting code (deletes from Firestore and registers in persistent deleted list)
 */
export async function deleteBettingCode(codeId: string): Promise<void> {
  // Always mark deleted locally first so it immediately disappears from UI
  markCodeDeleted(codeId);

  const path = `betting_codes/${codeId}`;
  try {
    await deleteDoc(doc(db, 'betting_codes', codeId));
  } catch (err) {
    console.warn(`Firestore deleteDoc failed for ${codeId}, marked locally as deleted:`, err);
    // Don't throw if already marked deleted locally, so UI doesn't crash on permission errors
  }
}

/**
 * Admin: Approve or update betting slip outcome (won / lost / active / expired)
 */
export async function approveBettingCodeResult(
  codeId: string,
  status: 'won' | 'lost' | 'active' | 'expired'
): Promise<void> {
  const path = `betting_codes/${codeId}`;
  try {
    await updateDoc(doc(db, 'betting_codes', codeId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

