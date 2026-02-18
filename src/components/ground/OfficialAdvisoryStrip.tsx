import { OfficialAdvisory } from "@/types/onTheGround";
import { ExternalLink } from "lucide-react";

interface OfficialAdvisoryStripProps {
  advisories: OfficialAdvisory[];
}

const flags: Record<string, string> = { us: "🇺🇸", uk: "🇬🇧", ca: "🇨🇦" };
const sourceOrder: Array<"us" | "uk" | "ca"> = ["us", "uk", "ca"];

const pillBg = (level: number) => {
  if (level === 0) return "bg-muted/50 text-muted-foreground/60 border-border/40";
  if (level >= 4) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700";
  if (level >= 3) return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700";
  return "bg-muted text-muted-foreground border-border";
};

export const OfficialAdvisoryStrip = ({ advisories }: OfficialAdvisoryStripProps) => {
  // Build a map for quick lookup, ensure all 3 sources present
  const advisoryMap = new Map(advisories.map((a) => [a.source, a]));
  const ordered = sourceOrder.map(
    (src) =>
      advisoryMap.get(src) || {
        source: src,
        sourceName: src === "us" ? "US State Department" : src === "uk" ? "UK FCDO" : "Government of Canada",
        level: "Unavailable",
        levelNumeric: 0,
        summary: "",
        sourceUrl: "#",
        lastUpdated: "",
      }
  );

  const latestDate = ordered.reduce((latest, a) => (a.lastUpdated && a.lastUpdated > latest ? a.lastUpdated : latest), "");

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {ordered.map((a) => {
          const isExpanded = a.levelNumeric >= 3;
          const isUnavailable = a.levelNumeric === 0;
          return (
            <a
              key={a.source}
              href={isUnavailable ? undefined : a.sourceUrl}
              target={isUnavailable ? undefined : "_blank"}
              rel={isUnavailable ? undefined : "noopener noreferrer"}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${isUnavailable ? "cursor-default" : "hover:opacity-80"} ${pillBg(a.levelNumeric)} ${isExpanded ? "flex-col items-start px-4 py-3 rounded-xl w-full sm:w-auto" : ""}`}
            >
              <span className="flex items-center gap-1.5">
                <span>{flags[a.source] || "🌍"}</span>
                <span className="font-medium">{a.level}</span>
                {!isUnavailable && <ExternalLink className="w-3 h-3 opacity-50" />}
              </span>
              {isExpanded && a.summary && (
                <span className="text-xs opacity-80 leading-snug">{a.summary.slice(0, 150)}</span>
              )}
            </a>
          );
        })}
      </div>
      {latestDate && (
        <p className="text-xs text-muted-foreground">Last verified: {latestDate}</p>
      )}
    </div>
  );
};
