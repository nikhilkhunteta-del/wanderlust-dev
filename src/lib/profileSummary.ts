import { TravelProfile } from '@/types/travelProfile';

const MONTH_LABELS: Record<string, string> = {
  jan: 'January', feb: 'February', mar: 'March', apr: 'April',
  may: 'May', jun: 'June', jul: 'July', aug: 'August',
  sep: 'September', oct: 'October', nov: 'November', dec: 'December',
};

const COMPANION_LABELS: Record<string, string> = {
  solo: 'solo traveller',
  couple: 'couple',
  family: 'family trip',
  friends: 'group of friends',
  group: 'group traveller',
};

const INTEREST_LABELS: Record<string, string> = {
  'culture-history': 'culture & history',
  'nature-outdoors': 'nature',
  'beach-coastal': 'beaches',
  'food-culinary': 'incredible food',
  'arts-music-nightlife': 'arts & nightlife',
  'active-sport': 'active adventures',
  'shopping-markets': 'markets & shopping',
  'wellness-slow-travel': 'wellness & slow travel',
};

const NOVELTY_LABELS: Record<string, string> = {
  classics: 'the iconic destinations',
  mix: 'a blend of classic and hidden gems',
  'off-beaten-path': 'somewhere most people haven\'t found yet',
  surprise: 'a complete surprise',
};

const DURATION_LABELS: Record<string, string> = {
  '3': 'a quick getaway',
  '5': 'a short escape',
  '7': 'a week-long journey',
  '10': 'an extended adventure',
  '14': 'a deep two-week immersion',
};

export function buildProfileSummary(profile: TravelProfile): string {
  const parts: string[] = [];

  // "An October solo traveller"
  const month = MONTH_LABELS[profile.travelMonth] || '';
  const companion = COMPANION_LABELS[profile.travelCompanions] || 'traveller';
  
  const vowels = 'AEIOU';
  const firstWord = month || companion;
  const article = vowels.includes(firstWord.charAt(0).toUpperCase()) ? 'An' : 'A';
  
  parts.push(`${article} ${month ? month + ' ' : ''}${companion}`);

  // "looking for a week-long journey"
  const durationLabel = DURATION_LABELS[String(profile.tripDuration)];
  if (durationLabel) {
    parts[0] += ` looking for ${durationLabel}`;
  }

  // "who wants culture, incredible food"
  const topInterests = Object.entries(profile.interestScores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0)
    .slice(0, 2)
    .map(([key]) => INTEREST_LABELS[key] || key);

  const wantsParts: string[] = [...topInterests];

  // "a once-in-a-lifetime festival moment"
  if (profile.culturalMoments.length > 0) {
    wantsParts.push('a once-in-a-lifetime cultural moment');
  }

  // "and somewhere most people haven't found yet"
  const novelty = NOVELTY_LABELS[profile.noveltyPreference];
  if (novelty) {
    wantsParts.push(novelty);
  }

  if (wantsParts.length > 0) {
    const last = wantsParts.pop()!;
    const joined = wantsParts.length > 0
      ? `${wantsParts.join(', ')}, and ${last}`
      : last;
    return `${parts[0]} who wants ${joined}.`;
  }

  return `${parts[0]}.`;
}
