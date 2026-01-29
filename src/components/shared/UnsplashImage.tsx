import { useState, useEffect } from "react";
import { getUnsplashImages, UnsplashImage } from "@/lib/unsplash";
import { cn } from "@/lib/utils";

interface UnsplashImageProps {
  query: string;
  alt?: string;
  className?: string;
  size?: "url" | "smallUrl" | "thumbUrl";
  showAttribution?: boolean;
}

export const UnsplashImageDisplay = ({
  query,
  alt,
  className,
  size = "url",
  showAttribution = false,
}: UnsplashImageProps) => {
  const [image, setImage] = useState<UnsplashImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        const images = await getUnsplashImages(query, 1);
        if (mounted && images.length > 0) {
          setImage(images[0]);
        } else if (mounted) {
          setError(true);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      mounted = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div className={cn("bg-muted animate-pulse", className)} />
    );
  }

  if (error || !image) {
    return (
      <div className={cn("bg-muted flex items-center justify-center", className)}>
        <span className="text-xs text-muted-foreground">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={image[size]}
        alt={alt || image.alt}
        className={cn("object-cover", className)}
        loading="lazy"
      />
      {showAttribution && (
        <a
          href={`${image.unsplashUrl}?utm_source=travel_app&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 text-[10px] text-white/70 hover:text-white bg-black/30 px-1.5 py-0.5 rounded"
        >
          📷 {image.photographer}
        </a>
      )}
    </div>
  );
};
