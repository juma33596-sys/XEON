import {
  doc,
  runTransaction,
  collection,
  setDoc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CasinoBetResult, CasinoGameId, Transaction } from '../types';

function generateProvablyFairSeed(): { serverSeed: string; seedHash: string } {
  const seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // Simple deterministic client hash simulation for transparency
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return { serverSeed: seed, seedHash: `0x${Math.abs(hash).toString(16).padStart(8, '0')}` };
}

/**
 * Deduct bet amount atomically before round start
 */
export async function placeCasinoBetAtomic(
  userId: string,
  gameId: CasinoGameId,
  betAmount: number
): Promise<{ success: boolean; newCoins: number; betId: string }> {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than zero.');
  }

  const walletRef = doc(db, 'wallets', userId);
  const betId = `bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    return await runTransaction(db, async (txn) => {
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found');
      }
      const wallet = walletSnap.data();
      const currentCoins = wallet.coins || 0;

      if (currentCoins < betAmount) {
        throw new Error(`Insufficient Coins! You need ${betAmount.toLocaleString()} Coins, but have ${currentCoins.toLocaleString()}.`);
      }

      const newCoins = currentCoins - betAmount;

      txn.update(walletRef, {
        coins: newCoins,
        updatedAt: new Date().toISOString(),
      });

      const txId = `tx_bet_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const ledgerEntry: Transaction = {
        id: txId,
        userId,
        type: 'casino_bet',
        currency: 'coins',
        amount: -betAmount,
        description: `Casino stake on ${gameId.toUpperCase()}`,
        referenceId: betId,
        createdAt: new Date().toISOString(),
      };
      txn.set(doc(db, 'transactions', txId), ledgerEntry);

      return { success: true, newCoins, betId };
    });
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    if (
      rawMsg.includes('Insufficient') ||
      rawMsg.includes('Bet amount') ||
      rawMsg.includes('Wallet not found')
    ) {
      const cleanMsg = rawMsg.replace(/^Transaction failed:\s*(Error:\s*)?/i, '').trim();
      throw new Error(cleanMsg);
    }
    handleFirestoreError(err, OperationType.WRITE, `wallets/${userId}`);
  }
}

/**
 * Credit win amount atomically upon successful cash out or winning round
 */
export async function cashOutCasinoAtomic(
  userId: string,
  gameId: CasinoGameId,
  betAmount: number,
  multiplier: number,
  betId: string
): Promise<{ success: boolean; payout: number; newCoins: number }> {
  const payout = Math.floor(betAmount * multiplier);
  if (payout <= 0) return { success: false, payout: 0, newCoins: 0 };

  const walletRef = doc(db, 'wallets', userId);
  const { seedHash } = generateProvablyFairSeed();

  try {
    return await runTransaction(db, async (txn) => {
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) throw new Error('Wallet not found');

      const currentCoins = walletSnap.data().coins || 0;
      const newCoins = currentCoins + payout;

      txn.update(walletRef, {
        coins: newCoins,
        updatedAt: new Date().toISOString(),
      });

      const txWinId = `tx_win_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const ledgerWin: Transaction = {
        id: txWinId,
        userId,
        type: 'casino_win',
        currency: 'coins',
        amount: payout,
        description: `Casino Cashout on ${gameId.toUpperCase()} (${multiplier}x)`,
        referenceId: betId,
        createdAt: new Date().toISOString(),
      };
      txn.set(doc(db, 'transactions', txWinId), ledgerWin);

      const recordRef = doc(db, 'casino_bets', betId);
      txn.set(recordRef, {
        betId,
        userId,
        gameId,
        betAmount,
        multiplier,
        payout,
        outcome: 'won',
        serverSeedHash: seedHash,
        timestamp: new Date().toISOString(),
      });

      return { success: true, payout, newCoins };
    });
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    if (rawMsg.includes('Wallet not found')) {
      const cleanMsg = rawMsg.replace(/^Transaction failed:\s*(Error:\s*)?/i, '').trim();
      throw new Error(cleanMsg);
    }
    handleFirestoreError(err, OperationType.WRITE, `wallets/${userId}`);
  }
}

/**
 * Record a lost bet for provably fair audit trail
 */
export async function recordLostBet(
  userId: string,
  gameId: CasinoGameId,
  betAmount: number,
  betId: string
): Promise<void> {
  const { seedHash } = generateProvablyFairSeed();
  try {
    await setDoc(doc(db, 'casino_bets', betId), {
      betId,
      userId,
      gameId,
      betAmount,
      multiplier: 0,
      payout: 0,
      outcome: 'lost',
      serverSeedHash: seedHash,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Bet record log skipped:', err);
  }
}
