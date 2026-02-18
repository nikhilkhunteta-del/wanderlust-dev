import { VisaInfo } from "@/types/onTheGround";
import { ExternalLink } from "lucide-react";

interface EntryVisaProps {
  visa: VisaInfo;
}

const eVisaLabel = (visa: VisaInfo) => {
  if (visa.visaRequired) return "Visa required — check requirements for your nationality";
  if (visa.eVisaAvailable && visa.eVisaUrl) {
    return (
      <a href={visa.eVisaUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
        Available — apply before travel <ExternalLink className="w-3 h-3" />
      </a>
    );
  }
  if (visa.eVisaAvailable) return "Available — apply before travel";
  return "Not required";
};

export const EntryVisa = ({ visa }: EntryVisaProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <span className="text-xs font-medium text-foreground block mb-1">Passport validity</span>
            {visa.passportValidity}
          </div>
          <div>
            <span className="text-xs font-medium text-foreground block mb-1">eVisa</span>
            {eVisaLabel(visa)}
          </div>
        </div>

        {visa.activeRestrictions && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
            {visa.activeRestrictions}
          </div>
        )}

        {visa.visaFreeNationalities.length > 0 && (
          <div>
            <span className="text-xs font-medium text-foreground block mb-2">Visa-free for</span>
            <div className="flex flex-wrap gap-1.5">
              {visa.visaFreeNationalities.map((nat) => (
                <span key={nat} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                  {nat}
                </span>
              ))}
            </div>
          </div>
        )}

        {visa.isSchengen && (
          <p className="text-xs text-muted-foreground">
            This country is part of the Schengen Area — no eVisa required for visa-free nationalities, but ETIAS authorisation will be required from late 2026
          </p>
        )}

        {!visa.isSchengen && visa.entryFrameworkNote && (
          <p className="text-xs text-muted-foreground">
            {visa.entryFrameworkNote}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Requirements vary by nationality — verify yours at{" "}
        <a
          href="https://www.iatatravelcentre.com/world.php"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          IATA Travel Centre <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </div>
  );
};
