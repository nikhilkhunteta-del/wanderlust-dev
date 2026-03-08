import { useRef } from "react";
import { useOnTheGround } from "@/hooks/useCityData";
import { VerdictBar } from "./VerdictBar";
import { OfficialAdvisoryStrip } from "./OfficialAdvisoryStrip";
import { CurrentIssues } from "./CurrentIssues";
import { SafetyGuidance } from "./SafetyGuidance";
import { EntryVisa } from "./EntryVisa";
import { EmergencyContacts } from "./EmergencyContacts";
import { GroundFooter } from "./GroundFooter";
import { CompactHealthSection } from "./CompactHealthSection";
import { Loader2 } from "lucide-react";

interface OnTheGroundTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

export const OnTheGroundTab = ({ city, country, travelMonth }: OnTheGroundTabProps) => {
  const { data, isLoading, error } = useOnTheGround(city, country, travelMonth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking conditions on the ground…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2 font-medium">Unable to load safety information</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Section 1 — Verdict (expanded master synthesis) */}
      <VerdictBar verdict={data.verdict} level={data.verdictLevel} />

      {/* Section 2 — Advisory pills (reference-only, no additional paragraph) */}
      <OfficialAdvisoryStrip advisories={data.officialAdvisories} />

      {/* Section 3 — What's Happening Now (factual news cards + forward assessment) */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">What's Happening Now</h3>
        {data.currentIssues.length > 0 ? (
          <>
            <CurrentIssues issues={data.currentIssues} />
            {data.forwardAssessment && (
              <p className="text-sm leading-relaxed text-muted-foreground/70 pt-1">
                <span className="text-muted-foreground/50 italic">Looking ahead — </span>
                {data.forwardAssessment}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No significant disruptions reported in the last 90 days.</p>
        )}
      </section>

      {/* Section 4 — Safety Guidance */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Good to Know</h3>
        <SafetyGuidance clusters={data.safetyGuidance} />
      </section>

      {/* Section 5 — Entry & Visa */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Getting In</h3>
        <EntryVisa visa={data.visaInfo} country={country} />
      </section>

      {/* Section 6 — Emergency Contacts */}
      <EmergencyContacts
        contacts={data.emergencyContacts}
        note={data.emergencyNote}
        city={city}
      />

      {/* Section 7 — Footer */}
      <GroundFooter
        sources={data.sources}
        lastUpdated={data.lastUpdated}
        disclaimer={data.disclaimer}
      />
    </div>
  );
};
