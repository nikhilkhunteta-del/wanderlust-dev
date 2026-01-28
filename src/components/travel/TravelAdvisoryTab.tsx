import { useState, useEffect } from "react";
import { TravelAdvisory } from "@/types/travelAdvisory";
import { getTravelAdvisory } from "@/lib/travelAdvisory";
import { AdvisoryBanner } from "./AdvisoryBanner";
import { SafetySummary } from "./SafetySummary";
import { AreasToAvoid } from "./AreasToAvoid";
import { EmergencyInfo } from "./EmergencyInfo";
import { SourcesFooter } from "./SourcesFooter";
import { Loader2, ShieldAlert } from "lucide-react";

interface TravelAdvisoryTabProps {
  city: string;
  country: string;
}

export const TravelAdvisoryTab = ({ city, country }: TravelAdvisoryTabProps) => {
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvisory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTravelAdvisory({ city, country });
        setAdvisory(data);
      } catch (err) {
        console.error("Failed to fetch travel advisory:", err);
        setError(err instanceof Error ? err.message : "Failed to load advisory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvisory();
  }, [city, country]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading travel advisory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">Unable to load advisory</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!advisory) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Advisory Banner */}
      <AdvisoryBanner
        level={advisory.level}
        levelLabel={advisory.levelLabel}
        summary={advisory.summary}
        advisoriesVary={advisory.advisoriesVary}
      />

      {/* Safety Summary */}
      <SafetySummary points={advisory.safetyPoints} />

      {/* Areas to Avoid */}
      <AreasToAvoid areas={advisory.areasToAvoid} />

      {/* Emergency Numbers */}
      <EmergencyInfo numbers={advisory.emergencyNumbers} />

      {/* Sources Footer */}
      <SourcesFooter sources={advisory.sources} lastUpdated={advisory.lastUpdated} />
    </div>
  );
};
