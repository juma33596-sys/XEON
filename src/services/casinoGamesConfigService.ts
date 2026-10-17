import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CasinoGameId } from '../types';

export type CasinoGameKey = CasinoGameId;

export interface CasinoGameConfig {
  id: CasinoGameKey;
  title: string;
  tag: string;
  payout: string;
  coverImageUrl: string;
  accentColor: string;
  glowColor: string;
  accentBg: string;
  isHot?: boolean;
  minBetCoins: number;
  maxBetCoins: number;
  description: string;
}

export const DEFAULT_CASINO_GAMES: CasinoGameConfig[] = [
  {
    id: 'aviator',
    title: 'Aviator Crash',
    tag: 'Live Flight Multiplier',
    payout: '100x+ Max',
    coverImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-rose-400',
    glowColor: 'from-rose-500/20 to-amber-500/10 border-rose-500/40',
    accentBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    isHot: true,
    minBetCoins: 10,
    maxBetCoins: 50000,
    description: 'Real-time multiplayer curve crash game. Cash out before the supersonic jet blasts away!',
  },
  {
    id: 'heads_tails',
    title: 'Heads & Tails',
    tag: '50/50 Provably Flip',
    payout: '1.96x Double',
    coverImageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-amber-400',
    glowColor: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40',
    accentBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    minBetCoins: 10,
    maxBetCoins: 25000,
    description: 'Instant classic coin toss with cryptographic fair hash. Choose Head or Tail and double up!',
  },
  {
    id: 'color_game',
    title: 'Color Wheel',
    tag: '4-Color Cyber Wheel',
    payout: 'Up to 14x Multi',
    coverImageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-purple-400',
    glowColor: 'from-purple-500/20 to-pink-500/10 border-purple-500/40',
    accentBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    minBetCoins: 10,
    maxBetCoins: 20000,
    description: 'Spin the high-roller color wheel. Red, Blue, Green and Gold multiplier sectors!',
  },
  {
    id: 'grid_7x7',
    title: '7×7 Gem Matrix',
    tag: 'Mines Ladder Multiplier',
    payout: 'Dynamic Progressive',
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-emerald-400',
    glowColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40',
    accentBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    minBetCoins: 10,
    maxBetCoins: 15000,
    description: '49 cyber tiles. Reveal glowing neon gems to ramp up your multiplier, or cash out anytime!',
  },
  {
    id: 'dice',
    title: 'Provably Dice',
    tag: 'Over / Under Slider',
    payout: '98% RTP Fair',
    coverImageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-cyan-400',
    glowColor: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40',
    accentBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    minBetCoins: 5,
    maxBetCoins: 30000,
    description: 'Adjust your risk and target slider. Precision provably fair dice with instant payouts.',
  },
  {
    id: 'plinko',
    title: 'Plinko Cyber Drop',
    tag: 'Pyramid Physics Drop',
    payout: 'Up to 100x Multi',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-pink-400',
    glowColor: 'from-pink-500/20 to-purple-500/10 border-pink-500/40',
    accentBg: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
    isHot: true,
    minBetCoins: 10,
    maxBetCoins: 20000,
    description: 'Drop high-velocity cyber discs through peg obstacles into multiplier bins at the bottom!',
  },
  {
    id: 'hilo',
    title: 'Hi-Lo Cyber Cards',
    tag: 'Higher or Lower Streak',
    payout: 'Up to 24x Streak',
    coverImageUrl: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-indigo-400',
    glowColor: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/40',
    accentBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    minBetCoins: 10,
    maxBetCoins: 25000,
    description: 'Predict whether the next holographic card is Higher or Lower. Build consecutive streaks and cash out!',
  },
  {
    id: 'penalty',
    title: 'Penalty Shootout',
    tag: '5-Zone Cyber Goal',
    payout: 'Up to 30.72x Multi',
    coverImageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-yellow-400',
    glowColor: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/40',
    accentBg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    isHot: true,
    minBetCoins: 10,
    maxBetCoins: 20000,
    description: 'Step up to the 12-yard penalty spot. Beat the robotic AI keeper to multiply your coins on each goal!',
  },
  {
    id: 'roulette',
    title: 'Neon Cyber Roulette',
    tag: 'Single-Zero European',
    payout: '36x Straight-Up',
    coverImageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-red-400',
    glowColor: 'from-red-500/20 to-rose-500/10 border-red-500/40',
    accentBg: 'bg-red-500/15 border-red-500/30 text-red-400',
    minBetCoins: 10,
    maxBetCoins: 30000,
    description: 'Classic European neon roulette table. Bet on Red/Black, Odd/Even, Dozens, or straight single numbers.',
  },
  {
    id: 'crypto_wheel',
    title: 'Mega Multiplier Wheel',
    tag: '54-Segment Spin',
    payout: '100x Jackpot',
    coverImageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=600&q=80',
    accentColor: 'text-teal-400',
    glowColor: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40',
    accentBg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
    minBetCoins: 10,
    maxBetCoins: 25000,
    description: 'High-stakes spinning fortune wheel. Land on 2x, 5x, 10x, 20x, 50x or the elusive 100x Jackpot!',
  },
];

const LOCAL_STORAGE_KEY = 'nexora_casino_game_covers';

/**
 * Get all 10 casino games with custom covers if set by admin
 */
export async function getCasinoGamesConfig(): Promise<CasinoGameConfig[]> {
  let customCovers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        customCovers = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }

  try {
    const docRef = doc(db, 'app_settings', 'casino_game_covers');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as { covers?: Record<string, string> };
      if (data.covers) {
        customCovers = { ...customCovers, ...data.covers };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customCovers));
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch casino covers from Firestore, using local/defaults:', err);
  }

  return DEFAULT_CASINO_GAMES.map((game) => ({
    ...game,
    coverImageUrl: customCovers[game.id] || game.coverImageUrl,
  }));
}

/**
 * Admin: Update cover image for a casino game
 */
export async function saveCasinoGameCover(gameId: CasinoGameKey, coverImageUrl: string): Promise<void> {
  const cleanUrl = coverImageUrl.trim();
  if (!cleanUrl) throw new Error('Cover image URL or upload cannot be empty');

  let currentCovers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) currentCovers = JSON.parse(stored);
    } catch {
      // ignore
    }
    currentCovers[gameId] = cleanUrl;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentCovers));
  }

  try {
    const docRef = doc(db, 'app_settings', 'casino_game_covers');
    await setDoc(
      docRef,
      {
        covers: currentCovers,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not persist casino cover to Firestore:', err);
  }
}
