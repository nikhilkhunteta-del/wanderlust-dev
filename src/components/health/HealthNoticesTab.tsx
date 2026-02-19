import { useRef } from "react";
import { useHealthData } from "@/hooks/useCityData";
import { HealthSummarySection } from "./HealthSummarySection";
import { ActiveNoticesSection } from "./ActiveNoticesSection";
import { VaccineSection } from "./VaccineSection";
import { WaterFoodSection } from "./WaterFoodSection";
import { MedicalFacilitiesSection } from "./MedicalFacilitiesSection";
import { SeasonalHealthSection } from "./SeasonalHealthSection";
import { PackingSuggestionsSection } from "./PackingSuggestionsSection";
import { Loader2, HeartPulse } from "lucide-react";

interface HealthNoticesTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

export const HealthNoticesTab = ({
  city,
  country,
  travelMonth,
}: HealthNoticesTabProps) => {
  const { data: healthData, isLoading, isFetching, error } = useHealthData(city, country, travelMonth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading health information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <HeartPulse className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">Unable to load health information</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load health information"}
          </p>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-10">
      {/* Section 1: Health Summary */}
      <HealthSummarySection
        summary={healthData.healthSummary}
        hasActiveAlerts={healthData.hasActiveAlerts}
      />

      {/* Section 2: Active Notices (only if relevant) */}
      {healthData.activeNotices.length > 0 && (
        <ActiveNoticesSection notices={healthData.activeNotices} />
      )}

      {/* Section 3: Vaccinations */}
      <VaccineSection vaccines={healthData.vaccines} />

      {/* Section 4: Water & Food Safety */}
      <WaterFoodSection
        waterSafety={healthData.waterSafety}
        foodSafety={healthData.foodSafety}
      />

      {/* Section 5: Medical Facilities */}
      <MedicalFacilitiesSection facilities={healthData.medicalFacilities} />

      {/* Section 6: Seasonal Health Considerations (only if 2+ items) */}
      {healthData.seasonalConsiderations.length > 0 && (
        <SeasonalHealthSection considerations={healthData.seasonalConsiderations} />
      )}

      {/* Section 7: Packing Suggestions */}
      <PackingSuggestionsSection suggestions={healthData.packingSuggestions} />

      {/* Reassurance line */}
      {healthData.reassuranceLine && (
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          {healthData.reassuranceLine}
        </p>
      )}

      {/* Section 8: Footer */}
      <footer className="pt-8 border-t border-border/40">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Health information synthesised from CDC, WHO, and NaTHNaC. This is general guidance only
          — consult a travel health professional for personalised medical advice.
        </p>
      </footer>
    </div>
  );
};
