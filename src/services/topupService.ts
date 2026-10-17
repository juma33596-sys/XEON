import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  runTransaction,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, cleanFirestorePayload, OperationType } from '../lib/firebase';
import { Topup, Pack, PaymentMethod, Transaction } from '../types';
import { INITIAL_PACKS, INITIAL_PAYMENT_METHODS } from '../lib/seedData';

const PACKS_COLLECTION = 'packs';
const METHODS_COLLECTION = 'paymentMethods';
const TOPUPS_COLLECTION = 'topups';

export async function getPacks(): Promise<Pack[]> {
  try {
    const snap = await getDocs(collection(db, PACKS_COLLECTION));
    if (snap.empty) {
      // Seed default packs
      for (const p of INITIAL_PACKS) {
        await setDoc(doc(db, PACKS_COLLECTION, p.id), p);
      }
      return INITIAL_PACKS;
    }
    return snap.docs.map((d) => d.data() as Pack);
  } catch (err) {
    console.warn('Using fallback packs:', err);
    return INITIAL_PACKS;
  }
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const snap = await getDocs(collection(db, METHODS_COLLECTION));
    if (snap.empty) {
      // Seed default payment methods
      for (const m of INITIAL_PAYMENT_METHODS) {
        await setDoc(doc(db, METHODS_COLLECTION, m.id), m);
      }
      return INITIAL_PAYMENT_METHODS;
    }
    return snap.docs.map((d) => d.data() as PaymentMethod);
  } catch (err) {
    console.warn('Using fallback payment methods:', err);
    return INITIAL_PAYMENT_METHODS;
  }
}

export async function submitTopupRequest(data: Omit<Topup, 'id' | 'status' | 'createdAt'>): Promise<Topup> {
  const topupId = `topup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanProofUrl = typeof data.proofUrl === 'string' && data.proofUrl.trim() ? data.proofUrl.trim() : '';
  const topupRecord: Topup = cleanFirestorePayload({
    id: topupId,
    userId: data.userId || '',
    userEmail: data.userEmail || '',
    packId: data.packId || '',
    rewardCurrency: data.rewardCurrency || 'coins',
    rewardAmount: Number(data.rewardAmount) || 0,
    tshPrice: Number(data.tshPrice) || 0,
    paymentNetwork: data.paymentNetwork || '',
    senderPhone: (data.senderPhone || '').trim(),
    transactionReference: (data.transactionReference || '').trim(),
    proofUrl: cleanProofUrl,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(doc(db, TOPUPS_COLLECTION, topupId), topupRecord);
    return topupRecord;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${TOPUPS_COLLECTION}/${topupId}`);
  }
}

export async function getUserTopups(userId: string): Promise<Topup[]> {
  try {
    const q = query(
      collection(db, TOPUPS_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Topup);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, TOPUPS_COLLECTION);
  }
}

export async function getAllTopupsAdmin(): Promise<Topup[]> {
  try {
    const snap = await getDocs(collection(db, TOPUPS_COLLECTION));
    const list = snap.docs.map((d) => d.data() as Topup);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, TOPUPS_COLLECTION);
  }
}

/**
 * ATOMIC TOP-UP APPROVAL
 * Guarantees idempotency: Checks that topup status is exactly 'pending'.
 * Debits/credits wallet and writes to transaction ledger in one atomic commit.
 * Throws if already approved or rejected.
 */
export async function approveTopupAtomic(topupId: string, reviewerId: string, notes?: string): Promise<void> {
  const topupRef = doc(db, TOPUPS_COLLECTION, topupId);

  try {
    await runTransaction(db, async (txn) => {
      const topupSnap = await txn.get(topupRef);
      if (!topupSnap.exists()) {
        throw new Error('Top-up request not found');
      }

      const topup = topupSnap.data() as Topup;
      if (topup.status !== 'pending') {
        throw new Error(`Top-up is already ${topup.status}. Cannot approve again.`);
      }

      const walletRef = doc(db, 'wallets', topup.userId);
      const walletSnap = await txn.get(walletRef);

      const currentCoins = walletSnap.exists() ? (walletSnap.data().coins || 0) : 0;
      const currentDiamonds = walletSnap.exists() ? (walletSnap.data().diamonds || 0) : 0;

      const newCoins = topup.rewardCurrency === 'coins' ? currentCoins + topup.rewardAmount : currentCoins;
      const newDiamonds = topup.rewardCurrency === 'diamonds' ? currentDiamonds + topup.rewardAmount : currentDiamonds;

      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ledgerEntry: Transaction = {
        id: txId,
        userId: topup.userId,
        type: 'topup',
        currency: topup.rewardCurrency,
        amount: topup.rewardAmount,
        description: `Top-up approval via ${topup.paymentNetwork.toUpperCase()} (Ref: ${topup.transactionReference})`,
        referenceId: topup.id,
        createdAt: new Date().toISOString(),
      };

      // 1. Update wallet
      txn.set(walletRef, {
        userId: topup.userId,
        coins: newCoins,
        diamonds: newDiamonds,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Write ledger entry
      txn.set(doc(db, 'transactions', txId), ledgerEntry);

      // 3. Mark topup as approved
      txn.update(topupRef, {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString(),
        adminNotes: notes || 'Verified and approved',
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${TOPUPS_COLLECTION}/${topupId}`);
  }
}

export async function rejectTopup(topupId: string, reviewerId: string, reason: string): Promise<void> {
  const topupRef = doc(db, TOPUPS_COLLECTION, topupId);
  try {
    await runTransaction(db, async (txn) => {
      const topupSnap = await txn.get(topupRef);
      if (!topupSnap.exists()) throw new Error('Topup not found');
      const topup = topupSnap.data() as Topup;
      if (topup.status !== 'pending') throw new Error(`Top-up is already ${topup.status}`);

      txn.update(topupRef, {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString(),
        adminNotes: reason,
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${TOPUPS_COLLECTION}/${topupId}`);
  }
}
