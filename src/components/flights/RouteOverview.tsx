import { AirportInfo } from "@/types/flightInsights";
import { Plane } from "lucide-react";

interface RouteOverviewProps {
  originCity: string;
  originAirports: AirportInfo[];
  destinationCity: string;
  destinationCountry: string;
  destinationAirports: AirportInfo[];
}

export const RouteOverview = ({
  originCity,
  originAirports,
  destinationCity,
  destinationCountry,
  destinationAirports,
}: RouteOverviewProps) => {
  const formatAirports = (airports: AirportInfo[]) => {
    if (airports.length === 0) return "Major airports";
    if (airports.length === 1) {
      const a = airports[0];
      return `${a.code} (${a.name})`;
    }
    return airports.map((a) => a.code).join(", ");
  };

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 text-right">
        <p className="text-xl font-semibold text-foreground">{originCity}</p>
        <p className="text-sm text-muted-foreground">{formatAirports(originAirports)}</p>
      </div>
      
      <div className="flex items-center gap-2 px-4">
        <div className="w-16 h-px bg-border" />
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        <div className="w-16 h-px bg-border" />
      </div>

      <div className="flex-1">
        <p className="text-xl font-semibold text-foreground">{destinationCity}</p>
        <p className="text-sm text-muted-foreground">
          {formatAirports(destinationAirports)}
          {destinationCountry && `, ${destinationCountry}`}
        </p>
      </div>
    </div>
  );
};
