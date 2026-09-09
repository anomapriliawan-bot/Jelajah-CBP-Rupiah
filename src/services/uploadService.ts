/**
 * Upload Service
 * Handles uploading images physically to the server disk (/public/images/)
 * so that they persist permanently in the repository and are preserved when remixed.
 */

export interface ServerUploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  size?: number;
  error?: string;
}

/**
 * Upload a File object directly to /api/upload
 */
export async function uploadImageToServer(
  file: File,
  category: 'final-mission' | 'lessons' | 'uploads' = 'uploads'
): Promise<ServerUploadResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const result = await uploadDataUrlToServer(file.name, dataUrl, category);
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
 * Upload a DataURL (base64 string) to /api/upload
 */
export async function uploadDataUrlToServer(
  fileName: string,
  dataUrl: string,
  category: 'final-mission' | 'lessons' | 'uploads' = 'uploads'
): Promise<ServerUploadResponse> {
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

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const data: ServerUploadResponse = await response.json();
    return data;
  } catch (err: any) {
    console.warn('[UploadService] Server upload failed, falling back to local base64:', err);
    // Fallback: return dataUrl if server is temporarily unreachable in dev mode
    return {
      success: false,
      url: dataUrl,
      fileName,
      error: err.message || 'Server upload failed',
    };
  }
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
