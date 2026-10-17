import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// HARDCODED FIREBASE CONFIGURATION - Connected to project: clear-port-3c70r
export const firebaseConfig = {
  projectId: "clear-port-3c70r",
  appId: "1:956610410066:web:02a5ad6410a31c53bb518b",
  apiKey: "AIzaSyAg_as8BClRdHH98brm1eBYkV8teMrutZs",
  authDomain: "clear-port-3c70r.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-nexorapremiumdig-b53a3a71-b3d3-473c-976f-23299bc9433f",
  storageBucket: "clear-port-3c70r.firebasestorage.app",
  messagingSenderId: "956610410066",
  measurementId: "",
  oAuthClientId: "956610410066-lmihd0b9crdml1nt0siur9n3i2cdl0pe.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Error Handling according to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes `undefined` properties from objects before Firestore persistence.
 * Prevents "Function setDoc() called with invalid data. Unsupported field value: undefined" crashes.
 */
export function cleanFirestorePayload<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(cleanFirestorePayload) as unknown as T;
  }
  const output: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    if (val !== undefined) {
      output[key] = typeof val === 'object' && val !== null ? cleanFirestorePayload(val) : val;
    }
  }
  return output as T;
}

// Validation check on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or initializing.');
    }
    return false;
  }
}
