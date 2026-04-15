import { useCityStats } from "@/hooks/useCityStats";

interface CityStatsStripProps {
  city: string;
  country: string;
  primaryInterest: string;
}

export const CityStatsStrip = ({ city, country, primaryInterest }: CityStatsStripProps) => {
  const { data: stats, isLoading, isError } = useCityStats(city, country, primaryInterest);

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
      style={{
        padding: "32px 0",
        background: "rgba(193, 68, 14, 0.08)",
        borderTop: "1px solid rgba(193, 68, 14, 0.2)",
        borderBottom: "1px solid rgba(193, 68, 14, 0.2)",
      }}
    >
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-6 md:gap-0">
          {stats.map((s, idx) => (
            <div key={idx} className="flex-1 flex flex-col md:flex-row items-center">
              <div className="flex-1 flex flex-col items-center text-center px-4">
                <span
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: 48, lineHeight: 1.1 }}
                >
                  {s.stat}
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
          ))}
        </div>
      </div>
    </div>
  );
};
