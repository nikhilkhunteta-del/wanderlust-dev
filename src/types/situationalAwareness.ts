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

export interface SituationalAwarenessData {
  hasDisruptions: boolean;
  statusSummary: string;
  issues: SituationalIssue[];
  seasonalPatterns: SeasonalPattern[];
  practicalImpact: string;
  lastUpdated: string;
  dataSource: string;
}

export interface SituationalAwarenessRequest {
  city: string;
  country: string;
  travelMonth: string;
}
