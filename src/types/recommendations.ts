export interface CityRecommendation {
  city: string;
  country: string;
  rationale: string;
  tags: string[];
  imageQuery: string;
}

export interface RecommendationsResponse {
  recommendations: CityRecommendation[];
  error?: string;
}
