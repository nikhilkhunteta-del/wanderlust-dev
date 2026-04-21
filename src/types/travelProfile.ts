export interface InterestScores {
  'culture-experiences': number;
  'sun-rest': number;
  'nature-adventure': number;
  'food-nightlife': number;
  'wellness': number;
  'celebration': number;
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

export type NoveltyPreference = 'classics' | 'off-beaten-path' | 'surprise';

export interface TravelProfile {
  interestScores: InterestScores;
  primaryInterest: string;

  adventureLevel: number;
  adventureTypes: string[];
  bucketListExperiences: string[];
  culturalMoments: string[];
  culturalMomentDetails?: { value: string; label: string; city: string; country: string }[];

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
