import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AuditLog,
  SiteEvent,
  Pack,
  PaymentMethod,
  ExchangeRateConfig,
  UserProfile,
  Category,
  SiteSettings,
  Role,
} from '../types';
import { INITIAL_EVENTS, INITIAL_PAYMENT_METHODS } from '../lib/seedData';
import { PRIMARY_ADMIN_EMAIL } from './authService';

const AUDIT_COLLECTION = 'auditLogs';
const EVENTS_COLLECTION = 'events';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const SETTINGS_COLLECTION = 'siteSettings';
const PAYMENT_METHODS_COLLECTION = 'paymentMethods';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_pc_games', name: 'PC Games', description: 'Steam, Epic, and standalone PC digital editions', icon: 'Gamepad2' },
  { id: 'cat_mobile_games', name: 'Mobile Games', description: 'Android & iOS titles, currencies and accounts', icon: 'Smartphone' },
  { id: 'cat_bots', name: 'Bots', description: 'Automated trading, Discord, and Telegram assistants', icon: 'Bot' },
  { id: 'cat_special_apks', name: 'Special APKs', description: 'Optimized build packages and verified utilities', icon: 'Package' },
  { id: 'cat_tools', name: 'Tools', description: 'Key generators, system utilities, and gaming tools', icon: 'Wrench' },
  { id: 'cat_other', name: 'Other digital products', description: 'E-books, vouchers, courses, and assets', icon: 'Layers' },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Nexora Marketplace',
  maintenanceMode: false,
  currencySymbol: 'TSh',
  supportWhatsApp: '+255 700 000 000',
  recipientNumber: '+255 765 432 100',
  recipientName: 'NEXORA VENTURES LTD',
  imgbbApiKey: '027e901693380c0de7d21938fdc8dd70',
  registrationBonusCoins: 1000,
  registrationBonusDiamonds: 1,
  referralRewardCoins: 500,
  coinsPerDiamond: 2000,
  feePercentage: 2,
};

const AUTHORIZED_EMAILS_COLLECTION = 'authorized_admin_emails';

/**
 * Trusted verification of administrative status using Firebase token claims,
 * Firestore admins collection, authorized_admin_emails, or designated super admin email.
 */
export async function verifyAdminAuthorization(user: FirebaseUser | null): Promise<boolean> {
  if (!user) return false;

  const cleanEmail = (user.email || '').toLowerCase().trim();

  // 1. Check primary admin email (edinareginald81@gmail.com)
  if (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // 2. Check authorized_admin_emails collection
  if (cleanEmail) {
    try {
      const emailSnap = await getDoc(doc(db, AUTHORIZED_EMAILS_COLLECTION, cleanEmail));
      if (emailSnap.exists()) {
        return true;
      }
    } catch (e) {
      //
    }
  }

  // 3. Check token custom claims (trusted server-side claims)
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('Could not inspect token claims:', err);
  }

  // 4. Check /admins/{uid} doc
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists()) {
      return true;
    }
  } catch (err) {
    // Might fail if not yet admin, proceed
  }

  // 5. Check user profile role in /users/{uid}
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      return true;
    }
  } catch (err) {
    //
  }

  return false;
}

export interface AuthorizedAdminEmail {
  email: string;
  grantedBy: string;
  grantedAt: string;
}

export async function getAuthorizedAdminEmails(): Promise<AuthorizedAdminEmail[]> {
  const primarySuperAdmin: AuthorizedAdminEmail = {
    email: PRIMARY_ADMIN_EMAIL.toLowerCase(),
    grantedBy: 'Root Super Admin',
    grantedAt: '2026-01-01T00:00:00.000Z',
  };

  try {
    const snap = await getDocs(collection(db, AUTHORIZED_EMAILS_COLLECTION));
    const list: AuthorizedAdminEmail[] = [];
    let hasSuper = false;
    snap.forEach((d) => {
      const data = d.data() as AuthorizedAdminEmail;
      if (data.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
        hasSuper = true;
      }
      list.push(data);
    });
    if (!hasSuper) {
      list.unshift(primarySuperAdmin);
    }
    return list;
  } catch (err) {
    return [primarySuperAdmin];
  }
}

export async function grantAdminToEmail(
  targetEmail: string,
  grantedByAdmin: FirebaseUser
): Promise<void> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  try {
    // 1. Add to authorized_admin_emails
    await setDoc(doc(db, AUTHORIZED_EMAILS_COLLECTION, cleanEmail), {
      email: cleanEmail,
      grantedBy: grantedByAdmin.email || 'admin',
      grantedAt: new Date().toISOString(),
    });

    // 2. If this user is already registered in users collection, promote their document
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      if (uData.email && uData.email.toLowerCase() === cleanEmail) {
        await updateDoc(doc(db, USERS_COLLECTION, uDoc.id), { role: 'admin' });
        await setDoc(
          doc(db, 'admins', uDoc.id),
          {
            adminId: uDoc.id,
            email: cleanEmail,
            assignedBy: grantedByAdmin.email,
            assignedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    // 3. Log audit action
    await logAdminAction(
      grantedByAdmin.uid,
      grantedByAdmin.email || '',
      'GRANT_ADMIN_POWER',
      cleanEmail,
      `Granted administrative privileges to email: ${cleanEmail}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${AUTHORIZED_EMAILS_COLLECTION}/${cleanEmail}`);
  }
}

export async function revokeAdminEmail(
  targetEmail: string,
  revokedByAdmin: FirebaseUser
): Promise<void> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  if (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Cannot revoke super administrator account.');
  }

  try {
    await deleteDoc(doc(db, AUTHORIZED_EMAILS_COLLECTION, cleanEmail));

    // Also update any matching user doc
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      if (uData.email && uData.email.toLowerCase() === cleanEmail) {
        await updateDoc(doc(db, USERS_COLLECTION, uDoc.id), { role: 'user' });
        await deleteDoc(doc(db, 'admins', uDoc.id)).catch(() => {});
      }
    }

    await logAdminAction(
      revokedByAdmin.uid,
      revokedByAdmin.email || '',
      'REVOKE_ADMIN_POWER',
      cleanEmail,
      `Revoked administrative privileges from email: ${cleanEmail}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${AUTHORIZED_EMAILS_COLLECTION}/${cleanEmail}`);
  }
}

export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  target: string,
  details: string
): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const log: AuditLog = {
    id: logId,
    adminId,
    adminEmail,
    action,
    target,
    details,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, AUDIT_COLLECTION, logId), log);
  } catch (err) {
    console.warn('Audit logging failed silently:', err);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, AUDIT_COLLECTION), limit(100));
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as AuditLog);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    return [];
  }
}

// ----------------- USERS -----------------
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    console.warn('Failed to fetch users from Firestore:', err);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: Role, adminUser: FirebaseUser): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      role: newRole,
    });

    // Also update admins collection
    const adminRef = doc(db, 'admins', userId);
    if (newRole === 'admin') {
      await setDoc(adminRef, {
        adminId: userId,
        assignedBy: adminUser.email,
        assignedAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      await deleteDoc(adminRef).catch(() => {});
    }

    await logAdminAction(
      adminUser.uid,
      adminUser.email || '',
      'UPDATE_USER_ROLE',
      userId,
      `Changed user role to ${newRole}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
}

// ----------------- CATEGORIES -----------------
export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (snap.empty) {
      // Seed default categories
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cat).catch(() => {});
      }
      return DEFAULT_CATEGORIES;
    }
    return snap.docs.map((d) => d.data() as Category);
  } catch (err) {
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategory(category: Category, adminUser?: FirebaseUser): Promise<void> {
  try {
    await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), category, { merge: true });
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'SAVE_CATEGORY', category.id, `Saved category: ${category.name}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `categories/${category.id}`);
  }
}

export async function deleteCategory(id: string, adminUser?: FirebaseUser): Promise<void> {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'DELETE_CATEGORY', id, `Deleted category: ${id}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
  }
}

// ----------------- SITE SETTINGS -----------------
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, 'global'));
    if (snap.exists()) {
      const data = snap.data() as SiteSettings;
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...data,
        imgbbApiKey: data.imgbbApiKey?.trim() || DEFAULT_SITE_SETTINGS.imgbbApiKey,
      };
    }
    await setDoc(doc(db, SETTINGS_COLLECTION, 'global'), DEFAULT_SITE_SETTINGS).catch(() => {});
    return DEFAULT_SITE_SETTINGS;
  } catch (err) {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(settings: SiteSettings, adminUser?: FirebaseUser): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'global'), settings, { merge: true });
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'SAVE_SITE_SETTINGS', 'global', `Updated global site settings`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `siteSettings/global`);
  }
}

// ----------------- EVENTS -----------------
export async function getSiteEvents(): Promise<SiteEvent[]> {
  try {
    const snap = await getDocs(collection(db, EVENTS_COLLECTION));
    if (snap.empty) {
      for (const e of INITIAL_EVENTS) {
        await setDoc(doc(db, EVENTS_COLLECTION, e.id), e).catch(() => {});
      }
      return INITIAL_EVENTS;
    }
    return snap.docs.map((d) => d.data() as SiteEvent);
  } catch (err) {
    return INITIAL_EVENTS;
  }
}

export async function saveSiteEvent(event: SiteEvent, adminUser?: FirebaseUser): Promise<void> {
  try {
    await setDoc(doc(db, EVENTS_COLLECTION, event.id), event, { merge: true });
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'SAVE_EVENT', event.id, `Saved event: ${event.title}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${EVENTS_COLLECTION}/${event.id}`);
  }
}

export async function deleteSiteEvent(id: string, adminUser?: FirebaseUser): Promise<void> {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, id));
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'DELETE_EVENT', id, `Deleted event: ${id}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EVENTS_COLLECTION}/${id}`);
  }
}

// ----------------- PACKS -----------------
export async function savePack(pack: Pack): Promise<void> {
  try {
    await setDoc(doc(db, 'packs', pack.id), pack, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `packs/${pack.id}`);
  }
}

export async function deletePack(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'packs', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `packs/${id}`);
  }
}

// ----------------- PAYMENT METHODS -----------------
export async function getPaymentMethodsAdmin(): Promise<PaymentMethod[]> {
  try {
    const snap = await getDocs(collection(db, PAYMENT_METHODS_COLLECTION));
    if (snap.empty) {
      for (const m of INITIAL_PAYMENT_METHODS) {
        await setDoc(doc(db, PAYMENT_METHODS_COLLECTION, m.id), m).catch(() => {});
      }
      return INITIAL_PAYMENT_METHODS;
    }
    return snap.docs.map((d) => d.data() as PaymentMethod);
  } catch (err) {
    return INITIAL_PAYMENT_METHODS;
  }
}

export async function savePaymentMethod(method: PaymentMethod, adminUser?: FirebaseUser): Promise<void> {
  try {
    await setDoc(doc(db, PAYMENT_METHODS_COLLECTION, method.id), method, { merge: true });
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'SAVE_PAYMENT_METHOD', method.id, `Saved payment method: ${method.name}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PAYMENT_METHODS_COLLECTION}/${method.id}`);
  }
}

export async function deletePaymentMethod(id: string, adminUser?: FirebaseUser): Promise<void> {
  try {
    await deleteDoc(doc(db, PAYMENT_METHODS_COLLECTION, id));
    if (adminUser) {
      await logAdminAction(adminUser.uid, adminUser.email || '', 'DELETE_PAYMENT_METHOD', id, `Deleted payment method: ${id}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PAYMENT_METHODS_COLLECTION}/${id}`);
  }
}
