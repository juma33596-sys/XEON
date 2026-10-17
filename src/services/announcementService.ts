import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  badge?: string;
  badgeColor?: string;
  actionLabel?: string;
  actionTab?: string;
  actionPayload?: any;
  createdAt: string;
  expiresAt: string;
  durationSeconds?: number; // Active on-screen auto-disappear timer
  entityType?: 'betting_code' | 'product' | 'hosting' | 'casino' | 'system';
  isImportant?: boolean;
}

const DISMISSED_KEY = 'nexora_dismissed_announcements';

// Default dynamic announcements with auto-expire dates (e.g. 7 days from now)
export function getDefaultAnnouncements(): Announcement[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'ann_betting_codes_1',
      title: 'VIP High-Odds Sports Betting Slips',
      message: 'Verified booking codes from BetPawa, SportyBet, Betika, and 1win! Real-time odds from 5.50x to 135x.',
      badge: 'VIP Slips',
      badgeColor: 'bg-amber-500 text-black',
      actionLabel: 'View Slips',
      actionTab: 'catalog',
      actionPayload: { category: '🎯 VIP Betting Codes' },
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 3 * dayMs).toISOString(),
      durationSeconds: 25, // Auto-disappear after 25s of user engagement
      entityType: 'betting_code',
      isImportant: true,
    },
    {
      id: 'ann_casino_10_games',
      title: 'Nexora Casino: 10 Provably Fair Games Live',
      message: 'Full-screen arcade gaming: Aviator, Roulette, Plinko, Penalty Shootout, Hi-Lo, Color Wheel, and more with instant coin cashout!',
      badge: '10 Games',
      badgeColor: 'bg-rose-500 text-white',
      actionLabel: 'Play Games',
      actionTab: 'casino',
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 7 * dayMs).toISOString(),
      durationSeconds: 30,
      entityType: 'casino',
    },
    {
      id: 'ann_hosting_cloud',
      title: 'NEXORA Cloud Hosting: Static & Backend Stacks',
      message: 'Deploy HTML/Vite apps with custom slugs, file manager, instant re-hosting, and start/stop controls!',
      badge: 'Hosting v2',
      badgeColor: 'bg-cyan-500 text-black',
      actionLabel: 'Deploy App',
      actionTab: 'hosting',
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 5 * dayMs).toISOString(),
      durationSeconds: 30,
      entityType: 'hosting',
    },
  ];
}

/**
 * Get dismissed announcement IDs from localStorage
 */
export function getDismissedAnnouncementIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Dismiss an announcement so it does not appear again for this user
 */
export function dismissAnnouncement(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getDismissedAnnouncementIds();
    set.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Failed to persist dismissed announcement:', err);
  }
}

/**
 * Fetch all active, unexpired, non-dismissed announcements
 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const dismissed = getDismissedAnnouncementIds();
  const nowTime = Date.now();
  let remoteAnnouncements: Announcement[] = [];

  try {
    const colRef = collection(db, 'announcements');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const data = d.data() as Announcement;
      if (data && data.expiresAt) {
        const expTime = new Date(data.expiresAt).getTime();
        if (expTime > nowTime && !dismissed.has(data.id || d.id)) {
          remoteAnnouncements.push({
            ...data,
            id: data.id || d.id,
          });
        }
      }
    });
  } catch (err) {
    console.warn('Could not fetch announcements from Firestore, using dynamic defaults:', err);
  }

  // Combine remote with default announcements, avoiding duplicates
  const defaults = getDefaultAnnouncements().filter(
    (a) => !dismissed.has(a.id) && new Date(a.expiresAt).getTime() > nowTime
  );

  const mergedMap = new Map<string, Announcement>();
  for (const a of defaults) {
    mergedMap.set(a.id, a);
  }
  for (const a of remoteAnnouncements) {
    mergedMap.set(a.id, a);
  }

  return Array.from(mergedMap.values());
}

/**
 * Automatically create and broadcast an announcement for newly added items
 */
export async function createAutoAnnouncement(params: {
  title: string;
  message: string;
  badge?: string;
  badgeColor?: string;
  actionLabel?: string;
  actionTab?: string;
  actionPayload?: any;
  durationHours?: number; // Defaults to 48 hours
  durationSeconds?: number;
  entityType?: 'betting_code' | 'product' | 'hosting' | 'casino' | 'system';
}): Promise<void> {
  const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const durationHours = params.durationHours || 48;
  const expires = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  const announcement: Announcement = {
    id,
    title: params.title,
    message: params.message,
    badge: params.badge || 'New',
    badgeColor: params.badgeColor || 'bg-violet-500 text-white',
    actionLabel: params.actionLabel || 'Check It Out',
    actionTab: params.actionTab,
    actionPayload: params.actionPayload,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    durationSeconds: params.durationSeconds || 25,
    entityType: params.entityType || 'general' as any,
  };

  try {
    await setDoc(doc(db, 'announcements', id), announcement);
  } catch (err) {
    console.warn('Could not write auto-announcement to Firestore (offline fallback):', err);
  }
}
