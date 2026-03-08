import { useHealthData } from "@/hooks/useCityData";
import { Droplets, Hospital, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface CompactHealthSectionProps {
  city: string;
  country: string;
  travelMonth: string;
}

export const CompactHealthSection = ({ city, country, travelMonth }: CompactHealthSectionProps) => {
  const { data, isLoading } = useHealthData(city, country, travelMonth);

  // Only render for low-risk destinations
  if (isLoading) {
    return (
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Health</h3>
        <Skeleton className="h-16 w-full rounded-lg" />
      </section>
    );
  }

  if (!data || data.healthRiskLevel !== "low") return null;

  const waterLabel = data.waterSafety.status === "safe" ? "Tap water is safe" : "Use caution with tap water";
  const waterColor = data.waterSafety.status === "safe" ? "text-emerald-500" : "text-amber-500";

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Health</h3>
      <Card className="bg-card/50 border-border/50" style={{ borderLeftWidth: "3px", borderLeftColor: "#16A34A" }}>
        <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className={`flex items-center gap-1.5 text-sm ${waterColor}`}>
            <Droplets className="w-4 h-4" />
            {waterLabel}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Hospital className="w-4 h-4" />
            {data.medicalFacilities.quality} medical facilities
          </span>
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            {data.reassuranceLine || "No specific health concerns for this destination"}
          </span>
        </CardContent>
      </Card>
    </section>
  );
};
