export interface InterestScores {
  culture: number;
  nature: number;
  beach: number;
  food: number;
  nightlife: number;
  shopping: number;
  photography: number;
  wellness: number;
}

export type TravelStyleTag =
  | 'culture-focused'
  | 'nature-lover'
  | 'beach-seeker'
  | 'foodie'
  | 'adventure-seeker'
  | 'adventure-light'
  | 'relaxation-focused'
  | 'family-friendly'
  | 'nightlife-seeker'
  | 'photography-enthusiast'
  | 'wellness-oriented'
  | 'active-explorer'
  | 'slow-traveler';

export type GroupType = 'solo' | 'couple' | 'family' | 'friends' | 'group';

export type NoveltyPreference = 'classics' | 'mix' | 'off-beaten-path' | 'surprise';

export interface TravelProfile {
  // Normalized interest scores (0-1)
  interestScores: InterestScores;

  // Adventure intensity (0-1)
  adventureLevel: number;
  adventureTypes: string[];

  // Travel constraints
  departureCity: string;
  travelMonth: string;

  // Normalized preferences (0-1)
  tripDuration: number; // actual days
  travelPace: number; // 0=relaxed, 1=packed

  // Companion context
  travelCompanions: string;
  groupType: GroupType;

  // Novelty
  noveltyPreference: NoveltyPreference;
  foodDepth: string;

  // Inferred tags
  styleTags: TravelStyleTag[];

  // Personalization summary
  summary: string;

  // Completeness
  completenessScore: number;
  followUpQuestion: string | null;
}
