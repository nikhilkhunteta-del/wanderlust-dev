export interface InterestScores {
  'culture-history': number;
  'nature-outdoors': number;
  'beach-coastal': number;
  'food-culinary': number;
  'arts-music-nightlife': number;
  'active-sport': number;
  'shopping-markets': number;
  'wellness-slow-travel': number;
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
  | 'active-explorer'
  | 'wellness-oriented'
  | 'slow-traveler';

export type GroupType = 'solo' | 'couple' | 'family' | 'friends' | 'group';

export type NoveltyPreference = 'classics' | 'mix' | 'off-beaten-path' | 'surprise';

export interface TravelProfile {
  interestScores: InterestScores;
  primaryInterest: string;

  adventureLevel: number;
  adventureTypes: string[];

  departureCity: string;
  travelMonth: string;

  tripDuration: number;

  travelCompanions: string;
  groupType: GroupType;

  noveltyPreference: NoveltyPreference;
  foodDepth: string;

  styleTags: TravelStyleTag[];

  summary: string;

  completenessScore: number;
  followUpQuestion: string | null;
}
