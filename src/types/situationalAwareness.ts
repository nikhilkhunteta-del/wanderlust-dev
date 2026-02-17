/**
 * Situational Awareness Data Types
 * 
 * Scope: ONLY real-time travel disruptions.
 * - Transport disruptions (strikes, cancellations, closures)
 * - Safety/political events (protests, curfews, unrest)
 * - Natural/environmental hazards (floods, storms, fires, pollution)
 * 
 * NOT included: advisories, health, festivals, generic tips.
 */

export type EventCategory =
  | "transport"
  | "safety"
  | "protest"
  | "extreme_weather"
  | "environmental"
  | "other";

export type ImpactLevel = "high" | "medium" | "low";

export type StatusLabel = "Normal" | "Watch" | "Disrupted";

export interface EventSource {
  url: string;
  title: string;
  publisher: string;
}

export interface SituationalEvent {
  id: string;
  category: EventCategory;
  impact_level: ImpactLevel;
  severity: number; // 1-5
  confidence: number; // 0-1
  title: string;
  summary: string;
  relevance_to_traveler: string;
  start_date: string | null;
  affected_areas: string;
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
