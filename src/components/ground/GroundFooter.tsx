interface GroundFooterProps {
  sources: string[];
  lastUpdated: string;
  disclaimer: string;
}

export const GroundFooter = ({ sources, lastUpdated, disclaimer }: GroundFooterProps) => {
  return (
    <footer className="space-y-2 pt-4 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        Sources: {sources.join(" · ")} · Last updated: {lastUpdated}
      </p>
      <p className="text-xs text-muted-foreground/60">{disclaimer}</p>
    </footer>
  );
};
