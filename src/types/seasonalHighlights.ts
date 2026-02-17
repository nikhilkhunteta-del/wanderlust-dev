export type SeasonalCategory =
  | "festival"
  | "cultural"
  | "seasonal_nature"
  | "seasonal_food"
  | "sports"
  | "other";

export type SeasonalConfidence = "high" | "medium" | "low";

export type SeasonalSection =
  | "festivals_cultural"
  | "food_traditions"
  | "weather_driven";

export interface SeasonalItem {
  title: string;
  date_range: string;
  category: SeasonalCategory;
  section: SeasonalSection;
  location: string | null;
  description: string;
  source_name: string;
  source_url: string;
  confidence: SeasonalConfidence;
}

export interface SeasonalHighlightsData {
  items: SeasonalItem[];
  monthOpener: string;
  fetchedAt: string;
  status: "ok" | "degraded" | "error";
  fromCache: boolean;
}

export interface SeasonalHighlightsRequest {
  city: string;
  country: string;
  travelMonth: string;
  travelYear?: number;
}
