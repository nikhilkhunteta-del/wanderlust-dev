import { TravelPreferences } from '@/types/questionnaire';
import {
  TravelProfile,
  InterestScores,
  TravelStyleTag,
  GroupType,
  NoveltyPreference,
} from '@/types/travelProfile';

const COMPANION_LABELS: Record<string, string> = {
  solo: 'solo adventure',
  couple: 'romantic getaway',
  family: 'family trip',
  friends: 'friends trip',
  group: 'group travel',
};

const INTEREST_KEYS: (keyof InterestScores)[] = [
  'culture-history', 'nature-outdoors', 'beach-coastal', 'food-culinary',
  'arts-music-nightlife', 'active-sport', 'shopping-markets', 'wellness-slow-travel',
];

export function normalizeInterestScores(interests: string[]): InterestScores {
  const scores = Object.fromEntries(INTEREST_KEYS.map(k => [k, 0])) as unknown as InterestScores;
  for (const interest of interests) {
    if (interest in scores) {
      scores[interest as keyof InterestScores] = 1.0;
    }
  }
  return scores;
}

export function calculateAdventureLevel(experiences: string[]): number {
  const active = experiences.filter((exp) => exp !== 'none');
  if (active.length === 0) return 0;
  return Math.min(active.length * 0.25, 1.0);
}

export function inferStyleTags(preferences: TravelPreferences): TravelStyleTag[] {
  const tags: TravelStyleTag[] = [];
  const { interests, adventureExperiences, travelCompanions } = preferences;

  if (interests.includes('culture-history')) tags.push('culture-focused');
  if (interests.includes('nature-outdoors')) tags.push('nature-lover');
  if (interests.includes('beach-coastal')) tags.push('beach-seeker');
  if (interests.includes('food-culinary')) tags.push('foodie');
  if (interests.includes('arts-music-nightlife')) tags.push('nightlife-seeker');
  if (interests.includes('active-sport')) tags.push('active-explorer');
  if (interests.includes('wellness-slow-travel')) tags.push('wellness-oriented');

  const activeAdventures = adventureExperiences.filter((exp) => exp !== 'none');
  if (activeAdventures.length >= 3) {
    tags.push('adventure-seeker');
  } else if (activeAdventures.length >= 1) {
    tags.push('adventure-light');
  } else if (adventureExperiences.includes('none') && adventureExperiences.length === 1) {
    tags.push('relaxation-focused');
  }

  if (travelCompanions === 'family') tags.push('family-friendly');

  return tags;
}

export function generateSummary(profile: Partial<TravelProfile>): string {
  const {
    travelCompanions = 'solo',
    interestScores = {} as InterestScores,
    travelMonth = '',
    tripDuration = 7,
  } = profile;

  const sortedInterests = Object.entries(interestScores)
    .filter(([_, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([interest]) => interest);

  const topInterests = sortedInterests.length > 0 ? sortedInterests.join(' and ') : 'diverse experiences';

  const MONTH_LABELS: Record<string, string> = {
    jan: 'January', feb: 'February', mar: 'March', apr: 'April',
    may: 'May', jun: 'June', jul: 'July', aug: 'August',
    sep: 'September', oct: 'October', nov: 'November', dec: 'December',
    flexible: 'flexible dates',
  };

  const monthLabel = MONTH_LABELS[travelMonth] || 'your chosen dates';
  const companionLabel = COMPANION_LABELS[travelCompanions] || 'trip';

  return `We'll find destinations perfect for a ${companionLabel} focused on ${topInterests} in ${monthLabel}, with a ${tripDuration}-day itinerary.`;
}

function mapToGroupType(companion: string): GroupType {
  const validTypes: GroupType[] = ['solo', 'couple', 'family', 'friends', 'group'];
  return validTypes.includes(companion as GroupType) ? (companion as GroupType) : 'solo';
}

function mapToNovelty(novelty: string): NoveltyPreference {
  const valid: NoveltyPreference[] = ['classics', 'mix', 'off-beaten-path', 'surprise'];
  return valid.includes(novelty as NoveltyPreference) ? (novelty as NoveltyPreference) : 'mix';
}

export function buildTravelProfile(preferences: TravelPreferences): TravelProfile {
  const interestScores = normalizeInterestScores(preferences.interests);
  const adventureLevel = calculateAdventureLevel(preferences.adventureExperiences);
  const styleTags = inferStyleTags(preferences);
  const tripDuration = parseInt(preferences.tripDuration) || 7;

  const profile: TravelProfile = {
    interestScores,
    primaryInterest: preferences.primaryInterest || preferences.interests[0] || '',
    adventureLevel,
    adventureTypes: preferences.adventureExperiences.filter((exp) => exp !== 'none'),
    bucketListExperiences: preferences.adventureExperiences.filter((exp) => exp !== 'none'),
    culturalMoments: preferences.culturalMoments || [],
    departureCity: preferences.departureCity,
    travelMonth: preferences.travelMonth,
    tripDuration,
    travelCompanions: preferences.travelCompanions,
    groupType: mapToGroupType(preferences.travelCompanions),
    noveltyPreference: mapToNovelty(preferences.noveltyPreference),
    foodDepth: preferences.foodDepth || '',
    styleTags,
    summary: '',
    completenessScore: 0,
    followUpQuestion: null,
  };

  const totalFields = 7;
  const filledFields = Object.entries(preferences).filter(([key, value]) => {
    if (key === 'primaryInterest') return false; // don't count inline selector
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }).length;
  profile.completenessScore = filledFields / totalFields;

  profile.summary = generateSummary(profile);

  return profile;
}
