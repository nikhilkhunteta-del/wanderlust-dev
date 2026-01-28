import { useState, useEffect } from "react";
import { HealthNoticesData } from "@/types/healthNotices";
import { getHealthNotices } from "@/lib/healthNotices";
import { HealthStatusBanner } from "./HealthStatusBanner";
import { CurrentNotices } from "./CurrentNotices";
import { VaccineGuidance } from "./VaccineGuidance";
import { WaterFoodSafety } from "./WaterFoodSafety";
import { MedicalFacilities } from "./MedicalFacilities";
import { HealthPackingList } from "./HealthPackingList";
import { TravelInsuranceNote } from "./TravelInsuranceNote";
import { ContextualHealthInsights } from "./ContextualHealthInsights";
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
  const [healthData, setHealthData] = useState<HealthNoticesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getHealthNotices({ city, country, travelMonth });
        setHealthData(data);
      } catch (err) {
        console.error("Failed to fetch health notices:", err);
        setError(err instanceof Error ? err.message : "Failed to load health information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [city, country, travelMonth]);

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
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Health Status Banner */}
      <HealthStatusBanner
        hasActiveAlerts={healthData.hasActiveAlerts}
        alertSummary={healthData.alertSummary}
      />

      {/* Current Notices */}
      <CurrentNotices notices={healthData.currentNotices} />

      {/* Vaccine & Prevention */}
      <VaccineGuidance
        vaccines={healthData.vaccines}
        preventionGuidance={healthData.preventionGuidance}
      />

      {/* Water & Food Safety */}
      <WaterFoodSafety
        waterSafety={healthData.waterSafety}
        foodSafetyTips={healthData.foodSafetyTips}
      />

      {/* Medical Facilities */}
      <MedicalFacilities
        standard={healthData.medicalFacilities.standard}
        pharmacyAvailability={healthData.medicalFacilities.pharmacyAvailability}
        emergencyNumber={healthData.medicalFacilities.emergencyNumber}
      />

      {/* Contextual Insights */}
      <ContextualHealthInsights insights={healthData.contextualInsights} />

      {/* Packing List */}
      <HealthPackingList items={healthData.packingList} />

      {/* Travel Insurance */}
      <TravelInsuranceNote note={healthData.travelInsuranceNote} />

      {/* Footer */}
      <div className="pt-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground/70">
          Health information is synthesized from official sources including WHO, CDC, and NaTHNaC. 
          This is general guidance only. Consult a travel health professional for personalized medical advice.
          Last updated: {healthData.lastUpdated}
        </p>
      </div>
    </div>
  );
};
