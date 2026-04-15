import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandmarkStrip, LandmarkStripImage } from "@/hooks/useLandmarkStrip";

interface LandmarkStripProps {
  city: string;
  country: string;
  landmarks: string[]; // landmarks #2-#6
}

export const LandmarkStrip = ({ city, country, landmarks }: LandmarkStripProps) => {
  const { data: images, isLoading } = useLandmarkStrip(city, country, landmarks);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const validImages = (images ?? []).filter(
    (img): img is LandmarkStripImage => img !== null
  );

  if (isLoading) {
    return (
      <section className="mb-14">
        <div className="flex gap-4 overflow-hidden">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-full md:w-[calc(50%-8px)] rounded-xl bg-muted animate-pulse"
              style={{ height: 500 }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (validImages.length < 2) return null;

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-strip-card]")?.clientWidth ?? el.clientWidth / 2;
    const gap = 16;
    el.scrollBy({
      left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 350);
  };

  return (
    <section className="mb-14 relative group">
      <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Explore {city}
      </h2>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {validImages.map((img, idx) => (
          <StripCard key={idx} image={img} />
        ))}
      </div>

      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && validImages.length > 2 && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      )}
    </section>
  );
};

// ── Individual card ───────────────────────────────────────
function StripCard({ image }: { image: LandmarkStripImage }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      data-strip-card
      className="flex-shrink-0 w-[85vw] md:w-[calc(50%-8px)] snap-start"
    >
      <div className="relative rounded-xl overflow-hidden bg-muted" style={{ height: 500 }}>
        {!loaded && !failed && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        {!failed ? (
          <img
            src={image.url}
            alt={image.landmark}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">{image.landmark}</span>
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

      {/* Landmark name */}
      <p
        className="mt-2 text-muted-foreground"
        style={{
          fontSize: 12,
          fontVariant: "small-caps",
          letterSpacing: "0.05em",
        }}
      >
        {image.landmark}
      </p>
    </div>
  );
}
