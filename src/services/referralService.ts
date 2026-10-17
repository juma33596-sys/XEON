import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, Transaction } from '../types';

export const REFERRAL_BONUS_COINS = 500;

export async function getReferralStats(referralCode: string): Promise<{ totalReferred: number; friends: Array<{ username: string; date: string }> }> {
  try {
    const q = query(
      collection(db, 'users'),
      where('referredBy', '==', referralCode)
    );
    const snap = await getDocs(q);
    const friends = snap.docs.map((d) => {
      const data = d.data() as UserProfile;
      return {
        username: data.username,
        date: data.createdAt,
      };
    });
    return {
      totalReferred: friends.length,
      friends,
    };
  } catch (err) {
    return { totalReferred: 0, friends: [] };
  }
}

export async function claimReferralBonusIfApplicable(currentUser: UserProfile, referrerCode: string): Promise<boolean> {
  if (!referrerCode || referrerCode === currentUser.referralCode) {
    return false;
  }

  // Find referrer user document
  try {
    const q = query(
      collection(db, 'users'),
      where('referralCode', '==', referrerCode)
    );
    const snap = await getDocs(q);
    if (snap.empty) return false;

    const referrer = snap.docs[0].data() as UserProfile;
    const referrerId = referrer.userId;
    const refereeId = currentUser.userId;

    const claimKey = `ref_${referrerId}_${refereeId}`;
    const claimRef = doc(db, 'referrals', claimKey);

    return await runTransaction(db, async (txn) => {
      const claimSnap = await txn.get(claimRef);
      if (claimSnap.exists()) {
        return false; // Already credited
      }

      // Credit referee wallet
      const refereeWalletRef = doc(db, 'wallets', refereeId);
      const refereeWalletSnap = await txn.get(refereeWalletRef);
      const refCoins = refereeWalletSnap.exists() ? refereeWalletSnap.data().coins || 0 : 0;

      // Credit referrer wallet
      const referrerWalletRef = doc(db, 'wallets', referrerId);
      const referrerWalletSnap = await txn.get(referrerWalletRef);
      const hostCoins = referrerWalletSnap.exists() ? referrerWalletSnap.data().coins || 0 : 0;

      txn.update(refereeWalletRef, {
        coins: refCoins + REFERRAL_BONUS_COINS,
        updatedAt: new Date().toISOString(),
      });

      txn.update(referrerWalletRef, {
        coins: hostCoins + REFERRAL_BONUS_COINS,
        updatedAt: new Date().toISOString(),
      });

      const txReferee = `tx_ref_referee_${Date.now()}`;
      const txReferrer = `tx_ref_referrer_${Date.now()}`;

      txn.set(doc(db, 'transactions', txReferee), {
        id: txReferee,
        userId: refereeId,
        type: 'referral_reward',
        currency: 'coins',
        amount: REFERRAL_BONUS_COINS,
        description: `Referral welcome bonus via ${referrer.username}`,
        createdAt: new Date().toISOString(),
      });

      txn.set(doc(db, 'transactions', txReferrer), {
        id: txReferrer,
        userId: referrerId,
        type: 'referral_reward',
        currency: 'coins',
        amount: REFERRAL_BONUS_COINS,
        description: `Referral reward for inviting ${currentUser.username}`,
        createdAt: new Date().toISOString(),
      });

      txn.set(claimRef, {
        id: claimKey,
        referrerId,
        refereeId,
        rewardAmount: REFERRAL_BONUS_COINS,
        createdAt: new Date().toISOString(),
      });

      return true;
    });
  } catch (err) {
    console.warn('Referral reward skipped or already applied:', err);
    return false;
  }
}
