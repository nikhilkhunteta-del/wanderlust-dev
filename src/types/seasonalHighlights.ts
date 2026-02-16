export type SeasonalCategory = 
  | "cultural" 
  | "natural" 
  | "food" 
  | "religious" 
  | "music" 
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
  wikipediaUrl: string | null;
  officialUrl: string | null;
  googleSearchUrl: string;
}

export interface SeasonalHighlightsData {
  openingStatement: string;
  monthSummary: string;
  highlights: SeasonalHighlight[];
}

export interface SeasonalHighlightsRequest {
  city: string;
  country: string;
  travelMonth: string;
}
