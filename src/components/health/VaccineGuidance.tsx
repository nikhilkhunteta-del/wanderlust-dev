import { VaccineRecommendation } from "@/types/healthNotices";
import { Syringe, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VaccineGuidanceProps {
  vaccines: VaccineRecommendation[];
  preventionGuidance: string[];
}

export const VaccineGuidance = ({
  vaccines,
  preventionGuidance,
}: VaccineGuidanceProps) => {
  return (
    <div className="space-y-6">
      {/* Vaccines */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Vaccine Recommendations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vaccines.map((vaccine, index) => (
            <Card key={index} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Syringe className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{vaccine.vaccine}</p>
                    <p className="text-sm text-muted-foreground">
                      {vaccine.recommendation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Prevention Guidance */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Prevention Guidance</h3>
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          {preventionGuidance.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70">
          Consult a travel health professional for personalized advice before your trip.
        </p>
      </div>
    </div>
  );
};
