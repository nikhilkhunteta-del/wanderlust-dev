import { useState, useCallback } from "react";
import { useSituationalAwareness } from "@/hooks/useCityData";
import { SituationalEvent, EventCategory, ImpactLevel, StatusLabel } from "@/types/situationalAwareness";
import { DataFreshness } from "@/components/shared/DataFreshness";
import {
  Loader2, Radar, ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Bus, Shield, Megaphone, CloudLightning, Leaf, AlertCircle,
  CheckCircle2, Eye, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface SituationalTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

const categoryConfig: Record<EventCategory, { label: string; icon: React.ReactNode; color: string }> = {
  transport: { label: "Transport", icon: <Bus className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  safety: { label: "Safety", icon: <Shield className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  protest: { label: "Protest", icon: <Megaphone className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  extreme_weather: { label: "Weather", icon: <CloudLightning className="w-3.5 h-3.5" />, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  environmental: { label: "Environmental", icon: <Leaf className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  other: { label: "Other", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "bg-muted text-muted-foreground" },
};

const impactConfig: Record<ImpactLevel, { label: string; color: string }> = {
  high: { label: "High Impact", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50" },
  medium: { label: "Medium Impact", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50" },
  low: { label: "Low Impact", color: "bg-muted text-muted-foreground border-border" },
};

const statusConfig: Record<StatusLabel, { color: string; icon: React.ReactNode; bg: string }> = {
  Normal: {
    color: "text-emerald-700 dark:text-emerald-300",
    icon: <CheckCircle2 className="w-4 h-4" />,
    bg: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50",
  },
  Watch: {
    color: "text-amber-700 dark:text-amber-300",
    icon: <Eye className="w-4 h-4" />,
    bg: "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50",
  },
  Disrupted: {
    color: "text-red-700 dark:text-red-300",
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50",
  },
};

function DisruptionCard({ event }: { event: SituationalEvent }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const cat = categoryConfig[event.category] || categoryConfig.other;
  const impact = impactConfig[event.impact_level] || impactConfig.low;

  return (
    <article className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-shadow">
      {/* Top row: category + impact badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
          {cat.icon}
          {cat.label}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${impact.color}`}>
          {impact.label}
        </span>
      </div>

      <h3 className="font-semibold text-foreground mb-2 leading-snug">{event.title}</h3>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {event.summary}
      </p>

      {/* Traveler relevance */}
      {event.relevance_to_traveler && (
        <p className="text-sm text-foreground/80 bg-muted/40 rounded-lg px-3 py-2 mb-3">
          <span className="font-medium">Why it matters: </span>
          {event.relevance_to_traveler}
        </p>
      )}

      {/* When / Where chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {event.affected_areas && (
          <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
            📍 {event.affected_areas}
          </span>
        )}
        {event.start_date && (
          <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
            🕐 {new Date(event.start_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Recommended actions */}
      {event.recommended_actions?.length > 0 && (
        <ul className="space-y-1 mb-3">
          {event.recommended_actions.map((action, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              {action}
            </li>
          ))}
        </ul>
      )}

      {/* Collapsible sources */}
      <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2">
            {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Sources ({event.sources.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1.5">
          {event.sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:text-primary" />
              <span className="truncate">{source.title || source.publisher}</span>
              <span className="text-muted-foreground/60 flex-shrink-0">— {source.publisher}</span>
            </a>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Timestamp */}
      {event.start_date && (
        <p className="text-[10px] text-muted-foreground/50 mt-2">
          Updated {formatDistanceToNow(new Date(event.start_date), { addSuffix: true })}
        </p>
      )}
    </article>
  );
}

export const SituationalTab = ({ city, country, travelMonth }: SituationalTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useSituationalAwareness(city, country, travelMonth);
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<EventCategory | "all">("all");

  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["situational-awareness", city, country, travelMonth] });
  }, [queryClient, city, country, travelMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Scanning for travel disruptions...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Checking news from the past 7 days</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to load disruption data</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusLabel = data.statusLabel || "Normal";
  const sc = statusConfig[statusLabel];

  // Filter events
  const filteredEvents = (data.events || []).filter((e) => {
    if (activeFilter !== "all" && e.category !== activeFilter) return false;
    return true;
  });

  const activeCategories = [...new Set((data.events || []).map((e) => e.category))];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Radar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold">Current travel disruptions</h2>
              <p className="text-muted-foreground text-sm">
                Active situations that could affect your trip to {city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
              {sc.icon}
              {statusLabel}
            </div>
            <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {data.fetchedAt && (
            <span>Updated {formatDistanceToNow(new Date(data.fetchedAt), { addSuffix: true })}</span>
          )}
          <span>•</span>
          <span>Source window: last 7 days</span>
          {data.status === "degraded" && (
            <>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400">Using backup sources</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {activeCategories.map((cat) => {
            const config = categoryConfig[cat];
            if (!config) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-1.5 text-xs flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {filteredEvents.length === 0 ? (
          /* Calm empty state */
          <div className={`rounded-xl p-8 border ${sc.bg}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">
                  {activeFilter !== "all"
                    ? "No matching disruptions"
                    : "No significant travel disruptions reported in the past 7 days"}
                </h3>
                <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                  {data.statusSummary || `We scanned multiple news sources and found no active disruptions for ${city}. We'll keep monitoring.`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <section>
            <h3 className="font-semibold text-foreground mb-4">
              Active disruptions ({filteredEvents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((event) => (
                <DisruptionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
