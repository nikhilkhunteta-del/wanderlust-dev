import { useState, useEffect } from "react";

/**
 * Manages the loaded/failed/src state for a single image.
 * Resets automatically when the URL changes, and tries a fallback URL
 * before marking the image as failed.
 */
export function useImageState(primaryUrl?: string | null, fallbackUrl?: string | null) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [src, setSrc] = useState<string | null>(primaryUrl ?? null);

  useEffect(() => {
    setSrc(primaryUrl ?? null);
    setLoaded(false);
    setFailed(false);
  }, [primaryUrl]);

  const onLoad = () => setLoaded(true);
  const onError = () => {
    if (src === primaryUrl && fallbackUrl) {
      setSrc(fallbackUrl);
    } else {
      setFailed(true);
    }
  };

  return { src, loaded, failed, onLoad, onError };
}
