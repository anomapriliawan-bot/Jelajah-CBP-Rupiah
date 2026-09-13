import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { getImageFromStore, getImageWithCloudFallback } from '../../services/imageStore';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  lookupKeys?: string[];
  /**
   * If true, gracefully renders null (collapses to 0px) when the image fails to load.
   * Ideal for student-facing quizzes or lessons where missing images should not disrupt the UI.
   */
  hideOnError?: boolean;
  /**
   * If true, displays an elegant educational placeholder card when the image is missing or failed to load.
   * Ideal for admin tables or management views instead of the browser's default broken image icon.
   */
  showPlaceholderOnMissing?: boolean;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Gambar',
  lookupKeys = [],
  hideOnError = false,
  showPlaceholderOnMissing = false,
  fallbackTitle,
  fallbackSubtitle,
  containerClassName = '',
  className = '',
  onError,
  onLoad,
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const [hasTriedCloud, setHasTriedCloud] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setHasFailed(false);
    setHasTriedCloud(false);

    // 1. Direct Data URL or Blob URL (100% reliable, never fails)
    if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
      setCurrentSrc(src);
      return;
    }

    // 2. Check sync in-memory cache & IndexedDB with lookup keys
    if (lookupKeys.length > 0) {
      const fromStore = getImageFromStore(lookupKeys);
      if (fromStore && (fromStore.startsWith('data:') || fromStore.startsWith('http') || fromStore.startsWith('/'))) {
        setCurrentSrc(fromStore);
        return;
      }
    }

    // 3. If standard URL is supplied
    if (src && src.trim() !== '') {
      setCurrentSrc(src.trim());
      return;
    }

    // 4. If no src, try async cloud retrieval
    if (lookupKeys.length > 0) {
      getImageWithCloudFallback(lookupKeys).then((cloudUrl) => {
        if (!isMounted) return;
        if (cloudUrl) {
          setCurrentSrc(cloudUrl);
        } else {
          setHasFailed(true);
        }
      });
      return;
    }

    setHasFailed(true);

    return () => {
      isMounted = false;
    };
  }, [src, JSON.stringify(lookupKeys)]);

  const handleError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If not yet tried cloud fallback and we have keys, attempt cloud retrieval
    if (!hasTriedCloud && lookupKeys.length > 0) {
      setHasTriedCloud(true);
      const fallbackUrl = await getImageWithCloudFallback(lookupKeys);
      if (fallbackUrl && fallbackUrl !== currentSrc) {
        setCurrentSrc(fallbackUrl);
        return;
      }
    }

    // All fallbacks exhausted
    setHasFailed(true);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasFailed(false);
    if (onLoad) {
      onLoad(e);
    }
  };

  // If failed or missing:
  if (hasFailed || !currentSrc) {
    if (hideOnError) {
      return null;
    }

    if (showPlaceholderOnMissing) {
      return (
        <div
          className={`flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-slate-400 text-center ${containerClassName}`}
        >
          <ImageOff className="w-5 h-5 text-slate-400 mb-1" />
          <span className="text-[11px] font-semibold text-slate-600 line-clamp-1">
            {fallbackTitle || alt || 'Gambar Belum Tersedia'}
          </span>
          <span className="text-[9px] text-slate-400">
            {fallbackSubtitle || 'File belum diunggah ke server'}
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      onLoad={handleLoad}
      className={className}
      {...rest}
    />
  );
};
