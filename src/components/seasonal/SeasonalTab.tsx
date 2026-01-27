import { useState, useEffect } from "react";
import { SeasonalHighlightsData } from "@/types/seasonalHighlights";
import { getSeasonalHighlights } from "@/lib/seasonalHighlights";
import { SeasonalEventCard } from "./SeasonalEventCard";
import { Loader2, CalendarDays } from "lucide-react";

interface SeasonalTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

const MONTH_DISPLAY: Record<string, string> = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
  flexible: "your visit",
};

export const SeasonalTab = ({ city, country, travelMonth }: SeasonalTabProps) => {
  const [data, setData] = useState<SeasonalHighlightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthDisplay = MONTH_DISPLAY[travelMonth] || travelMonth;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getSeasonalHighlights({
          city,
          country,
          travelMonth,
        });
        setData(result);
      } catch (err) {
        console.error("Failed to fetch seasonal highlights:", err);
        setError(err instanceof Error ? err.message : "Failed to load seasonal highlights");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [city, country, travelMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Finding seasonal experiences for {monthDisplay}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to load seasonal highlights</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full gradient-sunset flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold">
              Seasonal Highlights
            </h2>
            <p className="text-muted-foreground text-sm">
              Special experiences in {monthDisplay}
            </p>
          </div>
        </div>
        <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl">
          {data.openingStatement}
        </p>
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.highlights.map((highlight, index) => (
          <SeasonalEventCard key={index} highlight={highlight} />
        ))}
      </div>

      {/* Empty State */}
      {data.highlights.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No specific seasonal events found for {monthDisplay}.</p>
          <p className="text-sm mt-1">Check the Highlights tab for year-round experiences.</p>
        </div>
      )}
    </div>
  );
};
