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
      <ul className="space-y-2">
        {vaccines.map((vaccine, index) => (
          <li key={index} className="flex items-baseline gap-2 text-sm">
            <Syringe className="w-3.5 h-3.5 text-primary flex-shrink-0 translate-y-0.5" />
            <span>
              <span className="font-semibold">{vaccine.vaccine}</span>
              <span className="text-muted-foreground"> — {vaccine.recommendation}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground/70">
        Consult a travel health professional for personalized advice before your trip.
      </p>
    </div>
  );
};
