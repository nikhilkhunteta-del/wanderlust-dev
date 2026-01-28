import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmergencyInfoProps {
  numbers: {
    police: string;
    ambulance: string;
    fire: string;
    tourist?: string;
  };
}

export const EmergencyInfo = ({ numbers }: EmergencyInfoProps) => {
  const emergencyItems = [
    { label: "Police", number: numbers.police },
    { label: "Ambulance", number: numbers.ambulance },
    { label: "Fire", number: numbers.fire },
    ...(numbers.tourist ? [{ label: "Tourist Helpline", number: numbers.tourist }] : []),
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Emergency Numbers</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {emergencyItems.map((item) => (
          <Card key={item.label} className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-mono font-bold text-primary">
                {item.number}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
