import { AirportComparison } from "@/types/flightInsights";
import { Building2 } from "lucide-react";

interface AirportComparisonCardProps {
  comparisons: AirportComparison[];
}

export const AirportComparisonCard = ({ comparisons }: AirportComparisonCardProps) => {
  if (!comparisons || comparisons.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-muted-foreground" />
        Airport Options
      </h3>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="divide-y divide-border/50">
          {comparisons.map((comparison, index) => (
            <div key={index} className="p-4">
              <p className="font-semibold text-foreground mb-2">{comparison.airport}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Price</p>
                  <p className="text-foreground">{comparison.priceNote}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Convenience</p>
                  <p className="text-foreground">{comparison.convenienceNote}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
