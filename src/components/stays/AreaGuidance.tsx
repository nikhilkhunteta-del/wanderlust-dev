import { AreaGuidance as AreaGuidanceType } from "@/types/stayInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Scale, Volume2 } from "lucide-react";

interface AreaGuidanceProps {
  guidance: AreaGuidanceType;
}

export const AreaGuidance = ({ guidance }: AreaGuidanceProps) => {
  const items = [
    {
      icon: MapPin,
      title: "Central vs Outer",
      description: guidance.centralVsOuter,
    },
    {
      icon: Scale,
      title: "Price vs Convenience",
      description: guidance.priceVsConvenience,
    },
    {
      icon: Volume2,
      title: "Lively vs Quiet",
      description: guidance.noiseVsQuiet,
    },
  ];

  return (
    <Card className="bg-muted/30 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Choosing the Right Area</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid sm:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
