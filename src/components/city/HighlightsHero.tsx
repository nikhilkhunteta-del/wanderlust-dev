import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHeroCollage, CollageImage } from "@/hooks/useHeroCollage";

interface HighlightsHeroProps {
  city: string;
  country: string;
  matchStatement: string;
  interests?: string[];
}

// Brand gradient fallbacks for failed images
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, hsl(var(--sunset-500)), hsl(var(--sunset-600)))",
  "linear-gradient(135deg, hsl(var(--ocean-400)), hsl(var(--ocean-600)))",
  "linear-gradient(135deg, hsl(var(--forest-400)), hsl(var(--forest-600)))",
  "linear-gradient(135deg, hsl(var(--sand-300)), hsl(var(--sand-500)))",
];

function CollageCell({
  image,
  index,
  alt,
}: {
  image: CollageImage | null;
  index: number;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div
        className="w-full h-full"
        style={{ background: FALLBACK_GRADIENTS[index % 4] }}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
      )}
      {image.smallUrl && !loaded && (
        <img
          src={image.smallUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
          aria-hidden="true"
        />
      )}
      <img
        src={image.url}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      {loaded && image.photographer && (
        <a
          href={`${image.photographerUrl}?utm_source=travel_app&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 text-[9px] text-white/60 hover:text-white bg-black/30 hover:bg-black/50 px-1.5 py-0.5 rounded transition-colors backdrop-blur-sm"
        >
          📷 {image.photographer}
        </a>
      )}
    </div>
  );
}

export const HighlightsHero = ({
  city,
  country,
  matchStatement,
  interests = [],
}: HighlightsHeroProps) => {
  const { data: images } = useHeroCollage(city, country, interests);
  const collageImages = images ?? [null, null, null, null];

  return (
    <section className="relative overflow-hidden">
      {/* 2×2 Image Collage */}
      <div className="grid grid-cols-2 grid-rows-2 h-[340px] md:h-[500px] w-full">
        {collageImages.slice(0, 4).map((img, i) => (
          <CollageCell
            key={i}
            image={img}
            index={i}
            alt={`${city}, ${country} — ${img?.query || `view ${i + 1}`}`}
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 pointer-events-none">
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
    </section>
  );
};
