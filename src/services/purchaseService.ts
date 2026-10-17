import {
  doc,
  collection,
  runTransaction,
  getDocs,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, Product, Transaction, ProductSecret } from '../types';

export async function purchaseProductAtomic(userId: string, productId: string): Promise<Order> {
  const productRef = doc(db, 'products', productId);
  const walletRef = doc(db, 'wallets', userId);
  const secretRef = doc(db, 'productSecrets', productId);

  try {
    return await runTransaction(db, async (txn) => {
      // 1. Authoritative product read
      const prodSnap = await txn.get(productRef);
      if (!prodSnap.exists()) {
        throw new Error('Product not found or unavailable');
      }
      const product = prodSnap.data() as Product;
      if (product.status !== 'published') {
        throw new Error('This item is currently unpublished or out of stock.');
      }

      // 2. Authoritative wallet read
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('Wallet not initialized. Please top up your balance.');
      }
      const wallet = walletSnap.data();
      const currentCoins = wallet.coins || 0;
      const currentDiamonds = wallet.diamonds || 0;

      // 3. Balance verification
      if (product.currency === 'coins') {
        if (currentCoins < product.price) {
          throw new Error(
            `Insufficient Coins. Required: ${product.price.toLocaleString()}, Available: ${currentCoins.toLocaleString()}`
          );
        }
      } else {
        if (currentDiamonds < product.price) {
          throw new Error(
            `Insufficient Diamonds. Required: ${product.price}, Available: ${currentDiamonds}`
          );
        }
      }

      // 4. Secret template read (for license key if available)
      const secretSnap = await txn.get(secretRef);
      let generatedKey: string | undefined;
      let downloadUrl: string | undefined;

      if (secretSnap.exists()) {
        const secret = secretSnap.data() as ProductSecret;
        downloadUrl = secret.downloadUrl;
        if (secret.licenseKeyTemplate) {
          generatedKey = `${secret.licenseKeyTemplate.replace(/2026/, Math.random().toString(36).substring(2, 6).toUpperCase())}`;
        }
      } else {
        generatedKey = `NEX-KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        downloadUrl = `https://download.nexora.market/secure/${product.slug}.zip`;
      }

      // 5. Compute new wallet balances
      const newCoins = product.currency === 'coins' ? currentCoins - product.price : currentCoins;
      const newDiamonds = product.currency === 'diamonds' ? Number((currentDiamonds - product.price).toFixed(2)) : currentDiamonds;

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newOrder: Order = {
        id: orderId,
        userId,
        productId: product.id,
        productTitle: product.title,
        productImage: product.imageUrls?.[0] || '',
        pricePaid: product.price,
        currency: product.currency,
        deliveryType: product.deliveryType,
        status: product.deliveryType === 'download' ? 'completed' : 'processing',
        licenseKey: generatedKey,
        downloadUrl,
        createdAt: new Date().toISOString(),
      };

      const txId = `tx_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const ledgerEntry: Transaction = {
        id: txId,
        userId,
        type: 'purchase',
        currency: product.currency,
        amount: -product.price,
        description: `Purchased "${product.title}"`,
        referenceId: orderId,
        createdAt: new Date().toISOString(),
      };

      // Atomic commit
      txn.update(walletRef, {
        coins: newCoins,
        diamonds: newDiamonds,
        updatedAt: new Date().toISOString(),
      });

      txn.set(doc(db, 'orders', orderId), newOrder);
      txn.set(doc(db, 'transactions', txId), ledgerEntry);

      return newOrder;
    });
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    if (
      rawMsg.includes('Insufficient') ||
      rawMsg.includes('Product not found') ||
      rawMsg.includes('unpublished') ||
      rawMsg.includes('Wallet not initialized')
    ) {
      const cleanMsg = rawMsg.replace(/^Transaction failed:\s*(Error:\s*)?/i, '').trim();
      throw new Error(cleanMsg);
    }
    handleFirestoreError(err, OperationType.WRITE, `orders`);
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const orders = snap.docs.map((d) => d.data() as Order);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'orders');
  }
}

export async function getAllOrdersAdmin(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const orders = snap.docs.map((d) => d.data() as Order);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'orders');
  }
}

/**
 * AUTHORIZED DOWNLOAD RETRIEVAL
 * Strictly verifies user authorization before revealing secure link.
 */
export async function getAuthorizedDownload(userId: string, productId: string, isAdmin: boolean): Promise<{ downloadUrl: string; licenseKey?: string; instructions?: string }> {
  if (isAdmin) {
    const secretSnap = await getDoc(doc(db, 'productSecrets', productId));
    if (secretSnap.exists()) {
      const s = secretSnap.data() as ProductSecret;
      return { downloadUrl: s.downloadUrl, instructions: s.instructions };
    }
  }

  // Verify that the user has a confirmed completed order for this product
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('Access denied: You do not have an active order for this digital asset.');
  }

  const order = snap.docs[0].data() as Order;
  if (order.status !== 'completed' && order.deliveryType === 'manual') {
    throw new Error('This order is currently undergoing manual dispatch. Check back shortly.');
  }

  const secretSnap = await getDoc(doc(db, 'productSecrets', productId));
  const secret = secretSnap.exists() ? (secretSnap.data() as ProductSecret) : null;

  return {
    downloadUrl: order.downloadUrl || secret?.downloadUrl || `https://download.nexora.market/secure/package_${productId}.zip`,
    licenseKey: order.licenseKey,
    instructions: secret?.instructions || 'Extract files to target destination and apply required configurations.',
  };
}
