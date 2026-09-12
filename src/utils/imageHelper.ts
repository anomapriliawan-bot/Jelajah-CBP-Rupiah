/**
 * Image helper and normalizer utility.
 * Resolves external image URLs (e.g. Google Drive, Dropbox),
 * handles local file fallback, and provides themed Balinese / Rupiah artwork fallbacks.
 */

import { getImageFromStore } from '../services/imageStore';
import { normalizeMissionId } from '../services/db';

/**
 * Normalizes external image links so they render directly in an <img> tag.
 * Specifically converts:
 * - Google Drive share links -> direct streaming thumbnail / view URL
 * - Dropbox links -> raw file URL
 * - Detects invalid local filesystem paths (C:\, file:///) that browsers block
 */
export function normalizeImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // 1. If it's already a data URL, server static URL, or blob, return as-is
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('images/') || trimmed.startsWith('uploads/')) {
    return `/${trimmed.replace(/^\/+/, '')}`;
  }

  // 2. If it's a local machine path (e.g. C:\Users\..., D:\..., /Users/...)
  if (/^(?:[a-zA-Z]:[\\\/]|file:\/\/|\/Users\/)/i.test(trimmed)) {
    const fileName = trimmed.split(/[\\\/]/).pop() || '';
    if (fileName && /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(fileName)) {
      const fromStore = getImageFromStore([fileName, `cbr_img_${fileName}`, fileName.toLowerCase()]);
      if (fromStore) return fromStore;
      return `/images/uploads/${fileName}`;
    }
    return '';
  }

  // 3. Convert Google Drive share/view links to direct CDN thumbnail image
  // Handles: /file/d/ID, ?id=ID, uc?export=view&id=ID, thumbnail?id=ID, docs.google.com/...
  const gDriveMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.google\.com\/open\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.google\.com\/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/docs\.google\.com\/[^\/]+\/d\/([a-zA-Z0-9_-]+)/i);

  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 4. Convert Dropbox links to direct download
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace(/[?&]dl=0/g, '?raw=1').replace(/[?&]dl=1/g, '?raw=1');
  }

  // 5. Standalone file names (e.g. "c01.jpg", "foto1.png")
  if (/\.(png|jpg|jpeg|webp|svg|gif)$/i.test(trimmed) && !trimmed.includes('/')) {
    const fromStore = getImageFromStore([trimmed, `cbr_img_${trimmed}`, trimmed.toLowerCase()]);
    if (fromStore) return fromStore;
    return `/images/uploads/${trimmed}`;
  }

  return trimmed;
}

/**
 * Checks if a string is likely an image URL or valid image identifier
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const normalized = normalizeImageUrl(url);
  return Boolean(
    normalized &&
      (normalized.startsWith('http://') ||
        normalized.startsWith('https://') ||
        normalized.startsWith('/images/') ||
        normalized.startsWith('data:image/') ||
        normalized.startsWith('blob:') ||
        /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(normalized))
  );
}

/**
 * Resolves the best cover image for a mission with multi-tier fallback:
 * 1. Explicit mission.imageUrl (normalized)
 * 2. mission.openingImageUrl
 * 3. ImageStore (IndexedDB / memory cache)
 * 4. First Lesson image belonging to this mission
 */
export function resolveMissionImage(
  mission: {
    id?: string;
    code?: string;
    worldId?: string;
    imageUrl?: string;
    openingImageUrl?: string;
  },
  lessonsList?: Array<{
    missionId?: string;
    mission_id?: string;
    imageUrl?: string;
    image_url?: string;
  }>
): string {
  if (!mission) return '';

  const canonicalId = normalizeMissionId(mission.id || mission.code);

  // 1. Direct explicit image on mission
  const direct = normalizeImageUrl(mission.imageUrl || (mission as any).openingImageUrl);
  if (direct && isValidImageUrl(direct)) {
    return direct;
  }

  // 2. Check local ImageStore with expanded key variations
  const numMatch = canonicalId.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 0;
  const storeKeys = [
    canonicalId,
    `cbr_img_${canonicalId}`,
    mission.code || '',
    mission.id || '',
    `cover_${canonicalId.toLowerCase()}`,
    `misi_${canonicalId.toLowerCase()}`,
    `cover_${canonicalId.toLowerCase()}.jpg`,
    `cover_${canonicalId.toLowerCase()}.png`,
    num ? `misi_${num}` : '',
    num ? `misi_${num}.jpg` : '',
    num ? `misi_${num}.png` : '',
    num ? `cover_misi_${num}` : '',
    num ? `cover_misi_${num}.png` : '',
    num ? `cover_misi_${num}.jpg` : '',
  ].filter(Boolean);

  const fromStore = getImageFromStore(storeKeys);
  if (fromStore && isValidImageUrl(fromStore)) {
    return fromStore;
  }

  // 3. Fallback to the first lesson of this mission that has an image
  if (lessonsList && Array.isArray(lessonsList) && lessonsList.length > 0) {
    const lessonMatch = lessonsList.find((l) => {
      const lMission = normalizeMissionId(l.missionId || (l as any).mission_id);
      const img = normalizeImageUrl(l.imageUrl || (l as any).image_url);
      return lMission === canonicalId && isValidImageUrl(img);
    });

    if (lessonMatch) {
      const lessonImg = normalizeImageUrl(lessonMatch.imageUrl || (lessonMatch as any).image_url);
      if (isValidImageUrl(lessonImg)) {
        return lessonImg;
      }
    }
  }

  return '';
}
