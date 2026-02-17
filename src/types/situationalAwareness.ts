/**
 * Situational Awareness Data Types
 * 
 * Architecture:
 * - Primary source: Perplexity Search API (grounded, cited)
 * - Backup: Firecrawl (Google News scraping)
 * - Caching: 6-hour TTL in situational_cache table
 * - Rule: No factual claim without at least one source URL
 */

export type EventCategory =
  | "transport"
  | "safety"
  | "protest"
  | "extreme_weather"
  | "crowds_closures"
  | "entry_rules"
  | "other";

export type StatusLabel = "Normal" | "Watch" | "Disrupted";

export interface EventSource {
  url: string;
  title: string;
  publisher: string;
  published_at?: string | null;
}

export interface SituationalEvent {
  id: string;
  category: EventCategory;
  severity: number; // 1-5
  confidence: number; // 0-1
  title: string;
  start_time: string | null;
  end_time: string | null;
  affected_areas: string;
  traveler_impact_summary: string;
  recommended_actions: string[];
  sources: EventSource[];
}

export interface SourceItem {
  url: string;
  title: string;
  publisher: string;
  published_at: string | null;
  snippet: string;
  query_used: string;
}

export interface SituationalAwarenessData {
  events: SituationalEvent[];
  sources: SourceItem[];
  overallSeverity: number;
  statusLabel: StatusLabel;
  statusSummary: string;
  fetchedAt: string;
  status: "ok" | "degraded" | "error";
}

export interface SituationalAwarenessRequest {
  city: string;
  country: string;
  travelMonth: string;
}

// Legacy types kept for compatibility
export type IssueCategory =
  | "political"
  | "security"
  | "transport"
  | "weather"
  | "health"
  | "natural"
  | "holiday"
  | "other";

export type IssueTimeframe = "ongoing" | "expected" | "seasonal";

export interface SituationalIssue {
  title: string;
  category: IssueCategory;
  timeframe: IssueTimeframe;
  summary: string;
  sourceUrl: string;
  sourceName: string;
}

export interface SeasonalPattern {
  title: string;
  description: string;
}
