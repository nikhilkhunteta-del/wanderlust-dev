import { Hospital, Pill, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MedicalFacilitiesSectionProps {
  facilities: {
    quality: string;
    qualityDetail: string;
    pharmacy: string;
    emergencyNumber: string;
  };
}

export const MedicalFacilitiesSection = ({ facilities }: MedicalFacilitiesSectionProps) => {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Medical Facilities</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Hospital className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{facilities.quality}</p>
              <p className="text-xs text-muted-foreground mt-1">{facilities.qualityDetail}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Pharmacy</p>
              <p className="text-xs text-muted-foreground mt-1">{facilities.pharmacy}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Phone className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-sm">Emergency</p>
              <p className="text-xs text-muted-foreground mt-1">{facilities.emergencyNumber}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
