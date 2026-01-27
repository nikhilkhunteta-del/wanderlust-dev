import { TravelPreferences } from '@/types/questionnaire';
import {
  TravelProfile,
  InterestScores,
  TravelStyleTag,
  GroupType,
} from '@/types/travelProfile';

const INTEREST_KEYS: (keyof InterestScores)[] = [
  'culture',
  'nature',
  'beach',
  'food',
  'nightlife',
  'shopping',
  'photography',
  'wellness',
];

const MONTH_LABELS: Record<string, string> = {
  jan: 'January',
  feb: 'February',
  mar: 'March',
  apr: 'April',
  may: 'May',
  jun: 'June',
  jul: 'July',
  aug: 'August',
  sep: 'September',
  oct: 'October',
  nov: 'November',
  dec: 'December',
  flexible: 'flexible dates',
};

const COMPANION_LABELS: Record<string, string> = {
  solo: 'solo adventure',
  couple: 'romantic getaway',
  family: 'family trip',
  friends: 'friends trip',
  group: 'group travel',
};

const REGION_LABELS: Record<string, string> = {
  europe: 'Europe',
  asia: 'Asia',
  'north-america': 'North America',
  'south-america': 'South America',
  africa: 'Africa',
  oceania: 'Oceania',
  anywhere: 'anywhere',
};

/**
 * Normalize interest selections into weighted scores (0-1)
 * Since multi-select doesn't capture order, all selected items receive 1.0
 */
export function normalizeInterestScores(interests: string[]): InterestScores {
  const scores: InterestScores = {
    culture: 0,
    nature: 0,
    beach: 0,
    food: 0,
    nightlife: 0,
    shopping: 0,
    photography: 0,
    wellness: 0,
  };

  for (const interest of interests) {
    if (interest in scores) {
      scores[interest as keyof InterestScores] = 1.0;
    }
  }

  return scores;
}

/**
 * Calculate adventure level based on selected experiences
 * Returns 0-1 scale based on number and type of adventures
 */
export function calculateAdventureLevel(experiences: string[]): number {
  const activeExperiences = experiences.filter((exp) => exp !== 'none');

  if (activeExperiences.length === 0) {
    return 0;
  }

  // Scale: 1 experience = 0.25, 2 = 0.5, 3 = 0.75, 4+ = 1.0
  return Math.min(activeExperiences.length * 0.25, 1.0);
}

/**
 * Infer travel style tags from questionnaire responses
 */
export function inferStyleTags(preferences: TravelPreferences): TravelStyleTag[] {
  const tags: TravelStyleTag[] = [];
  const { interests, adventureExperiences, travelCompanions, travelPace } = preferences;

  // Interest-based tags
  if (interests.includes('culture')) tags.push('culture-focused');
  if (interests.includes('nature')) tags.push('nature-lover');
  if (interests.includes('beach')) tags.push('beach-seeker');
  if (interests.includes('food')) tags.push('foodie');
  if (interests.includes('nightlife')) tags.push('nightlife-seeker');
  if (interests.includes('wellness')) tags.push('wellness-oriented');
  if (interests.includes('photography')) tags.push('photography-enthusiast');

  // Adventure-based tags
  const activeAdventures = adventureExperiences.filter((exp) => exp !== 'none');
  if (activeAdventures.length >= 3) {
    tags.push('adventure-seeker');
  } else if (activeAdventures.length >= 1) {
    tags.push('adventure-light');
  } else if (adventureExperiences.includes('none') && adventureExperiences.length === 1) {
    tags.push('relaxation-focused');
  }

  // Companion-based tags
  if (travelCompanions === 'family') {
    tags.push('family-friendly');
  }

  // Pace-based tags
  if (travelPace >= 75) {
    tags.push('active-explorer');
  } else if (travelPace <= 25) {
    tags.push('slow-traveler');
  }

  return tags;
}

/**
 * Check questionnaire completeness and return follow-up question if needed
 */
export function checkCompleteness(
  preferences: TravelPreferences
): { score: number; followUp: string | null } {
  const checks = [
    {
      field: 'interests',
      isEmpty: preferences.interests.length === 0,
      impact: 'critical',
      question: 'What type of experiences interest you most on a trip?',
    },
    {
      field: 'departureCity',
      isEmpty: preferences.departureCity.trim() === '',
      impact: 'high',
      question: 'Where will you be departing from?',
    },
    {
      field: 'travelMonth',
      isEmpty: preferences.travelMonth === '',
      impact: 'medium',
      question: 'When are you planning to travel?',
    },
  ];

  let completedCount = 0;
  let firstMissingQuestion: string | null = null;

  for (const check of checks) {
    if (!check.isEmpty) {
      completedCount++;
    } else if (firstMissingQuestion === null && check.impact !== 'low') {
      firstMissingQuestion = check.question;
    }
  }

  // Calculate completeness score (0-1)
  const totalFields = 9; // Total questionnaire fields
  const filledFields = Object.entries(preferences).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true; // Numbers are always "filled"
  }).length;

  const score = filledFields / totalFields;

  return {
    score,
    followUp: firstMissingQuestion,
  };
}

/**
 * Generate a personalized summary paragraph (under 70 words)
 */
export function generateSummary(profile: Partial<TravelProfile>): string {
  const {
    travelCompanions = 'solo',
    interestScores = {} as InterestScores,
    weatherPreference = 0.5,
    travelMonth = '',
    tripDuration = 7,
    travelPace = 0.5,
    preferredRegions = [],
  } = profile;

  // Get top 2 interests
  const sortedInterests = Object.entries(interestScores)
    .filter(([_, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([interest]) => interest);

  const topInterests =
    sortedInterests.length > 0
      ? sortedInterests.join(' and ')
      : 'diverse experiences';

  // Weather description
  const weatherDesc =
    weatherPreference >= 0.75
      ? 'tropical'
      : weatherPreference >= 0.5
        ? 'warm'
        : weatherPreference >= 0.25
          ? 'mild'
          : 'cool';

  // Month
  const monthLabel = MONTH_LABELS[travelMonth] || 'your chosen dates';

  // Pace description
  const paceDesc =
    travelPace >= 75 ? 'action-packed' : travelPace <= 25 ? 'relaxed' : 'balanced';

  // Companion label
  const companionLabel = COMPANION_LABELS[travelCompanions] || 'trip';

  // Region note
  let regionNote = '';
  if (preferredRegions.length > 0 && !preferredRegions.includes('anywhere')) {
    const regionNames = preferredRegions
      .slice(0, 2)
      .map((r) => REGION_LABELS[r] || r);
    regionNote = ` exploring ${regionNames.join(' and ')}`;
  }

  return `We'll find destinations perfect for a ${companionLabel} focused on ${topInterests}. Looking for ${weatherDesc} weather in ${monthLabel}, with a ${paceDesc} ${tripDuration}-day itinerary${regionNote}.`;
}

/**
 * Map companion string to GroupType
 */
function mapToGroupType(companion: string): GroupType {
  const validTypes: GroupType[] = ['solo', 'couple', 'family', 'friends', 'group'];
  return validTypes.includes(companion as GroupType)
    ? (companion as GroupType)
    : 'solo';
}

/**
 * Build complete travel profile from questionnaire preferences
 */
export function buildTravelProfile(preferences: TravelPreferences): TravelProfile {
  const interestScores = normalizeInterestScores(preferences.interests);
  const adventureLevel = calculateAdventureLevel(preferences.adventureExperiences);
  const styleTags = inferStyleTags(preferences);
  const { score: completenessScore, followUp: followUpQuestion } =
    checkCompleteness(preferences);

  const isFlexibleOnRegion =
    preferences.continentPreference.includes('anywhere') ||
    preferences.continentPreference.length === 0;

  const profile: TravelProfile = {
    interestScores,
    adventureLevel,
    adventureTypes: preferences.adventureExperiences.filter((exp) => exp !== 'none'),
    departureCity: preferences.departureCity,
    travelMonth: preferences.travelMonth,
    preferredRegions: preferences.continentPreference.filter((r) => r !== 'anywhere'),
    isFlexibleOnRegion,
    weatherPreference: preferences.weatherPreference / 100, // Normalize 0-100 to 0-1
    tripDuration: preferences.tripDuration,
    travelPace: preferences.travelPace / 100, // Normalize 0-100 to 0-1
    travelCompanions: preferences.travelCompanions,
    groupType: mapToGroupType(preferences.travelCompanions),
    styleTags,
    summary: '', // Will be set below
    completenessScore,
    followUpQuestion,
  };

  // Generate summary with the profile data
  profile.summary = generateSummary(profile);

  return profile;
}
