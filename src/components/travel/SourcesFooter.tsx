import { ExternalLink } from "lucide-react";

interface SourcesFooterProps {
  sources: {
    name: string;
    url: string;
  }[];
  lastUpdated: string;
}

export const SourcesFooter = ({ sources, lastUpdated }: SourcesFooterProps) => {
  return (
    <div className="pt-6 border-t border-border/50 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Advisory information last updated: {lastUpdated}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {sources.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              {source.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70">
        This information is synthesized from official government travel advisories. 
        Always verify with your country's foreign affairs department before traveling.
      </p>
    </div>
  );
};
