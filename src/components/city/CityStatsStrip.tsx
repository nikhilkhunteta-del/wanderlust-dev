import { useRef, useState, useEffect, useCallback } from "react";
import { useCityStats } from "@/hooks/useCityStats";

interface CityStatsStripProps {
  city: string;
  country: string;
  primaryInterest: string;
}

/** Extract leading number (int or float) and any suffix like "+" or "km" */
function parseStatValue(raw: string): { num: number; prefix: string; suffix: string } | null {
  const match = raw.match(/^([^\d]*?)([\d,]+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[2].replace(/,/g, ""));
  if (isNaN(num)) return null;
  return { prefix: match[1], num, suffix: match[3] };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedStat({ value, animate }: { value: string; animate: boolean }) {
  const parsed = parseStatValue(value);
  const [display, setDisplay] = useState(animate && parsed ? `${parsed.prefix}0${parsed.suffix}` : value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animate || !parsed) {
      setDisplay(value);
      return;
    }

    const duration = 800;
    const start = performance.now();
    const isInteger = Number.isInteger(parsed.num);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = eased * parsed.num;
      const formatted = isInteger
        ? Math.round(current).toLocaleString()
        : current.toFixed(1);
      setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate, value]);

  return <>{display}</>;
}

export const CityStatsStrip = ({ city, country, primaryInterest }: CityStatsStripProps) => {
  const { data: stats, isLoading, isError } = useCityStats(city, country, primaryInterest);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.3 });
    observer.observe(el);

    // Check immediately in case element is already in viewport on mount
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < viewportHeight && rect.bottom > 0) {
      setHasAnimated(true);
    }

    return () => observer.disconnect();
  }, [handleIntersect]);

  if (isLoading) {
    return (
      <div
        className="page-container"
        style={{
          padding: "32px 24px",
          background: "rgba(193, 68, 14, 0.08)",
          borderTop: "1px solid rgba(193, 68, 14, 0.2)",
          borderBottom: "1px solid rgba(193, 68, 14, 0.2)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-6 md:gap-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="h-12 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats || stats.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        padding: "32px 0",
        background: "rgba(193, 68, 14, 0.08)",
        borderTop: "1px solid rgba(193, 68, 14, 0.2)",
        borderBottom: "1px solid rgba(193, 68, 14, 0.2)",
      }}
    >
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-6 md:gap-0">
          {stats.map((s, idx) => {
            const isNumeric = parseStatValue(s.stat) !== null;

            return (
              <div key={idx} className="flex-1 flex flex-col md:flex-row items-center">
                <div
                  className="flex-1 flex flex-col items-center text-center px-4"
                  style={{
                    opacity: !hasAnimated ? 0 : 1,
                    transition: !isNumeric ? "opacity 600ms ease-out" : undefined,
                  }}
                >
                  <span
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: 48, lineHeight: 1.1 }}
                  >
                    {isNumeric ? (
                      <AnimatedStat value={s.stat} animate={hasAnimated} />
                    ) : (
                      s.stat
                    )}
                  </span>
                  <span
                    className="text-muted-foreground mt-1"
                    style={{ fontSize: 13 }}
                  >
                    {s.description}
                  </span>
                </div>

                {idx < stats.length - 1 && (
                  <>
                    <div className="hidden md:block w-px h-16" style={{ background: "rgba(193, 68, 14, 0.2)" }} />
                    <div className="md:hidden w-24 h-px mx-auto" style={{ background: "rgba(193, 68, 14, 0.2)" }} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
