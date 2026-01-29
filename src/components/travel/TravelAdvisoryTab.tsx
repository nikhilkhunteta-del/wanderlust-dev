import { useTravelAdvisory } from "@/hooks/useCityData";
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
  const { data: advisory, isLoading, error } = useTravelAdvisory(city, country);

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
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load advisory"}
          </p>
        </div>
      </div>
    );
  }

  if (!advisory) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
      <AdvisoryBanner
        level={advisory.level}
        levelLabel={advisory.levelLabel}
        summary={advisory.summary}
        advisoriesVary={advisory.advisoriesVary}
      />
      <SafetySummary points={advisory.safetyPoints} />
      <AreasToAvoid areas={advisory.areasToAvoid} />
      <EmergencyInfo numbers={advisory.emergencyNumbers} />
      <SourcesFooter sources={advisory.sources} lastUpdated={advisory.lastUpdated} />
    </div>
  );
};
