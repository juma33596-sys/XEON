import {
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  runTransaction,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { RedeemCode, Transaction } from '../types';

const CODES_COLLECTION = 'redeemCodes';
const REDEMPTIONS_COLLECTION = 'redemptions';

export const INITIAL_REDEEM_CODES: RedeemCode[] = [
  {
    code: 'WELCOME1000',
    rewardCurrency: 'coins',
    rewardAmount: 1000,
    maxUses: 50000,
    currentUses: 0,
    expiresAt: '2028-12-31T23:59:59Z',
    isActive: true,
  },
  {
    code: 'WRLCOME1000',
    rewardCurrency: 'coins',
    rewardAmount: 1000,
    maxUses: 50000,
    currentUses: 0,
    expiresAt: '2028-12-31T23:59:59Z',
    isActive: true,
  },
  {
    code: 'NEXORA2026',
    rewardCurrency: 'coins',
    rewardAmount: 2500,
    maxUses: 50000,
    currentUses: 12,
    expiresAt: '2027-12-31T23:59:59Z',
    isActive: true,
  },
  {
    code: 'DIAMONDVIP',
    rewardCurrency: 'diamonds',
    rewardAmount: 2,
    maxUses: 5000,
    currentUses: 4,
    expiresAt: '2027-12-31T23:59:59Z',
    isActive: true,
  },
  {
    code: 'CASINOCHAMP',
    rewardCurrency: 'coins',
    rewardAmount: 500,
    maxUses: 5000,
    currentUses: 0,
    expiresAt: '2028-12-31T23:59:59Z',
    isActive: true,
  },
];

export async function initializeRedeemCodes(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, CODES_COLLECTION));
    if (snap.empty) {
      for (const item of INITIAL_REDEEM_CODES) {
        await setDoc(doc(db, CODES_COLLECTION, item.code), item);
      }
    }
  } catch (err) {
    console.warn('Initial redeem codes check failed:', err);
  }
}

export async function redeemCodeAtomic(userId: string, rawCode: string): Promise<{ currency: string; amount: number }> {
  let code = rawCode.trim().toUpperCase();
  if (!code) throw new Error('Please enter a voucher code.');

  // Handle common typing slip (e.g. R next to E on keyboard)
  if (code === 'WRLCOME1000' || code === 'WELCOM1000' || code === 'WELCOME') {
    code = 'WELCOME1000';
  }

  const codeRef = doc(db, CODES_COLLECTION, code);
  const redemptionId = `${userId}_${code}`;
  const redemptionRef = doc(db, REDEMPTIONS_COLLECTION, redemptionId);
  const walletRef = doc(db, 'wallets', userId);

  try {
    return await runTransaction(db, async (txn) => {
      // 1. Check code definition
      let codeSnap = await txn.get(codeRef);
      let codeData: RedeemCode | null = null;

      if (!codeSnap.exists()) {
        const foundFallback = INITIAL_REDEEM_CODES.find((c) => c.code === code);
        if (foundFallback) {
          codeData = foundFallback;
        } else {
          throw new Error('Invalid promo code. Please double check characters.');
        }
      } else {
        codeData = codeSnap.data() as RedeemCode;
      }

      if (!codeData.isActive) {
        throw new Error('This voucher code is currently deactivated.');
      }

      if (new Date(codeData.expiresAt).getTime() < Date.now()) {
        throw new Error('This voucher code has expired.');
      }

      if (codeData.currentUses >= codeData.maxUses) {
        throw new Error('This voucher code has reached maximum usage capacity.');
      }

      // 2. Check if user already claimed this specific code
      const redemptionSnap = await txn.get(redemptionRef);
      if (redemptionSnap.exists()) {
        throw new Error('You have already claimed this voucher code.');
      }

      // 3. Read wallet
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('User wallet not found.');
      }
      const wallet = walletSnap.data();
      const currentCoins = wallet.coins || 0;
      const currentDiamonds = wallet.diamonds || 0;

      const newCoins = codeData.rewardCurrency === 'coins' ? currentCoins + codeData.rewardAmount : currentCoins;
      const newDiamonds = codeData.rewardCurrency === 'diamonds' ? Number((currentDiamonds + codeData.rewardAmount).toFixed(2)) : currentDiamonds;

      const txId = `tx_rdm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const ledgerEntry: Transaction = {
        id: txId,
        userId,
        type: 'redeem_reward',
        currency: codeData.rewardCurrency,
        amount: codeData.rewardAmount,
        description: `Redeemed voucher code [${code}]`,
        referenceId: code,
        createdAt: new Date().toISOString(),
      };

      // 4. Atomic updates
      txn.set(redemptionRef, {
        id: redemptionId,
        userId,
        code,
        rewardCurrency: codeData.rewardCurrency,
        rewardAmount: codeData.rewardAmount,
        createdAt: new Date().toISOString(),
      });

      txn.update(walletRef, {
        coins: newCoins,
        diamonds: newDiamonds,
        updatedAt: new Date().toISOString(),
      });

      txn.set(doc(db, 'transactions', txId), ledgerEntry);

      if (codeSnap.exists()) {
        txn.update(codeRef, {
          currentUses: codeData.currentUses + 1,
        });
      }

      return { currency: codeData.rewardCurrency, amount: codeData.rewardAmount };
    });
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    if (
      rawMsg.includes('Invalid promo code') ||
      rawMsg.includes('deactivated') ||
      rawMsg.includes('expired') ||
      rawMsg.includes('maximum usage') ||
      rawMsg.includes('already claimed') ||
      rawMsg.includes('wallet not found') ||
      rawMsg.includes('voucher') ||
      rawMsg.includes('code')
    ) {
      const cleanMsg = rawMsg.replace(/^Transaction failed:\s*(Error:\s*)?/i, '').trim();
      throw new Error(cleanMsg);
    }
    handleFirestoreError(err, OperationType.WRITE, `redeemCodes/${code}`);
  }
}

export async function getAllRedeemCodes(): Promise<RedeemCode[]> {
  try {
    const snap = await getDocs(collection(db, CODES_COLLECTION));
    if (snap.empty) {
      await initializeRedeemCodes();
      return INITIAL_REDEEM_CODES;
    }
    return snap.docs.map((d) => d.data() as RedeemCode);
  } catch (err) {
    return INITIAL_REDEEM_CODES;
  }
}

export async function saveRedeemCode(codeObj: RedeemCode): Promise<void> {
  try {
    await setDoc(doc(db, CODES_COLLECTION, codeObj.code), codeObj, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${CODES_COLLECTION}/${codeObj.code}`);
  }
}
