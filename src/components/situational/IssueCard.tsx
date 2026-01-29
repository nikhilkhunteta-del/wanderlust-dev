import { SituationalIssue, IssueCategory, IssueTimeframe } from "@/types/situationalAwareness";
import { ExternalLink, Vote, Shield, Bus, CloudRain, Stethoscope, Mountain, PartyPopper, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IssueCardProps {
  issue: SituationalIssue;
}

const categoryConfig: Record<IssueCategory, { label: string; icon: React.ReactNode; color: string }> = {
  political: {
    label: "Political",
    icon: <Vote className="w-3.5 h-3.5" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  security: {
    label: "Security",
    icon: <Shield className="w-3.5 h-3.5" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  transport: {
    label: "Transport",
    icon: <Bus className="w-3.5 h-3.5" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  weather: {
    label: "Weather",
    icon: <CloudRain className="w-3.5 h-3.5" />,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  },
  health: {
    label: "Health",
    icon: <Stethoscope className="w-3.5 h-3.5" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  natural: {
    label: "Natural",
    icon: <Mountain className="w-3.5 h-3.5" />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  holiday: {
    label: "Holiday",
    icon: <PartyPopper className="w-3.5 h-3.5" />,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  },
  other: {
    label: "Other",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
};

const timeframeLabels: Record<IssueTimeframe, string> = {
  ongoing: "Ongoing",
  expected: "Expected",
  seasonal: "Seasonal",
};

export const IssueCard = ({ issue }: IssueCardProps) => {
  const category = categoryConfig[issue.category] || categoryConfig.other;

  return (
    <article className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${category.color}`}>
            {category.icon}
            {category.label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {timeframeLabels[issue.timeframe]}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-2">{issue.title}</h3>
      
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {issue.summary}
      </p>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
        onClick={() => window.open(issue.sourceUrl, "_blank")}
      >
        <ExternalLink className="w-3 h-3" />
        {issue.sourceName}
      </Button>
    </article>
  );
};
