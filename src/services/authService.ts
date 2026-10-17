import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, Wallet, Transaction } from '../types';
import { claimReferralBonusIfApplicable } from './referralService';

export const PRIMARY_ADMIN_EMAIL = 'edinareginald81@gmail.com';

function generateReferralCode(username: string): string {
  const clean = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean || 'NEX'}-${random}`;
}

export interface SyncProfileResult {
  profile: UserProfile;
  awardedWelcomeBonus: boolean;
}

/**
 * Sync user profile and award exactly 1,000 Coins and 1 Diamond to new users idempotently.
 */
export async function syncUserProfile(user: FirebaseUser, referredByCode?: string): Promise<SyncProfileResult> {
  const userRef = doc(db, 'users', user.uid);
  const walletRef = doc(db, 'wallets', user.uid);
  const adminRef = doc(db, 'admins', user.uid);
  const bonusRef = doc(db, 'registration_bonuses', user.uid);

  try {
    let awardedWelcomeBonus = false;

    // Check if user is an authorized admin
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const isSuperAdminEmail = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

    // Check pre-authorized emails
    let isPreAuthorized = false;
    if (cleanEmail) {
      try {
        const preAuthSnap = await getDoc(doc(db, 'authorized_admin_emails', cleanEmail));
        if (preAuthSnap.exists()) {
          isPreAuthorized = true;
        }
      } catch (e) {
        //
      }
    }

    const adminDocSnap = await getDoc(adminRef);
    const hasAdminDoc = adminDocSnap.exists();
    const isAuthorizedAdmin = isSuperAdminEmail || isPreAuthorized || hasAdminDoc;

    if (isSuperAdminEmail) {
      // Automatically register super admin in authorized_admin_emails
      try {
        await setDoc(doc(db, 'authorized_admin_emails', cleanEmail), {
          email: cleanEmail,
          grantedBy: 'system_root',
          grantedAt: new Date().toISOString(),
          isSuperAdmin: true,
        }, { merge: true });
      } catch (e) {
        //
      }
    }

    if ((isSuperAdminEmail || isPreAuthorized) && !hasAdminDoc) {
      try {
        await setDoc(adminRef, {
          adminId: user.uid,
          email: cleanEmail,
          role: 'admin',
          assignedAt: new Date().toISOString(),
          assignedBy: isSuperAdminEmail ? 'system_root' : 'admin_grant',
        }, { merge: true });
      } catch (e) {
        //
      }
    }

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // BRAND NEW USER REGISTRATION FLOW
      const username = user.displayName || user.email?.split('@')[0] || `User_${user.uid.slice(0, 6)}`;
      const referralCode = generateReferralCode(username);

      const cleanReferredBy = (referredByCode || '').trim().toUpperCase();

      const newProfile: UserProfile = {
        userId: user.uid,
        email: user.email || '',
        username,
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        referralCode,
        referredBy: cleanReferredBy !== referralCode ? cleanReferredBy : '',
        createdAt: new Date().toISOString(),
        role: isAuthorizedAdmin ? 'admin' : 'user',
      };

      // Atomic batch setup: Profile + 1,000 Coins + 1 Diamond + Bonus lock + Ledgers
      await runTransaction(db, async (txn) => {
        const bonusCheck = await txn.get(bonusRef);
        if (!bonusCheck.exists()) {
          // Idempotent lock
          txn.set(bonusRef, {
            userId: user.uid,
            awardedAt: new Date().toISOString(),
            coinsAwarded: 1000,
            diamondsAwarded: 1,
          });

          // Dual currency initial wallet
          const initialWallet: Wallet = {
            userId: user.uid,
            coins: 1000,
            diamonds: 1,
            updatedAt: new Date().toISOString(),
          };
          txn.set(walletRef, initialWallet);

          // Ledger entry 1: 1,000 Coins Welcome Bonus
          const txCoinsId = `tx_welcome_coins_${user.uid}`;
          const coinsLedger: Transaction = {
            id: txCoinsId,
            userId: user.uid,
            type: 'redeem_reward',
            currency: 'coins',
            amount: 1000,
            description: 'New Gamer Registration Welcome Bonus (1,000 Coins)',
            referenceId: 'REG_BONUS_1000C',
            createdAt: new Date().toISOString(),
          };
          txn.set(doc(db, 'transactions', txCoinsId), coinsLedger);

          // Ledger entry 2: 1 Diamond Welcome Bonus
          const txDiamondsId = `tx_welcome_dia_${user.uid}`;
          const diamondsLedger: Transaction = {
            id: txDiamondsId,
            userId: user.uid,
            type: 'redeem_reward',
            currency: 'diamonds',
            amount: 1,
            description: 'New Gamer Registration Welcome Bonus (1 Diamond)',
            referenceId: 'REG_BONUS_1D',
            createdAt: new Date().toISOString(),
          };
          txn.set(doc(db, 'transactions', txDiamondsId), diamondsLedger);

          awardedWelcomeBonus = true;
        }

        txn.set(userRef, newProfile);
      });

      // If valid referral code supplied, apply referral bonus
      if (cleanReferredBy && cleanReferredBy !== referralCode) {
        claimReferralBonusIfApplicable(newProfile, cleanReferredBy).catch((e) =>
          console.warn('Referral bonus processing skipped:', e)
        );
      }

      return { profile: newProfile, awardedWelcomeBonus };
    } else {
      // EXISTING USER SIGN-IN
      const existingData = userSnap.data() as UserProfile;

      // Check if registration bonus was ever awarded, if not (e.g. existing user before bonus feature), award once
      const bonusCheck = await getDoc(bonusRef);
      if (!bonusCheck.exists()) {
        const walletSnap = await getDoc(walletRef);
        const curCoins = walletSnap.exists() ? (walletSnap.data().coins || 0) : 0;
        const curDiamonds = walletSnap.exists() ? (walletSnap.data().diamonds || 0) : 0;

        await runTransaction(db, async (txn) => {
          txn.set(bonusRef, {
            userId: user.uid,
            awardedAt: new Date().toISOString(),
            coinsAwarded: 1000,
            diamondsAwarded: 1,
          });
          txn.set(
            walletRef,
            {
              userId: user.uid,
              coins: curCoins + 1000,
              diamonds: curDiamonds + 1,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        });
        awardedWelcomeBonus = true;
      }

      // Sync admin role if authorized
      if (isAuthorizedAdmin) {
        if (!hasAdminDoc) {
          await setDoc(adminRef, {
            adminId: user.uid,
            email: user.email,
            assignedAt: new Date().toISOString(),
          }, { merge: true });
        }
        if (existingData.role !== 'admin') {
          const updated = { ...existingData, role: 'admin' as const };
          await setDoc(userRef, updated, { merge: true });
          return { profile: updated, awardedWelcomeBonus };
        }
      }

      return { profile: existingData, awardedWelcomeBonus };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function loginWithGoogle(referredByCode?: string): Promise<SyncProfileResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return await syncUserProfile(result.user, referredByCode);
}

export async function registerWithEmail(
  email: string,
  pass: string,
  username: string,
  referredByCode?: string
): Promise<SyncProfileResult> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  await sendEmailVerification(result.user).catch((e) => console.warn('Could not send verification email automatically', e));
  return await syncUserProfile(result.user, referredByCode);
}

export async function loginWithEmail(email: string, pass: string): Promise<SyncProfileResult> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfile(result.user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}
