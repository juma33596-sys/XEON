import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Wallet, Transaction } from '../types';

export function subscribeToWallet(userId: string, onUpdate: (wallet: Wallet) => void) {
  const walletRef = doc(db, 'wallets', userId);
  return onSnapshot(
    walletRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Wallet);
      } else {
        // Fallback default
        onUpdate({
          userId,
          coins: 0,
          diamonds: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `wallets/${userId}`);
    }
  );
}

export async function getWallet(userId: string): Promise<Wallet> {
  const walletRef = doc(db, 'wallets', userId);
  try {
    const snap = await getDoc(walletRef);
    if (!snap.exists()) {
      return {
        userId,
        coins: 0,
        diamonds: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    return snap.data() as Wallet;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `wallets/${userId}`);
  }
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const txs = snap.docs.map((d) => d.data() as Transaction);
    // Sort descending by date
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'transactions');
  }
}
