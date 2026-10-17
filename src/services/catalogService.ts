import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, ProductSecret, ProductStatus } from '../types';
import { INITIAL_PRODUCTS } from '../lib/seedData';

const PRODUCTS_COLLECTION = 'products';
const SECRETS_COLLECTION = 'productSecrets';

export async function initializeProductsIfEmpty(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log('Catalog empty, populating initial sample products...');
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), prod);
        // Also seed dummy secret download URL for tests
        await setDoc(doc(db, SECRETS_COLLECTION, prod.id), {
          productId: prod.id,
          downloadUrl: `https://download.nexora.market/secure/builds/${prod.slug}.zip`,
          fileSize: prod.downloadSize || '120 MB',
          instructions: 'Extract archive to your game directory. Run launcher as Administrator.',
          licenseKeyTemplate: `NEX-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`,
        });
      }
      return INITIAL_PRODUCTS;
    }
    return snap.docs.map((d) => d.data() as Product);
  } catch (err) {
    console.warn('Failed to seed catalog or fetch:', err);
    return INITIAL_PRODUCTS;
  }
}

export async function getPublishedProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return await initializeProductsIfEmpty();
    }
    return snap.docs.map((d) => d.data() as Product);
  } catch (err) {
    console.warn('Error reading products from Firestore, using initial seed:', err);
    return INITIAL_PRODUCTS;
  }
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snap.empty) {
      return await initializeProductsIfEmpty();
    }
    return snap.docs.map((d) => d.data() as Product);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, PRODUCTS_COLLECTION);
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
    if (!snap.exists()) {
      const fallback = INITIAL_PRODUCTS.find((p) => p.id === id);
      return fallback || null;
    }
    return snap.data() as Product;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function saveProduct(product: Product, secret?: ProductSecret): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productRef, {
      ...product,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (secret) {
      const secretRef = doc(db, SECRETS_COLLECTION, product.id);
      await setDoc(secretRef, secret, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${product.id}`);
  }
}

export async function updateProductStatus(id: string, status: ProductStatus): Promise<void> {
  try {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    await deleteDoc(doc(db, SECRETS_COLLECTION, id)).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function getProductSecret(productId: string): Promise<ProductSecret | null> {
  try {
    const snap = await getDoc(doc(db, SECRETS_COLLECTION, productId));
    if (!snap.exists()) return null;
    return snap.data() as ProductSecret;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SECRETS_COLLECTION}/${productId}`);
  }
}
