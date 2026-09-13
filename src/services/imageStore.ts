import {
  SVG_UANG_KERTAS_100K,
  SVG_KARTU_DEBIT_GPN,
  SVG_EWALLET_SERVER,
  SVG_EMONEY_KARTU,
  SVG_UANG_LOGAM_RUPIAH,
} from '../data/q38Assets';
import { getCloudDoc, getCloudCollection } from './firebase';

/**
 * High-Capacity Persistent Image Store
 * Uses IndexedDB as primary high-capacity storage (virtually unlimited quota),
 * combined with an instant in-memory cache.
 * Large images are NEVER stored in localStorage to prevent exceeding the browser 5MB quota.
 */

const DB_NAME = 'cbr_edu_image_db_v2';
const DB_VERSION = 1;
const STORE_NAME = 'lesson_illustrations';

// In-memory cache for synchronous, zero-latency access across all React components
const inMemoryImageCache = new Map<string, string>();

// In-memory cache for high-capacity generic data payloads (e.g. Final Mission questions)
const inMemoryPayloadCache = new Map<string, any>();

// Pre-seed Q38 vector assets into memory cache
function seedDefaultQ38Assets() {
  const defaults: [string[], string][] = [
    [['fm_item_Q38_item_1', 'fm_item_item_1', 'uang_kertas_100k_tunai.png', 'uang_kertas_100k'], SVG_UANG_KERTAS_100K],
    [['fm_item_Q38_item_2', 'fm_item_item_2', 'debit_gpn.png', 'kartu_debit'], SVG_KARTU_DEBIT_GPN],
    [['fm_item_Q38_item_3', 'fm_item_item_3', 'ewallet_server.png', 'ewallet'], SVG_EWALLET_SERVER],
    [['fm_item_Q38_item_4', 'fm_item_item_4', 'emoney_kartu.png', 'emoney'], SVG_EMONEY_KARTU],
    [['fm_item_Q38_item_5', 'fm_item_item_5', 'uang_logam_rupiah.png', 'uang_logam'], SVG_UANG_LOGAM_RUPIAH],
  ];

  defaults.forEach(([keys, val]) => {
    keys.forEach((k) => inMemoryImageCache.set(k, val));
  });
}

seedDefaultQ38Assets();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target?.result as IDBDatabase;
          if (db && !db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };
        req.onsuccess = (e: any) => {
          resolve(e.target?.result as IDBDatabase);
        };
        req.onerror = () => {
          console.warn('[ImageStore] IndexedDB open error, using localStorage fallback');
          resolve(null);
        };
      } catch (err) {
        console.warn('[ImageStore] IndexedDB exception:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

/**
 * Purge legacy image and payload keys from localStorage to free up 5MB quota
 */
export function purgeLegacyLocalStorageImages(): number {
  if (typeof window === 'undefined') return 0;
  let purgedCount = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith('cbr_img_') ||
        key.startsWith('img_mat_') ||
        key.startsWith('img_les_') ||
        key.startsWith('fm_item_') ||
        key.startsWith('fm_q_')
      ) {
        keysToRemove.push(key);
      } else if (key === 'jr_db_final_mission_questions_v1') {
        keysToRemove.push(key);
      } else if (!key.startsWith('jr_db_')) {
        const val = localStorage.getItem(key);
        if (val && (val.startsWith('data:image/') || val.startsWith('data:') || val.length > 5000)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      purgedCount++;
    });
    if (purgedCount > 0) {
      console.info(`[ImageStore] Purged ${purgedCount} legacy image/payload keys from localStorage`);
    }
  } catch (err) {
    console.warn('[ImageStore] Error purging localStorage image keys:', err);
  }
  return purgedCount;
}

/**
 * Initialize image and payload cache from IndexedDB and LocalStorage.
 * Call this on app startup.
 */
export async function initImageStore(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. First check and migrate Final Mission questions from localStorage to IndexedDB to eliminate quota errors
  try {
    const legacyFMQ = localStorage.getItem('jr_db_final_mission_questions_v1');
    if (legacyFMQ) {
      try {
        const parsed = JSON.parse(legacyFMQ);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryPayloadCache.set('jr_db_final_mission_questions_v1', parsed);
          await savePayloadToStore('jr_db_final_mission_questions_v1', parsed);
        }
      } catch (parseErr) {
        console.warn('[ImageStore] Error parsing legacy final mission questions:', parseErr);
      }
      localStorage.removeItem('jr_db_final_mission_questions_v1');
      console.info('[ImageStore] Migrated jr_db_final_mission_questions_v1 from localStorage to IndexedDB');
    }
  } catch (err) {
    console.warn('[ImageStore] localStorage final mission questions migration error:', err);
  }

  // 2. Populate from localStorage legacy images, migrate to memory & IndexedDB, then free up localStorage quota
  try {
    const keysToMigrate: Array<{ key: string; val: string }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith('cbr_img_') ||
        key.startsWith('img_mat_') ||
        key.startsWith('img_les_') ||
        key.startsWith('fm_item_') ||
        key.startsWith('fm_q_')
      ) {
        const val = localStorage.getItem(key);
        if (val) {
          keysToMigrate.push({ key, val });
          const cleanKey = key.replace(/^cbr_img_|^img_mat_|^img_les_/, '');
          inMemoryImageCache.set(cleanKey, val);
          inMemoryImageCache.set(key, val);
        }
      } else if (!key.startsWith('jr_db_')) {
        const val = localStorage.getItem(key);
        if (val && (val.startsWith('data:image/') || val.startsWith('data:') || val.length > 10000)) {
          keysToMigrate.push({ key, val });
          inMemoryImageCache.set(key, val);
        }
      }
    }

    // Persist migrated items to IndexedDB
    if (keysToMigrate.length > 0) {
      const idb = await getIndexedDB();
      if (idb) {
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        keysToMigrate.forEach(({ key, val }) => {
          store.put({ key, dataUrl: val, updatedAt: Date.now() });
          const cleanKey = key.replace(/^cbr_img_|^img_mat_|^img_les_/, '');
          store.put({ key: cleanKey, dataUrl: val, updatedAt: Date.now() });
        });
      }
      // Purge from localStorage to recover quota
      purgeLegacyLocalStorageImages();
    }
  } catch (err) {
    console.warn('[ImageStore] localStorage image migration error:', err);
  }

  // 3. Populate and merge from IndexedDB (high capacity)
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as Array<{ key: string; dataUrl?: string; payload?: any }>;
        if (items && Array.isArray(items)) {
          items.forEach((item) => {
            if (item.key && item.dataUrl) {
              inMemoryImageCache.set(item.key, item.dataUrl);
            }
            if (item.key && item.payload !== undefined) {
              inMemoryPayloadCache.set(item.key, item.payload);
            }
          });
        }
      };
    }
  } catch (err) {
    console.warn('[ImageStore] IndexedDB load error:', err);
  }
}

// Auto-run init
if (typeof window !== 'undefined') {
  initImageStore();
}

/**
 * Helper to build all lookup keys for a lesson image
 */
export function buildLessonImageKeys(
  lessonId: string,
  missionId?: string,
  contentOrder?: number | string,
  code?: string
): string[] {
  const keys: string[] = [];
  if (lessonId) {
    keys.push(lessonId);
    keys.push(lessonId.toLowerCase());
    keys.push(`cbr_img_${lessonId}`);
  }
  if (code && code !== lessonId) {
    keys.push(code);
    keys.push(code.toLowerCase());
    keys.push(`cbr_img_${code}`);
  }
  if (missionId && contentOrder) {
    const m = String(missionId).toUpperCase();
    const o = Number(contentOrder);
    keys.push(`${m}_${o}`);
    keys.push(`cbr_img_${m}_${o}`);
    keys.push(`${m.toLowerCase()}_${o}`);
  }
  return Array.from(new Set(keys));
}

/**
 * Save image into Memory Cache, IndexedDB, and optional LocalStorage
 */
export async function saveImageToStore(
  primaryKey: string,
  dataUrl: string,
  aliasKeys: string[] = []
): Promise<boolean> {
  if (!primaryKey) return false;

  const allKeys = Array.from(new Set([primaryKey, ...aliasKeys]));

  // 1. Instant Synchronous In-Memory Cache
  allKeys.forEach((k) => inMemoryImageCache.set(k, dataUrl));

  // 2. Persist to IndexedDB (asynchronous, high quota)
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      allKeys.forEach((k) => {
        store.put({ key: k, dataUrl, updatedAt: Date.now() });
      });
    }
  } catch (err) {
    console.warn('[ImageStore] IndexedDB save warning:', err);
  }

  // IndexedDB + inMemoryImageCache handles persistence safely with zero localStorage pollution
  return true;
}

/**
 * Synchronous get image from in-memory cache or localStorage
 */
export function getImageFromStore(keys: string | string[]): string {
  const keyList = Array.isArray(keys) ? keys : [keys];

  for (const k of keyList) {
    if (!k) continue;
    // 1. In-memory cache
    const fromMem = inMemoryImageCache.get(k);
    if (fromMem && fromMem.trim() !== '') return fromMem;

    // 2. LocalStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const fromLs =
          localStorage.getItem(k) ||
          localStorage.getItem(`cbr_img_${k}`) ||
          localStorage.getItem(`img_mat_${k}`);
        if (fromLs && fromLs.trim() !== '') {
          inMemoryImageCache.set(k, fromLs);
          return fromLs;
        }
      } catch {
        // ignore
      }
    }
  }

  return '';
}

/**
 * Synchronously checks if an image is readily available in memory or localStorage
 */
export function isImageAvailable(keys: string | string[]): boolean {
  return Boolean(getImageFromStore(keys));
}

/**
 * Asynchronously retrieve an image, checking Memory Cache -> IndexedDB -> Cloud Firestore (uploaded_images).
 * If found in Cloud Firestore, it primes both the Memory Cache and IndexedDB so subsequent loads are instant.
 */
export async function getImageWithCloudFallback(keys: string | string[]): Promise<string> {
  // 1. Check sync memory & localStorage first
  const syncResult = getImageFromStore(keys);
  if (syncResult && (syncResult.startsWith('data:') || syncResult.startsWith('http') || syncResult.startsWith('/'))) {
    return syncResult;
  }

  const keyList = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
  if (keyList.length === 0) return '';

  // 2. Check IndexedDB directly if memory was empty
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      for (const k of keyList) {
        const res: any = await new Promise((resolve) => {
          const req = store.get(k);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
        if (res && res.dataUrl) {
          inMemoryImageCache.set(k, res.dataUrl);
          return res.dataUrl;
        }
      }
    }
  } catch {
    // continue to cloud
  }

  // 3. Fallback: Query Cloud Firestore 'uploaded_images'
  try {
    for (const rawKey of keyList) {
      const cleanKey = rawKey.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const cloudDoc = await getCloudDoc('uploaded_images', cleanKey);
      if (cloudDoc && (cloudDoc.dataUrl || cloudDoc.url)) {
        const foundUrl = cloudDoc.dataUrl || cloudDoc.url;
        // Cache to memory and IndexedDB for zero latency next time
        saveImageToStore(rawKey, foundUrl, keyList);
        return foundUrl;
      }
    }
  } catch (err) {
    // Ignore offline or quota limits
  }

  return '';
}

let hasSyncedCloudImages = false;

/**
 * Pre-cache all uploaded images from Cloud Firestore into in-memory store and IndexedDB.
 * Ensures student devices immediately have all teacher/admin uploaded images ready.
 */
export async function syncUploadedImagesFromCloud(): Promise<number> {
  if (typeof window === 'undefined' || hasSyncedCloudImages) return 0;
  try {
    const items = await getCloudCollection<any>('uploaded_images');
    if (items && Array.isArray(items) && items.length > 0) {
      let count = 0;
      for (const item of items) {
        const url = item.dataUrl || item.url;
        if (!url) continue;
        const keys = [
          item.id,
          item.id?.toLowerCase(),
          item.fileName,
          item.fileName?.toLowerCase(),
          item.questionId ? `fm_q_${item.questionId}` : '',
          item.questionId ? `fm_q_${item.questionId.toLowerCase()}` : '',
          item.questionId,
          item.lessonId ? `lesson_${item.lessonId}` : '',
          item.lessonId,
        ].filter(Boolean);

        keys.forEach((k) => inMemoryImageCache.set(k, url));
        count++;
      }
      hasSyncedCloudImages = true;
      console.info(`[ImageStore] Synced ${count} images from Cloud Firestore to inMemoryImageCache!`);
      return count;
    }
  } catch (err) {
    console.warn('[ImageStore] Cloud images sync notice (offline or quota reached):', err);
  }
  return 0;
}

/**
 * Delete image from all stores
 */
export async function deleteImageFromStore(keys: string | string[]): Promise<void> {
  const keyList = Array.isArray(keys) ? keys : [keys];

  // 1. In-memory
  keyList.forEach((k) => {
    inMemoryImageCache.delete(k);
    inMemoryImageCache.delete(`cbr_img_${k}`);
  });

  // 2. IndexedDB
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      keyList.forEach((k) => {
        store.delete(k);
        store.delete(`cbr_img_${k}`);
      });
    }
  } catch (err) {
    console.warn('[ImageStore] IndexedDB delete error:', err);
  }

  // 3. LocalStorage
  if (typeof window !== 'undefined') {
    keyList.forEach((k) => {
      try {
        localStorage.removeItem(k);
        localStorage.removeItem(`cbr_img_${k}`);
      } catch {
        // ignore
      }
    });
  }
}

/**
 * Save generic high-capacity payload into Memory Cache and IndexedDB
 */
export async function savePayloadToStore(key: string, payload: any): Promise<boolean> {
  if (!key) return false;

  // 1. Instant synchronous memory cache
  inMemoryPayloadCache.set(key, payload);

  // 2. Persist to IndexedDB
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, payload, updatedAt: Date.now() });
    }
    return true;
  } catch (err) {
    console.warn('[ImageStore] IndexedDB savePayload warning:', err);
    return false;
  }
}

/**
 * Synchronous get payload from in-memory cache
 */
export function getPayloadFromStoreSync<T = any>(key: string): T | null {
  if (!key) return null;
  const val = inMemoryPayloadCache.get(key);
  return val !== undefined ? (val as T) : null;
}

/**
 * Asynchronous get payload from IndexedDB
 */
export async function getPayloadFromStore<T = any>(key: string): Promise<T | null> {
  if (!key) return null;
  const fromMem = inMemoryPayloadCache.get(key);
  if (fromMem !== undefined) return fromMem as T;

  try {
    const idb = await getIndexedDB();
    if (idb) {
      return new Promise((resolve) => {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const res = req.result;
          if (res && res.payload !== undefined) {
            inMemoryPayloadCache.set(key, res.payload);
            resolve(res.payload as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    }
  } catch (err) {
    console.warn('[ImageStore] IndexedDB getPayload error:', err);
  }
  return null;
}

/**
 * Delete payload from memory and IndexedDB
 */
export async function deletePayloadFromStore(key: string): Promise<void> {
  if (!key) return;
  inMemoryPayloadCache.delete(key);
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
    }
  } catch (err) {
    console.warn('[ImageStore] IndexedDB deletePayload error:', err);
  }
}

