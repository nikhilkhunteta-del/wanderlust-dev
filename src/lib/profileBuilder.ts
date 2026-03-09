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

export function normalizeInterestScores(interests: string[]): InterestScores {
  const scores: InterestScores = {
    culture: 0, nature: 0, beach: 0, food: 0,
    nightlife: 0, shopping: 0, photography: 0, wellness: 0,
  };
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
  const { interests, adventureExperiences, travelCompanions, travelPace } = preferences;

  if (interests.includes('culture')) tags.push('culture-focused');
  if (interests.includes('nature')) tags.push('nature-lover');
  if (interests.includes('beach')) tags.push('beach-seeker');
  if (interests.includes('food')) tags.push('foodie');
  if (interests.includes('nightlife')) tags.push('nightlife-seeker');
  if (interests.includes('wellness')) tags.push('wellness-oriented');
  if (interests.includes('photography')) tags.push('photography-enthusiast');

  const activeAdventures = adventureExperiences.filter((exp) => exp !== 'none');
  if (activeAdventures.length >= 3) {
    tags.push('adventure-seeker');
  } else if (activeAdventures.length >= 1) {
    tags.push('adventure-light');
  } else if (adventureExperiences.includes('none') && adventureExperiences.length === 1) {
    tags.push('relaxation-focused');
  }

  if (travelCompanions === 'family') tags.push('family-friendly');
  if (travelPace >= 75) tags.push('active-explorer');
  else if (travelPace <= 25) tags.push('slow-traveler');

  return tags;
}

export function generateSummary(profile: Partial<TravelProfile>): string {
  const {
    travelCompanions = 'solo',
    interestScores = {} as InterestScores,
    travelMonth = '',
    tripDuration = 7,
    travelPace = 0.5,
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
  const paceDesc = travelPace >= 0.75 ? 'action-packed' : travelPace <= 0.25 ? 'relaxed' : 'balanced';
  const companionLabel = COMPANION_LABELS[travelCompanions] || 'trip';

  return `We'll find destinations perfect for a ${companionLabel} focused on ${topInterests} in ${monthLabel}, with a ${paceDesc} ${tripDuration}-day itinerary.`;
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

  const profile: TravelProfile = {
    interestScores,
    adventureLevel,
    adventureTypes: preferences.adventureExperiences.filter((exp) => exp !== 'none'),
    departureCity: preferences.departureCity,
    travelMonth: preferences.travelMonth,
    tripDuration: preferences.tripDuration,
    travelPace: preferences.travelPace / 100,
    travelCompanions: preferences.travelCompanions,
    groupType: mapToGroupType(preferences.travelCompanions),
    noveltyPreference: mapToNovelty(preferences.noveltyPreference),
    foodDepth: preferences.foodDepth || '',
    styleTags,
    summary: '',
    completenessScore: 0,
    followUpQuestion: null,
  };

  const totalFields = 8;
  const filledFields = Object.entries(preferences).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }).length;
  profile.completenessScore = filledFields / totalFields;

  profile.summary = generateSummary(profile);

  return profile;
}
