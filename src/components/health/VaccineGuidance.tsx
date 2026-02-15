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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vaccines.map((vaccine, index) => (
          <Card key={index} className="bg-card/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Syringe className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{vaccine.vaccine}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {vaccine.recommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70">
        Consult a travel health professional for personalized advice before your trip.
      </p>
    </div>
  );
};
