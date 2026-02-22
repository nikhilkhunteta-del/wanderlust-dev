export type SeasonalCategory = 
  | "cultural" 
  | "natural" 
  | "food" 
  | "religious" 
  | "music" 
  | "sport"
  | "other";

export type SeasonalUrgency = 
  | "only_this_month"
  | "best_this_month"
  | "short_window"
  | null;

export type SeasonalSection = 
  | "festivals_cultural"
  | "food_traditions"
  | "weather_driven";

export interface SeasonalHighlight {
  title: string;
  timing: string;
  category: SeasonalCategory;
  section: SeasonalSection;
  description: string;
  whySeasonal: string;
  urgency: SeasonalUrgency;
  imageQuery: string;
  sourceUrl: string | null;
  sourceName: string | null;
  wikipediaUrl: string | null;
  location: string | null;
  matchesInterests: boolean;
  notToBeMissed: boolean;
  isAiGenerated: boolean;
  missNote: string | null;
  /** @deprecated Use sourceUrl instead */
  officialUrl?: string | null;
  /** @deprecated Use sourceUrl instead */
  googleSearchUrl?: string;
}

export interface SeasonalHighlightsData {
  openingStatement: string;
  monthSummary?: string;
  highlights: SeasonalHighlight[];
}

export interface SeasonalHighlightsRequest {
  city: string;
  country: string;
  travelMonth: string;
  userInterests?: string[];
  travelCompanions?: string;
  styleTags?: string[];
}
