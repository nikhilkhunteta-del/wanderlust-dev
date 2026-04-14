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
    <section className="relative w-full overflow-hidden" style={{ height: 500 }}>
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
              className="absolute inset-0 w-full h-full object-cover object-center blur-xl scale-110 opacity-50"
              aria-hidden="true"
            />
          )}
          <img
            src={heroImage.url}
            alt={`${city}, ${country}`}
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500",
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

      {/* Gradient overlay for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Text overlay — bottom-left */}
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none" style={{ padding: 40 }}>
        <div className="max-w-xl">
          <span
            className="block text-white font-medium mb-2"
            style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase" }}
          >
            {country}
          </span>
          <h1
            className="font-display font-bold text-white mb-3"
            style={{ fontSize: 56, lineHeight: 1.1 }}
          >
            {city}
          </h1>
          <p
            className="text-white leading-relaxed"
            style={{ fontSize: 16, opacity: 0.9 }}
          >
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