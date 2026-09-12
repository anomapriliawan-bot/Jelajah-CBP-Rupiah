/**
 * Upload Service
 * Handles uploading images physically to the server disk (/public/images/)
 * so that they persist permanently in the repository and are preserved when remixed.
 */

import { saveCloudDoc } from './firebase';

export interface ServerUploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  size?: number;
  error?: string;
  dataUrl?: string;
}

export type UploadCategory = 'final-mission' | 'lessons' | 'missions' | 'uploads';

export interface UploadExtraMeta {
  questionId?: string;
  matrixItemId?: string;
  lessonId?: string;
  missionId?: string;
}

/**
 * Upload a File object directly to /api/upload
 */
export async function uploadImageToServer(
  file: File,
  category: UploadCategory = 'uploads',
  extraMeta?: UploadExtraMeta
): Promise<ServerUploadResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const result = await uploadDataUrlToServer(file.name, dataUrl, category, extraMeta);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a DataURL (base64 string) to /api/upload and Firestore uploaded_images
 */
export async function uploadDataUrlToServer(
  fileName: string,
  dataUrl: string,
  category: UploadCategory = 'uploads',
  extraMeta?: UploadExtraMeta
): Promise<ServerUploadResponse> {
  let publicUrl = '';
  let uploadSucceeded = false;

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        dataUrl,
        category,
      }),
    });

    if (response.ok) {
      const data: ServerUploadResponse = await response.json();
      publicUrl = data.url;
      uploadSucceeded = true;
    }
  } catch (err: any) {
    console.warn('[UploadService] Server upload fetch error, will use cloud/local fallback:', err);
  }

  const finalUrl = publicUrl || dataUrl;

  // Persist image record to Firestore so that all devices/laptops can access it
  try {
    const cleanKey = `${category}_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;
    const payload: any = {
      id: cleanKey,
      fileName,
      url: finalUrl,
      // Store compressed dataUrl in Firestore if under 850KB to guarantee 100% availability across all laptops
      dataUrl: dataUrl && dataUrl.length < 850000 ? dataUrl : '',
      category,
      createdAt: new Date().toISOString(),
    };
    if (extraMeta?.questionId) payload.questionId = extraMeta.questionId;
    if (extraMeta?.matrixItemId) payload.matrixItemId = extraMeta.matrixItemId;
    if (extraMeta?.lessonId) payload.lessonId = extraMeta.lessonId;
    if (extraMeta?.missionId) payload.missionId = extraMeta.missionId;

    saveCloudDoc('uploaded_images', cleanKey, payload).catch(() => {});

    // If questionId is provided, also save an alias record keyed by questionId for instantaneous O(1) lookup
    if (extraMeta?.questionId && category === 'final-mission') {
      const qAliasKey = `fm_q_${extraMeta.questionId.toLowerCase()}`;
      saveCloudDoc('uploaded_images', qAliasKey, {
        ...payload,
        id: qAliasKey,
      }).catch(() => {});
    }

    // If matrixItemId is provided, also save matrix item alias
    if (extraMeta?.matrixItemId && extraMeta?.questionId && category === 'final-mission') {
      const itemAliasKey = `fm_item_${extraMeta.questionId.toLowerCase()}_${extraMeta.matrixItemId.toLowerCase()}`;
      saveCloudDoc('uploaded_images', itemAliasKey, {
        ...payload,
        id: itemAliasKey,
      }).catch(() => {});
    }
  } catch (cloudErr) {
    console.warn('[UploadService] Firestore cloud image record notice:', cloudErr);
  }

  return {
    success: uploadSucceeded || Boolean(dataUrl),
    url: finalUrl,
    fileName,
    dataUrl,
  };
}

/**
 * Delete a previously uploaded image file from the server
 */
export async function deleteImageFromServer(url: string): Promise<boolean> {
  if (!url || !url.startsWith('/images/')) return false;

  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
