import { useQuery } from "@tanstack/react-query";
import { getOnTheGround } from "@/lib/onTheGround";
import { OnTheGroundData, VisaInfo } from "@/types/onTheGround";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VisaStatusCalloutProps {
  city: string;
  country: string;
  travelMonth: string;
  onSwitchTab?: (tab: string) => void;
}

function getVisaBorderColor(visa: VisaInfo): string {
  if (visa.visaRequired) return "#EF4444"; // red
  if (visa.eVisaAvailable) return "#F59E0B"; // amber
  return "#16A34A"; // green
}

function getVisaSummary(visa: VisaInfo): string {
  if (visa.visaRequired) {
    return "Visa required · Apply through embassy";
  }
  if (visa.eVisaAvailable) {
    return "eVisa required · Apply before travel";
  }
  if (visa.isSchengen) {
    return "No visa required for most nationalities · Schengen Area";
  }
  if (visa.visaFreeNationalities.length > 0) {
    return `No visa required for ${visa.visaFreeNationalities.length}+ nationalities`;
  }
  return "Check visa requirements for your nationality";
}

export const VisaStatusCallout = ({
  city,
  country,
  travelMonth,
  onSwitchTab,
}: VisaStatusCalloutProps) => {
  const { data, isLoading } = useQuery<OnTheGroundData>({
    queryKey: ["on-the-ground", city, country, travelMonth],
    queryFn: () => getOnTheGround({ city, country, travelMonth }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50 px-4 py-3">
        <Skeleton className="h-5 w-3/4" />
      </div>
    );
  }

  if (!data?.visaInfo) return null;

  const visa = data.visaInfo;
  const borderColor = getVisaBorderColor(visa);
  const summary = getVisaSummary(visa);

  return (
    <div
      className="rounded-lg border border-border/50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        <span className="text-sm text-foreground">{summary}</span>
      </div>
      {onSwitchTab && (
        <button
          onClick={() => onSwitchTab("ground")}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors flex-shrink-0"
        >
          Full entry requirements
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
