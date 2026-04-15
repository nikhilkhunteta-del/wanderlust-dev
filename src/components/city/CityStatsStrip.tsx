import { useCityStats } from "@/hooks/useCityStats";

interface CityStatsStripProps {
  city: string;
  country: string;
  primaryInterest: string;
}

export const CityStatsStrip = ({ city, country, primaryInterest }: CityStatsStripProps) => {
  const { data: stats, isLoading } = useCityStats(city, country, primaryInterest);

  if (isLoading) {
    return (
      <div className="page-container py-10">
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

  if (!stats || stats.length === 0) return null;

  return (
    <div className="page-container py-10">
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

            {/* Vertical divider (desktop) / horizontal divider (mobile) */}
            {idx < stats.length - 1 && (
              <>
                <div className="hidden md:block w-px h-16 bg-border" />
                <div className="md:hidden w-24 h-px bg-border mx-auto" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
