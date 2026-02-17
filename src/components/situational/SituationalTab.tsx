import { useRef } from "react";
import { useSituationalAwareness } from "@/hooks/useCityData";
import { StatusBanner } from "./StatusBanner";
import { IssueCard } from "./IssueCard";
import { SeasonalPatterns } from "./SeasonalPatterns";
import { PracticalImpact } from "./PracticalImpact";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { Loader2, Radar, Info } from "lucide-react";

interface SituationalTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

export const SituationalTab = ({ city, country, travelMonth }: SituationalTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useSituationalAwareness(city, country, travelMonth);
  const initialLoadTime = useRef<number | null>(null);
  
  if (data && !initialLoadTime.current) {
    initialLoadTime.current = Date.now();
  }
  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Scanning current conditions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to load situational awareness</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load situational awareness"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Radar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-semibold">Situational Awareness</h2>
          </div>
          <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
        </div>
        <p className="text-muted-foreground">
          Current and emerging conditions that may affect your visit
        </p>
      </div>

      <div className="space-y-8">
        {/* Status Banner */}
        <StatusBanner
          hasDisruptions={data.hasDisruptions}
          statusSummary={data.statusSummary}
        />

        {/* Current Issues */}
        {data.issues && data.issues.length > 0 && (
          <section>
            <h3 className="font-semibold text-foreground mb-4">Current & Emerging Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.issues.map((issue, index) => (
                <IssueCard key={index} issue={issue} />
              ))}
            </div>
          </section>
        )}

        {/* Seasonal Patterns */}
        <SeasonalPatterns patterns={data.seasonalPatterns} travelMonth={travelMonth} />

        {/* Practical Impact */}
        <PracticalImpact impact={data.practicalImpact} />

        {/* Footer */}
        <footer className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Last updated: {data.lastUpdated}</span>
            <span className="mx-2">•</span>
            <span>Source: {data.dataSource}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
