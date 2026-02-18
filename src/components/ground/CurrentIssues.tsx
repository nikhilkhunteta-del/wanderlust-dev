import { CurrentIssue, IssueCategory, IssueStatus } from "@/types/onTheGround";
import { ExternalLink } from "lucide-react";

interface CurrentIssuesProps {
  issues: CurrentIssue[];
}

const categoryColors: Record<IssueCategory, string> = {
  transport: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  political: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  security: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  health: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  natural: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
};

const statusStyles: Record<IssueStatus, string> = {
  current: "bg-foreground/10 text-foreground border border-foreground/20",
  watch: "bg-transparent text-muted-foreground border border-muted-foreground/40",
  resolved: "bg-transparent text-muted-foreground/50 border border-muted-foreground/20 line-through",
};

export const CurrentIssues = ({ issues }: CurrentIssuesProps) => {
  if (!issues || issues.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-2">
        No significant disruptions reported for this period.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, i) => (
        <div key={i} className="p-4 rounded-xl border border-border/60 bg-card/50 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[issue.category] || categoryColors.other}`}>
              {issue.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[issue.status] || statusStyles.current}`}>
              {issue.status}
            </span>
          </div>
          <h4 className="font-medium text-foreground">{issue.title}</h4>
          <p className="text-xs text-muted-foreground" style={{ color: "#6B7280", fontSize: "12px" }}>
            Tourist impact: {issue.touristImpact}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.summary}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{issue.date}</span>
            {issue.sourceUrl && (
              <a
                href={issue.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
              >
                {issue.sourceName || "Source"} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
