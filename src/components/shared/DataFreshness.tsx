import { Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataFreshnessProps {
  isFetching: boolean;
  isFromCache: boolean;
  className?: string;
}

export const DataFreshness = ({ isFetching, isFromCache, className }: DataFreshnessProps) => {
  if (isFetching) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-primary/10 text-primary border border-primary/20",
          "animate-pulse",
          className
        )}
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Updating...</span>
      </div>
    );
  }

  if (isFromCache) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-accent text-accent-foreground border border-border",
          "animate-in fade-in duration-300",
          className
        )}
      >
        <Zap className="w-3 h-3" />
        <span>Instant</span>
      </div>
    );
  }

  return null;
};
