import { useState, useEffect } from "react";
import { getUnsplashImages, UnsplashImage } from "@/lib/unsplash";

interface HighlightsHeroProps {
  city: string;
  country: string;
  heroImageQuery: string;
  matchStatement: string;
}

export const HighlightsHero = ({
  city,
  country,
  heroImageQuery,
  matchStatement,
}: HighlightsHeroProps) => {
  const [image, setImage] = useState<UnsplashImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchImage = async () => {
      setLoading(true);
      try {
        const images = await getUnsplashImages(heroImageQuery, 1);
        if (mounted && images.length > 0) {
          setImage(images[0]);
        }
      } catch {
        // Silently fail
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      mounted = false;
    };
  }, [heroImageQuery]);

  return (
    <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
      {/* Hero Image */}
      {loading ? (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      ) : image ? (
        <img
          src={image.url}
          alt={`${city}, ${country}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40" />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
        <div className="max-w-4xl">
          <span className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2 block">
            {country}
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-semibold text-white mb-4">
            {city}
          </h1>
          <p className="text-white/90 text-lg md:text-xl leading-relaxed max-w-2xl">
            {matchStatement}
          </p>
        </div>
      </div>

      {/* Unsplash Attribution */}
      {image && (
        <a
          href={`${image.unsplashUrl}?utm_source=travel_app&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 text-xs text-white/60 hover:text-white/90 bg-black/30 px-2 py-1 rounded transition-colors"
        >
          📷 {image.photographer} on Unsplash
        </a>
      )}
    </section>
  );
};
