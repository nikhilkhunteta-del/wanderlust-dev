import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHeroCollage, CollageImage } from "@/hooks/useHeroCollage";

interface HighlightsHeroProps {
  city: string;
  country: string;
  matchStatement: string;
  interests?: string[];
}

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, hsl(24 85% 58%), hsl(15 75% 52%))",
  "linear-gradient(135deg, hsl(200 65% 48%), hsl(200 75% 65%))",
  "linear-gradient(135deg, hsl(160 50% 40%), hsl(160 45% 55%))",
];

function CollageCell({
  image,
  index,
  alt,
  className,
  children,
}: {
  image: CollageImage | null;
  index: number;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div
        className={cn("relative w-full h-full", className)}
        style={{ background: FALLBACK_GRADIENTS[index % 3] }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-muted", className)}>
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
      {loaded && image.photographer && !children && (
        <a
          href={`${image.photographerUrl}?utm_source=travel_app&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 text-[9px] text-white/60 hover:text-white bg-black/30 hover:bg-black/50 px-1.5 py-0.5 rounded transition-colors backdrop-blur-sm"
        >
          📷 {image.photographer}
        </a>
      )}
      {children}
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
  const collageImages = images ?? [null, null, null];

  return (
    <section className="relative overflow-hidden">
      {/* Asymmetric layout: 60% left + 40% right stacked */}
      <div className="flex h-[340px] md:h-[420px] w-full">
        {/* Large left image — 60% width, full height */}
        <div className="w-full md:w-[60%] relative">
          <CollageCell
            image={collageImages[0]}
            index={0}
            alt={`${city}, ${country} — landmark`}
          >
            {/* Gradient overlay on left image only */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Text content overlaid on left image */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pointer-events-none">
              <div className="max-w-lg">
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

            {/* Photographer attribution on left image */}
            {collageImages[0]?.photographer && (
              <a
                href={`${collageImages[0].photographerUrl}?utm_source=travel_app&utm_medium=referral`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 text-[9px] text-white/60 hover:text-white bg-black/30 hover:bg-black/50 px-1.5 py-0.5 rounded transition-colors backdrop-blur-sm pointer-events-auto z-10"
              >
                📷 {collageImages[0].photographer}
              </a>
            )}
          </CollageCell>
        </div>

        {/* Right column — hidden on mobile, 40% width with two stacked images */}
        <div className="hidden md:flex md:w-[40%] flex-col">
          <div className="h-1/2">
            <CollageCell
              image={collageImages[1]}
              index={1}
              alt={`${city} — street scene`}
            />
          </div>
          <div className="h-1/2">
            <CollageCell
              image={collageImages[2]}
              index={2}
              alt={`${city} — ${collageImages[2]?.query || "interest"}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
