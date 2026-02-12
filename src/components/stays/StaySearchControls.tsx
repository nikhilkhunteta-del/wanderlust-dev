import { useState, useMemo } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Search, Users, MapPin } from "lucide-react";
import { buildGoogleHotelsSearchUrl } from "@/lib/stayInsights";
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

type AreaPreference = "no_preference" | "city_center" | "beach" | "quiet";

interface StaySearchControlsProps {
  city: string;
  country: string;
  travelMonth: string;
}

const AREA_LABELS: Record<AreaPreference, string> = {
  no_preference: "No preference",
  city_center: "City centre",
  beach: "Near the beach",
  quiet: "Quiet area",
};

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function getDefaultDates(travelMonth: string): { checkin: Date; checkout: Date } {
  const monthKey = travelMonth.toLowerCase().slice(0, 3);
  const monthIndex = MONTH_MAP[monthKey] ?? 0;
  const today = new Date();
  let year = today.getFullYear();

  if (monthIndex < today.getMonth() ||
      (monthIndex === today.getMonth() && today.getDate() > 15)) {
    year += 1;
  }

  const checkin = new Date(year, monthIndex, 15);
  const checkout = addDays(checkin, 3);
  return { checkin, checkout };
}

export const StaySearchControls = ({
  city,
  country,
  travelMonth,
}: StaySearchControlsProps) => {
  const defaults = useMemo(() => getDefaultDates(travelMonth), [travelMonth]);

  const [checkinDate, setCheckinDate] = useState<Date | undefined>(defaults.checkin);
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(defaults.checkout);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [area, setArea] = useState<AreaPreference>("no_preference");
  const [validationError, setValidationError] = useState<string | null>(null);

  const today = startOfDay(new Date());

  const searchUrl = useMemo(() => {
    if (!checkinDate || !checkoutDate || adults < 1) return null;
    if (isBefore(checkinDate, today) || isBefore(checkoutDate, checkinDate)) return null;
    return buildGoogleHotelsSearchUrl({
      city,
      country,
      checkinDate,
      checkoutDate,
      adults,
      children,
      area: area === "no_preference" ? undefined : area,
    });
  }, [city, country, checkinDate, checkoutDate, adults, children, area, today]);

  const handleSearch = () => {
    if (!checkinDate) {
      setValidationError("Please select a check-in date.");
      return;
    }
    if (isBefore(checkinDate, today)) {
      setValidationError("Check-in date must be in the future.");
      return;
    }
    if (!checkoutDate) {
      setValidationError("Please select a check-out date.");
      return;
    }
    if (isBefore(checkoutDate, checkinDate)) {
      setValidationError("Check-out must be after check-in.");
      return;
    }
    if (adults < 1) {
      setValidationError("At least 1 adult is required.");
      return;
    }
    setValidationError(null);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 md:p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Refine Your Search
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Check-in */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Check-in</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background",
                    !checkinDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkinDate ? format(checkinDate, "MMM d, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={checkinDate}
                  onSelect={setCheckinDate}
                  disabled={(date) => isBefore(date, today)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Check-out</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background",
                    !checkoutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkoutDate ? format(checkoutDate, "MMM d, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={checkoutDate}
                  onSelect={setCheckoutDate}
                  disabled={(date) => checkinDate ? isBefore(date, checkinDate) : isBefore(date, today)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Adults */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Adults</label>
            <Select value={adults.toString()} onValueChange={(v) => setAdults(parseInt(v))}>
              <SelectTrigger className="w-full bg-background">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} {n === 1 ? "adult" : "adults"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Children */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Children</label>
            <Select value={children.toString()} onValueChange={(v) => setChildren(parseInt(v))}>
              <SelectTrigger className="w-full bg-background">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {[0, 1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} {n === 1 ? "child" : "children"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area Preference */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs text-muted-foreground">Area preference (optional)</label>
            <Select value={area} onValueChange={(v) => setArea(v as AreaPreference)}>
              <SelectTrigger className="w-full bg-background">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {(Object.keys(AREA_LABELS) as AreaPreference[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {AREA_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {validationError && (
          <p className="text-sm text-destructive mt-3">{validationError}</p>
        )}

        <div className="mt-4">
          {searchUrl ? (
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Search stays
            </a>
          ) : (
            <Button onClick={handleSearch} className="w-full sm:w-auto gap-2">
              <Search className="h-4 w-4" />
              Search stays
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
