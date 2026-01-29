import { useRef } from "react";
import { useHealthNotices } from "@/hooks/useCityData";
import { HealthStatusBanner } from "./HealthStatusBanner";
import { CurrentNotices } from "./CurrentNotices";
import { VaccineGuidance } from "./VaccineGuidance";
import { WaterFoodSafety } from "./WaterFoodSafety";
import { MedicalFacilities } from "./MedicalFacilities";
import { HealthPackingList } from "./HealthPackingList";
import { TravelInsuranceNote } from "./TravelInsuranceNote";
import { ContextualHealthInsights } from "./ContextualHealthInsights";
import { DataFreshness } from "@/components/shared/DataFreshness";
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
  const { data: healthData, isLoading, isFetching, error, dataUpdatedAt } = useHealthNotices(city, country, travelMonth);
  const initialLoadTime = useRef<number | null>(null);
  
  if (healthData && !initialLoadTime.current) {
    initialLoadTime.current = Date.now();
  }
  const isFromCache = healthData && !isLoading && dataUpdatedAt < Date.now() - 100;

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
      <div className="flex justify-end">
        <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
      </div>
      
      {/* Health Status Banner */}
      <HealthStatusBanner
        hasActiveAlerts={healthData.hasActiveAlerts}
        alertSummary={healthData.alertSummary}
      />

      {/* Current Notices */}
      {healthData.currentNotices.length > 0 && (
        <section>
          <CurrentNotices notices={healthData.currentNotices} />
        </section>
      )}

      {/* Two-column grid for compact sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vaccines */}
        <section>
          <VaccineGuidance vaccines={healthData.vaccines} />
        </section>

        {/* Water & Food Safety */}
        <section>
          <WaterFoodSafety
            waterSafety={healthData.waterSafety}
            foodSafetyTips={healthData.foodSafetyTips}
          />
        </section>
      </div>

      {/* Medical Facilities - full width */}
      <section>
        <MedicalFacilities
          standard={healthData.medicalFacilities.standard}
          pharmacyAvailability={healthData.medicalFacilities.pharmacyAvailability}
          emergencyNumber={healthData.medicalFacilities.emergencyNumber}
        />
      </section>

      {/* Contextual Insights */}
      {healthData.contextualInsights.length > 0 && (
        <section>
          <ContextualHealthInsights insights={healthData.contextualInsights} />
        </section>
      )}

      {/* Two-column for packing and insurance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <HealthPackingList items={healthData.packingList} />
        </section>
        <section>
          <TravelInsuranceNote note={healthData.travelInsuranceNote} />
        </section>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-border/40">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Health information is synthesized from official sources including WHO, CDC, and NaTHNaC. 
          This is general guidance only. Consult a travel health professional for personalized medical advice.
          <span className="block mt-1">Last updated: {healthData.lastUpdated}</span>
        </p>
      </footer>
    </div>
  );
};
