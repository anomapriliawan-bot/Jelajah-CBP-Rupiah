/**
 * Image compression and optimization utility
 * Handles automatic resizing, format optimization, and transparency preservation.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

/**
 * Compresses and resizes a logo image file while strictly preserving transparency (PNG/SVG/WebP).
 * Optimized to run fast without blocking the UI thread or exceeding localStorage quota.
 */
export async function compressLogoImage(
  file: File,
  maxDimension = 360
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  // For SVG files, read directly
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          dataUrl,
          originalSizeKb,
          compressedSizeKb: originalSizeKb,
          width: maxDimension,
          height: maxDimension,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Create an object URL for memory-efficient and rapid decoding
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };

    img.onerror = () => {
      cleanup();
      // Fallback to FileReader if objectURL decoding fails
      const reader = new FileReader();
      reader.onload = (ev) => {
        const fallbackUrl = (ev.target?.result as string) || '';
        resolve({
          dataUrl: fallbackUrl,
          originalSizeKb,
          compressedSizeKb: originalSizeKb,
          width: 300,
          height: 300,
        });
      };
      reader.onerror = () => {
        resolve({
          dataUrl: '',
          originalSizeKb,
          compressedSizeKb: 0,
          width: 0,
          height: 0,
        });
      };
      reader.readAsDataURL(file);
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          width = maxDimension;
          height = maxDimension;
        }

        // Calculate aspect-ratio-preserving dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Ensure minimum 1px dimension
        width = Math.max(1, width);
        height = Math.max(1, height);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          cleanup();
          resolve({
            dataUrl: '',
            originalSizeKb,
            compressedSizeKb: 0,
            width,
            height,
          });
          return;
        }

        // Smooth scaling for crisp logos
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG to preserve transparent backgrounds
        let compressedDataUrl = canvas.toDataURL('image/png');
        
        // If PNG output is unexpectedly huge or fails, try WebP
        if (!compressedDataUrl || compressedDataUrl.length > 500000) {
          try {
            const webpUrl = canvas.toDataURL('image/webp', 0.9);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
              compressedDataUrl = webpUrl;
            }
          } catch {
            // keep png
          }
        }

        cleanup();

        const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeKb,
          compressedSizeKb,
          width,
          height,
        });
      } catch (err) {
        cleanup();
        console.error('Error compressing logo:', err);
        resolve({
          dataUrl: '',
          originalSizeKb,
          compressedSizeKb: 0,
          width: 0,
          height: 0,
        });
      }
    };

    img.src = objectUrl;
  });
}

export async function compressImageFile(
  file: File,
  maxDimension = 860,
  quality = 0.76
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  // SVG files are vector, read as-is
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return compressLogoImage(file, maxDimension);
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };

    img.onerror = () => {
      cleanup();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const fallbackUrl = (ev.target?.result as string) || '';
        resolve({
          dataUrl: fallbackUrl,
          originalSizeKb,
          compressedSizeKb: Math.round(fallbackUrl.length / 1024),
          width: 400,
          height: 400,
        });
      };
      reader.onerror = () => {
        resolve({
          dataUrl: '',
          originalSizeKb,
          compressedSizeKb: 0,
          width: 0,
          height: 0,
        });
      };
      reader.readAsDataURL(file);
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          width = maxDimension;
          height = maxDimension;
        }

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        width = Math.max(1, width);
        height = Math.max(1, height);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          cleanup();
          resolve({
            dataUrl: '',
            originalSizeKb,
            compressedSizeKb: 0,
            width,
            height,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal balance of quality and microscopic file size
        let compressedDataUrl = '';
        try {
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
        } catch {
          // ignore
        }

        // Fallback to JPEG if browser doesn't support WebP export
        if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/webp')) {
          try {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          } catch {
            compressedDataUrl = canvas.toDataURL('image/png');
          }
        }

        cleanup();

        const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeKb,
          compressedSizeKb,
          width,
          height,
        });
      } catch (err) {
        cleanup();
        console.error('Error compressing image:', err);
        resolve({
          dataUrl: '',
          originalSizeKb,
          compressedSizeKb: 0,
          width: 0,
          height: 0,
        });
      }
    };

    img.src = objectUrl;
  });
}

