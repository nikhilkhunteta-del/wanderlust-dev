export interface SignatureExperience {
  title: string;
  description: string;
  imageQuery: string;
  bookingUrl: string | null;
  category?: string;
  childNote?: string;
}

export interface CityHighlights {
  matchStatement: string;
  experiences: SignatureExperience[];
  vibeTags: string[];
  heroImageQuery: string;
  personalMatchReasons?: string[];
  perfectDayNarrative?: string;
  featuredExperienceIndex?: number;
  experienceThemes?: ExperienceTheme[];
}

export interface ExperienceTheme {
  themeLabel: string;
  experienceIndices: number[];
}

export interface CityHighlightsRequest {
  city: string;
  country: string;
  rationale: string;
  userInterests: string[];
  adventureTypes: string[];
  travelMonth: string;
  styleTags: string[];
  travelCompanions?: string;
  groupType?: string;
}
