import { useState, useRef, useCallback } from "react";
import { useSituationalAwareness } from "@/hooks/useCityData";
import { SituationalEvent, EventCategory, SourceItem, StatusLabel } from "@/types/situationalAwareness";
import { DataFreshness } from "@/components/shared/DataFreshness";
import {
  Loader2, Radar, ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Bus, Shield, Megaphone, CloudLightning, Users, FileCheck, AlertCircle,
  CheckCircle2, Eye, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface SituationalTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

const MONTH_DISPLAY: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "your visit",
};

const categoryConfig: Record<EventCategory, { label: string; icon: React.ReactNode; color: string }> = {
  transport: { label: "Transport", icon: <Bus className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  safety: { label: "Safety", icon: <Shield className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  protest: { label: "Protest", icon: <Megaphone className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  extreme_weather: { label: "Weather", icon: <CloudLightning className="w-3.5 h-3.5" />, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  crowds_closures: { label: "Crowds", icon: <Users className="w-3.5 h-3.5" />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  entry_rules: { label: "Entry Rules", icon: <FileCheck className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  other: { label: "Other", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "bg-muted text-muted-foreground" },
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

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low";
  const color = confidence >= 0.8
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    : confidence >= 0.5
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-muted text-muted-foreground";
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color}`}>{label} confidence</span>;
}

function ImpactCard({ event }: { event: SituationalEvent }) {
  const [open, setOpen] = useState(false);
  const cat = categoryConfig[event.category] || categoryConfig.other;

  return (
    <article className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
            {cat.icon}
            {cat.label}
          </span>
          <ConfidenceBadge confidence={event.confidence} />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{event.severity}</span>/5
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-2 leading-snug">{event.title}</h3>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {event.traveler_impact_summary}
      </p>

      {/* When / Where chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {event.affected_areas && (
          <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
            📍 {event.affected_areas}
          </span>
        )}
        {event.start_time && (
          <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
            🕐 {new Date(event.start_time).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Recommended actions */}
      {event.recommended_actions && event.recommended_actions.length > 0 && (
        <ul className="space-y-1 mb-3">
          {event.recommended_actions.map((action, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              {action}
            </li>
          ))}
        </ul>
      )}

      {/* Sources */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2">
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            View sources ({event.sources.length})
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
    </article>
  );
}

function SourceFeedItem({ source }: { source: SourceItem }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors group"
    >
      <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {source.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{source.snippet}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-medium text-muted-foreground/70">{source.publisher}</span>
          {source.published_at && (
            <span className="text-[10px] text-muted-foreground/50">
              {formatDistanceToNow(new Date(source.published_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export const SituationalTab = ({ city, country, travelMonth }: SituationalTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useSituationalAwareness(city, country, travelMonth);
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<EventCategory | "all">("all");
  const [highImpactOnly, setHighImpactOnly] = useState(false);

  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["situational-awareness", city, country, travelMonth] });
  }, [queryClient, city, country, travelMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Scanning verified sources...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Searching Perplexity + news feeds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to load situational awareness</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const monthDisplay = MONTH_DISPLAY[travelMonth] || travelMonth;
  const statusLabel = data.statusLabel || "Normal";
  const sc = statusConfig[statusLabel];

  // Filter events
  const filteredEvents = (data.events || []).filter((e) => {
    if (activeFilter !== "all" && e.category !== activeFilter) return false;
    if (highImpactOnly && e.severity < 4) return false;
    return true;
  });

  // Active categories for filter chips
  const activeCategories = [...new Set((data.events || []).map((e) => e.category))];

  // Source feed (most recent first, max 8)
  const sourceFeed = [...(data.sources || [])]
    .sort((a, b) => {
      if (a.published_at && b.published_at) return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      return 0;
    })
    .slice(0, 8);

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
              <h2 className="text-2xl font-display font-semibold">Live updates for your trip</h2>
              <p className="text-muted-foreground text-sm">
                What might affect plans in {city} in {monthDisplay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Status pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
              {sc.icon}
              {statusLabel}
            </div>
            <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
          </div>
        </div>

        {/* Meta info */}
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setHighImpactOnly(!highImpactOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              highImpactOnly
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            High impact only
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Status Banner (when no events) */}
        {filteredEvents.length === 0 && (
          <div className={`rounded-xl p-6 border ${sc.bg}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                statusLabel === "Normal"
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : "bg-amber-100 dark:bg-amber-900/50"
              }`}>
                {statusLabel === "Normal" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Eye className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className={`font-semibold text-lg ${sc.color}`}>
                  {highImpactOnly || activeFilter !== "all"
                    ? "No matching events"
                    : "No recent verified disruptions found"}
                </h3>
                <p className={`mt-1 text-sm ${sc.color} opacity-80`}>
                  {data.statusSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Impact Cards */}
        {filteredEvents.length > 0 && (
          <section>
            <h3 className="font-semibold text-foreground mb-4">
              Active situations ({filteredEvents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.slice(0, 6).map((event) => (
                <ImpactCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Source Feed */}
        {sourceFeed.length > 0 && (
          <section>
            <h3 className="font-semibold text-foreground mb-3">What changed recently</h3>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              {sourceFeed.map((source, i) => (
                <SourceFeedItem key={i} source={source} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
