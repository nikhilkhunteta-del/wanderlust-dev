export interface SignatureExperience {
  title: string;
  description: string;
  imageQuery: string;
  bookingUrl: string | null;
}

export interface CityHighlights {
  matchStatement: string;
  experiences: SignatureExperience[];
  vibeTags: string[];
  heroImageQuery: string;
}

export interface CityHighlightsRequest {
  city: string;
  country: string;
  rationale: string;
  userInterests: string[];
  adventureTypes: string[];
  travelMonth: string;
  styleTags: string[];
}
