import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHeroCollage } from "@/hooks/useHeroCollage";

interface HighlightsHeroProps {
  city: string;
  country: string;
  matchStatement: string;
  interests?: string[];
}

const FALLBACK_GRADIENT = "linear-gradient(135deg, hsl(24 85% 58%), hsl(15 75% 52%))";

export const HighlightsHero = ({
  city,
  country,
  matchStatement,
  interests = [],
}: HighlightsHeroProps) => {
  const { data: images } = useHeroCollage(city, country, interests);
  const heroImage = images?.[0] ?? null;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <section className="relative w-full h-[420px] md:h-[500px] overflow-hidden">
      {/* Background: image or gradient fallback */}
      {heroImage && !failed ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
          )}
          {heroImage.smallUrl && !loaded && (
            <img
              src={heroImage.smallUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
              aria-hidden="true"
            />
          )}
          <img
            src={heroImage.url}
            alt={`${city}, ${country}`}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0"
            )}
            loading="eager"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: FALLBACK_GRADIENT }} />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      {/* Text overlay — bottom-left */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pointer-events-none">
        <div className="max-w-xl">
          <span className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1.5 block">
            {country}
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-semibold text-white mb-3">
            {city}
          </h1>
          <p className="text-white/90 text-base md:text-lg leading-relaxed">
            {matchStatement}
          </p>
        </div>
      </div>

      {/* Photographer attribution */}
      {heroImage?.photographer && loaded && (
        <a
          href={`${heroImage.photographerUrl}?utm_source=travel_app&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 text-[9px] text-white/60 hover:text-white bg-black/30 hover:bg-black/50 px-1.5 py-0.5 rounded transition-colors backdrop-blur-sm z-10"
        >
          📷 {heroImage.photographer}
        </a>
      )}
    </section>
  );
};
