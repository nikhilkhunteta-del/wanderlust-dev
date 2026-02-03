import { useState, useEffect, useMemo } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Search, Users, Armchair } from "lucide-react";
import { AirportInfo } from "@/types/flightInsights";
import { buildGoogleFlightsSearchUrl } from "@/lib/flightInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CabinClass = "economy" | "premium_economy" | "business" | "first";

interface FlightSearchControlsProps {
  originAirports: AirportInfo[];
  destinationAirports: AirportInfo[];
  travelMonth: string;
}

const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function getDefaultDates(travelMonth: string): { departure: Date; return: Date } {
  const monthKey = travelMonth.toLowerCase().slice(0, 3);
  const monthIndex = MONTH_MAP[monthKey] ?? 0;
  const today = new Date();
  let year = today.getFullYear();
  
  // If the month is in the past for this year, use next year
  if (monthIndex < today.getMonth() || 
      (monthIndex === today.getMonth() && today.getDate() > 15)) {
    year += 1;
  }
  
  const departureDate = new Date(year, monthIndex, 15);
  const returnDate = addDays(departureDate, 7);
  
  return { departure: departureDate, return: returnDate };
}

function findMainAirport(airports: AirportInfo[]): string {
  const main = airports.find(a => a.isMain);
  return main?.code || airports[0]?.code || "";
}

export const FlightSearchControls = ({
  originAirports,
  destinationAirports,
  travelMonth,
}: FlightSearchControlsProps) => {
  const defaultDates = useMemo(() => getDefaultDates(travelMonth), [travelMonth]);
  
  const [departureAirport, setDepartureAirport] = useState(() => findMainAirport(originAirports));
  const [arrivalAirport, setArrivalAirport] = useState(() => findMainAirport(destinationAirports));
  const [departureDate, setDepartureDate] = useState<Date | undefined>(defaultDates.departure);
  const [returnDate, setReturnDate] = useState<Date | undefined>(defaultDates.return);
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset airports if props change
  useEffect(() => {
    setDepartureAirport(findMainAirport(originAirports));
  }, [originAirports]);

  useEffect(() => {
    setArrivalAirport(findMainAirport(destinationAirports));
  }, [destinationAirports]);

  const today = startOfDay(new Date());

  const handleSearch = () => {
    // Validation
    if (!departureAirport || !arrivalAirport) {
      setValidationError("Please select both departure and arrival airports.");
      return;
    }
    if (!departureDate) {
      setValidationError("Please select a departure date.");
      return;
    }
    if (isBefore(departureDate, today)) {
      setValidationError("Departure date must be in the future.");
      return;
    }
    if (!returnDate) {
      setValidationError("Please select a return date.");
      return;
    }
    if (isBefore(returnDate, departureDate)) {
      setValidationError("Return date must be after departure date.");
      return;
    }

    setValidationError(null);

    const url = buildGoogleFlightsSearchUrl({
      originAirport: departureAirport,
      destinationAirport: arrivalAirport,
      departureDate,
      returnDate,
      passengers,
      cabinClass,
    });

    window.open(url, "_blank");
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 md:p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Refine Your Search
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Departure Airport */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <Select value={departureAirport} onValueChange={setDepartureAirport}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select airport" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {originAirports.map((airport) => (
                  <SelectItem key={airport.code} value={airport.code}>
                    {airport.code} – {airport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Arrival Airport */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To</label>
            <Select value={arrivalAirport} onValueChange={setArrivalAirport}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select airport" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {destinationAirports.map((airport) => (
                  <SelectItem key={airport.code} value={airport.code}>
                    {airport.code} – {airport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Departure Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Depart</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background",
                    !departureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {departureDate ? format(departureDate, "MMM d, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={setDepartureDate}
                  disabled={(date) => isBefore(date, today)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Return Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Return</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background",
                    !returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, "MMM d, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={setReturnDate}
                  disabled={(date) => departureDate ? isBefore(date, departureDate) : isBefore(date, today)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Passengers */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Passengers</label>
            <Select value={passengers.toString()} onValueChange={(v) => setPassengers(parseInt(v))}>
              <SelectTrigger className="w-full bg-background">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "adult" : "adults"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cabin Class */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Cabin Class</label>
            <Select value={cabinClass} onValueChange={(v) => setCabinClass(v as CabinClass)}>
              <SelectTrigger className="w-full bg-background">
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {(Object.keys(CABIN_CLASS_LABELS) as CabinClass[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {CABIN_CLASS_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <p className="text-sm text-destructive mt-3">{validationError}</p>
        )}

        {/* Search Button */}
        <div className="mt-4">
          <Button onClick={handleSearch} className="w-full sm:w-auto gap-2">
            <Search className="h-4 w-4" />
            Search flights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
