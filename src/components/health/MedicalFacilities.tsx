import { HealthcareStandard } from "@/types/healthNotices";
import { cn } from "@/lib/utils";
import { Building2, Pill, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MedicalFacilitiesProps {
  standard: HealthcareStandard;
  pharmacyAvailability: string;
  emergencyNumber: string;
}

const standardConfig: Record<HealthcareStandard, {
  label: string;
  description: string;
  colorClass: string;
}> = {
  high: {
    label: "High Standard",
    description: "Modern facilities with well-trained staff",
    colorClass: "text-emerald-500",
  },
  moderate: {
    label: "Moderate Standard",
    description: "Adequate facilities in major areas",
    colorClass: "text-amber-500",
  },
  limited: {
    label: "Limited",
    description: "Basic facilities; consider evacuation insurance",
    colorClass: "text-orange-500",
  },
};

export const MedicalFacilities = ({
  standard,
  pharmacyAvailability,
  emergencyNumber,
}: MedicalFacilitiesProps) => {
  const config = standardConfig[standard];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Medical Facilities</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Healthcare Standard */}
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Healthcare</span>
            </div>
            <p className={cn("font-semibold", config.colorClass)}>
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.description}
            </p>
          </CardContent>
        </Card>

        {/* Pharmacy */}
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pharmacies</span>
            </div>
            <p className="text-sm text-foreground">{pharmacyAvailability}</p>
          </CardContent>
        </Card>

        {/* Emergency Number */}
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Emergency</span>
            </div>
            <p className="text-2xl font-mono font-bold text-primary">
              {emergencyNumber}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
