export type SeasonalCategory = 
  | "cultural" 
  | "natural" 
  | "food" 
  | "religious" 
  | "music" 
  | "other";

export interface SeasonalHighlight {
  title: string;
  timing: string;
  category: SeasonalCategory;
  description: string;
  imageQuery: string;
  wikipediaUrl: string | null;
  officialUrl: string | null;
  googleSearchUrl: string;
}

export interface SeasonalHighlightsData {
  openingStatement: string;
  highlights: SeasonalHighlight[];
}

export interface SeasonalHighlightsRequest {
  city: string;
  country: string;
  travelMonth: string;
}
