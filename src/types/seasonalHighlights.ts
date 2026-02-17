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

export type PrimaryType =
  | "Festival"
  | "Cultural"
  | "Food"
  | "Experience"
  | "Conference"
  | "Sports"
  | "Nature"
  | "Other";

export interface SeasonalItem {
  event_id: string;
  title: string;
  date_range: string;
  start_date: string | null;
  end_date: string | null;
  category: SeasonalCategory;
  primary_type: PrimaryType;
  secondary_tags: string[];
  section: SeasonalSection;
  location: string | null;
  description: string;
  why_it_matters: string | null;
  impact_score: number; // 0–10
  source_name: string;
  source_url: string;
  confidence: SeasonalConfidence;
  verified: boolean;
  image_url?: string;
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
