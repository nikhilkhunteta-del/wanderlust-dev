import { VaccineRecommendation } from "@/types/healthNotices";
import { Syringe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VaccineGuidanceProps {
  vaccines: VaccineRecommendation[];
}

export const VaccineGuidance = ({ vaccines }: VaccineGuidanceProps) => {
  if (vaccines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Vaccine Recommendations</h3>
      <div className="divide-y divide-border/50 rounded-lg border border-border/50 bg-card/50">
        {vaccines.map((vaccine, index) => (
          <div key={index} className="flex items-start gap-3 px-4 py-3">
            <Syringe className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
              <p className="font-medium text-sm shrink-0">{vaccine.vaccine}</p>
              <p className="text-sm text-muted-foreground">{vaccine.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70">
        Consult a travel health professional for personalized advice before your trip.
      </p>
    </div>
  );
};
