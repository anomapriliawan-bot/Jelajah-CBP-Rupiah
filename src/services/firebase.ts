import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Silence Firestore internal transient connection / retry warnings in iframe/sandboxed environments
try {
  setLogLevel('silent');
} catch {
  // Ignore if already set or unsupported in environment
}

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export interface FirebaseSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
  projectId: string;
  databaseId: string;
}

const config = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
};

// Singleton instance initialization
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });
} else {
  app = getApp();
}

export const firebaseApp = app;

// Initialize Firestore with custom database ID specified in config
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? config.firestoreDatabaseId
      : undefined
  );
} catch {
  firestoreInstance = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);
}

export const firestore: Firestore = firestoreInstance;

// Connection test validator as prescribed by Firebase Integration skill
async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Status tracker
let syncStatus: FirebaseSyncStatus = {
  isConnected: true,
  isSyncing: false,
  lastSynced: null,
  error: null,
  projectId: config.projectId,
  databaseId: config.firestoreDatabaseId,
};

const statusListeners = new Set<(status: FirebaseSyncStatus) => void>();

function notifyStatus() {
  statusListeners.forEach((listener) => {
    try {
      listener({ ...syncStatus });
    } catch (e) {
      console.error('Error notifying Firebase sync status listener:', e);
    }
  });
}

export function subscribeFirebaseStatus(listener: (status: FirebaseSyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener({ ...syncStatus });
  return () => statusListeners.delete(listener);
}

export function getFirebaseSyncStatus(): FirebaseSyncStatus {
  return { ...syncStatus };
}

// Anonymous auth to ensure authenticated session for Firestore access rules
let authInitPromise: Promise<void> | null = null;
export async function initFirebaseAuth(): Promise<void> {
  if (auth.currentUser) {
    syncStatus.isConnected = true;
    return;
  }
  if (authInitPromise) {
    return authInitPromise;
  }

  authInitPromise = (async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      syncStatus.isConnected = true;
      syncStatus.error = null;
      notifyStatus();
    } catch (err: any) {
      // In offline environments or initial startup, handle smoothly
      syncStatus.isConnected = false;
      syncStatus.error = err?.message || 'Authentication error';
      notifyStatus();
    } finally {
      authInitPromise = null;
    }
  })();

  return authInitPromise;
}

/**
 * Save or update single document in Firestore
 */
export async function saveCloudDoc(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(firestore, collectionName, String(docId));
    await setDoc(docRef, {
      ...data,
      _updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    syncStatus.lastSynced = new Date();
    syncStatus.isConnected = true;
    syncStatus.error = null;
    notifyStatus();
  } catch (err: any) {
    console.warn(`[Firebase] Failed to write document ${collectionName}/${docId}:`, err);
    syncStatus.error = err?.message || 'Write error';
    notifyStatus();
  }
}

/**
 * Delete single document from Firestore
 */
export async function deleteCloudDoc(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(firestore, collectionName, String(docId));
    await deleteDoc(docRef);
    syncStatus.lastSynced = new Date();
    syncStatus.isConnected = true;
    syncStatus.error = null;
    notifyStatus();
  } catch (err: any) {
    console.warn(`[Firebase] Failed to delete document ${collectionName}/${docId}:`, err);
    syncStatus.error = err?.message || 'Delete error';
    notifyStatus();
  }
}

/**
 * Load all documents from a Firestore collection
 */
export async function getCloudCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(firestore, collectionName);
    const snap = await getDocs(colRef);
    const results: T[] = [];
    snap.forEach((d) => {
      results.push(d.data() as T);
    });
    return results;
  } catch (err: any) {
    console.warn(`[Firebase] Failed to read collection ${collectionName}:`, err);
    return [];
  }
}

/**
 * Sync initial seed / local data to Firestore in batch if cloud is empty
 */
export async function seedCloudIfEmpty(
  collectionName: string,
  items: Array<{ id?: string; code?: string; [key: string]: any }>,
  idKey: string = 'id'
): Promise<void> {
  try {
    const existing = await getCloudCollection(collectionName);
    if (existing.length === 0 && items.length > 0) {
      console.log(`[Firebase] Seeding ${items.length} records into '${collectionName}'...`);
      const batch = writeBatch(firestore);
      let count = 0;
      for (const item of items) {
        const key = String(item[idKey] || item.code || `item_${count}`);
        const docRef = doc(firestore, collectionName, key);
        batch.set(docRef, { ...item, _seededAt: new Date().toISOString() });
        count++;
        // Firestore batches are limited to 500 operations
        if (count >= 450) break;
      }
      await batch.commit();
      console.log(`[Firebase] Successfully seeded ${count} records into '${collectionName}'!`);
    }
  } catch (err) {
    console.warn(`[Firebase] Failed seeding '${collectionName}':`, err);
  }
}

/**
 * Trigger immediate full sync
 */
export async function triggerManualSync(getDbSnapshot: () => any, onCloudUpdate: (cloudData: any) => void): Promise<boolean> {
  syncStatus.isSyncing = true;
  notifyStatus();

  try {
    await initFirebaseAuth();
    const local = getDbSnapshot();

    // 1. Sync School Settings
    if (local.schoolSettings) {
      await saveCloudDoc('settings', 'school_settings', local.schoolSettings);
    }

    // 2. Sync Users
    if (local.users && Array.isArray(local.users)) {
      for (const user of local.users) {
        if (user.id) {
          await saveCloudDoc('users', user.id, user);
        }
      }
    }

    // 3. Sync Student Progress
    if (local.progress && Array.isArray(local.progress)) {
      for (const p of local.progress) {
        const id = `${p.userId}_${p.missionId}`;
        await saveCloudDoc('student_progress', id, p);
      }
    }

    // 4. Sync Final Mission Progress
    if (local.finalMissionProgress && Array.isArray(local.finalMissionProgress)) {
      for (const fmp of local.finalMissionProgress) {
        const id = `${fmp.userId}_${fmp.classification}`;
        await saveCloudDoc('final_mission_progress', id, fmp);
      }
    }

    // Read back latest from cloud
    const cloudSettings = await getCloudCollection('settings');
    const cloudUsers = await getCloudCollection('users');
    const cloudProgress = await getCloudCollection('student_progress');

    onCloudUpdate({
      schoolSettings: cloudSettings.find((s: any) => s.schoolName) || null,
      users: cloudUsers.length > 0 ? cloudUsers : null,
      progress: cloudProgress.length > 0 ? cloudProgress : null,
    });

    syncStatus.isSyncing = false;
    syncStatus.isConnected = true;
    syncStatus.lastSynced = new Date();
    syncStatus.error = null;
    notifyStatus();
    return true;
  } catch (err: any) {
    console.error('[Firebase] Manual sync failed:', err);
    syncStatus.isSyncing = false;
    syncStatus.error = err?.message || 'Sync failed';
    notifyStatus();
    return false;
  }
}

