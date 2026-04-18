import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLandmarkStrip, LandmarkStripImage } from "@/hooks/useLandmarkStrip";
import { useImageState } from "@/hooks/useImageState";

const INTEREST_LENS: Record<string, string> = {
  "nature-outdoors": "nature lover's lens",
  "beach-coastal": "coastal lens",
  "culture-history": "historical lens",
  "food-culinary": "culinary lens",
  "arts-music-nightlife": "creative lens",
  "active-sport": "adventurer's lens",
  "shopping-markets": "local's lens",
  "wellness-slow-travel": "slower lens",
};

interface LandmarkStripProps {
  city: string;
  country: string;
  places: string[];
  primaryInterest?: string;
}

export const LandmarkStrip = ({ city, country, places, primaryInterest }: LandmarkStripProps) => {
  const { data: images, isLoading } = useLandmarkStrip(city, country, places);
  const [currentIndex, setCurrentIndex] = useState(0);

  const validImages = (images ?? []).filter(
    (img): img is LandmarkStripImage => img !== null
  );

  useEffect(() => {
    if (validImages.length < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % validImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [validImages.length]);

  if (isLoading) {
    return (
      <section>
        <div className="h-64 md:h-96 lg:h-[500px] w-full bg-muted animate-pulse" />
      </section>
    );
  }

  if (validImages.length < 2) return null;

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-4 px-4 md:px-6">
        {city} through a {INTEREST_LENS[primaryInterest || "culture-history"] || "traveller's lens"}
      </h2>
      <div className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden bg-muted">
        {validImages.map((img, idx) => (
          <SlideImage key={img.url} image={img} active={idx === currentIndex} />
        ))}
      </div>
    </section>
  );
};

// ── Individual slide ──────────────────────────────────────
function SlideImage({ image, active }: { image: LandmarkStripImage; active: boolean }) {
  const { loaded, failed, onLoad, onError } = useImageState(image.url);
  const displayName = image.placeName || image.landmark || "";

  return (
    <div
      className="absolute inset-0 transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    >
      {!failed ? (
        <img
          src={image.url}
          alt={displayName}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={onLoad}
          onError={onError}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">{displayName}</span>
        </div>
      )}

      {/* Name overlay */}
      {displayName && (
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
          <p className="absolute bottom-4 left-4 text-white text-sm font-medium tracking-wide drop-shadow">
            {displayName}
          </p>
        </div>
      )}

      {/* Photographer attribution */}
      {image.photographer && loaded && (
        <a
          href={`${image.photographerUrl}?utm_source=travel_app&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 text-[9px] text-white/60 hover:text-white bg-black/30 hover:bg-black/50 px-1.5 py-0.5 rounded transition-colors backdrop-blur-sm"
        >
          📷 {image.photographer}
        </a>
      )}
    </div>
  );
}
