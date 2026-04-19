export interface TravelPreferences {
  interests: string[];
  primaryInterest: string;
  culturalMoments: string[];
  adventureExperiences: string[];
  iconicSights: string[];
  foodDepth: string;
  departureCity: string;
  travelMonth: string;
  travelCompanions: string;
  tripDuration: string;
  noveltyPreference: string;
  // Virtual key for combined step — not stored, just used for question routing
  whenAndHowLong?: string;
}

export interface QuestionConfig {
  id: keyof TravelPreferences;
  questionText: string;
  subtitle: string;
  inputType: 'multi-select' | 'single-select' | 'slider' | 'dropdown' | 'text-input';
  options?: { value: string; label: string; icon?: string; group?: string; description?: string }[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    labels: string[];
    unit?: string;
    emotionalLabels?: { range: [number, number]; label: string }[];
    tickMarks?: { value: number; label: string }[];
  };
  placeholder?: string;
  defaultValue: string | string[] | number;
  grouped?: boolean;
}

// Experience category definitions for Q2
export interface ExperienceCategory {
  id: string;
  label: string;
  icon: string;
  triggeredBy: string[];
  experiences: { value: string; label: string; icon: string }[];
}

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  {
    id: 'water-ocean',
    label: 'Water & Ocean',
    icon: '🌊',
    triggeredBy: ['beach-coastal', 'nature-outdoors', 'active-sport'],
    experiences: [
      { value: 'scuba-diving', label: 'Scuba Diving', icon: '🤿' },
      { value: 'snorkelling', label: 'Snorkelling', icon: '🐠' },
      { value: 'surfing', label: 'Surfing', icon: '🏄' },
      { value: 'kayaking', label: 'Kayaking & Paddleboarding', icon: '🛶' },
      { value: 'whale-watching', label: 'Whale Watching', icon: '🐋' },
      { value: 'whale-sharks', label: 'Swimming with Whale Sharks', icon: '🦈' },
      { value: 'river-rafting', label: 'River Rafting', icon: '🚣' },
    ],
  },
  {
    id: 'sky-heights',
    label: 'Sky & Heights',
    icon: '🪂',
    triggeredBy: ['active-sport', 'nature-outdoors'],
    experiences: [
      { value: 'paragliding', label: 'Paragliding', icon: '🪂' },
      { value: 'skydiving', label: 'Skydiving', icon: '🎯' },
      { value: 'bungee-jumping', label: 'Bungee Jumping', icon: '⬇' },
      { value: 'hot-air-balloon', label: 'Hot Air Balloon', icon: '🎈' },
    ],
  },
  {
    id: 'mountain-land',
    label: 'Mountain & Land',
    icon: '🏔',
    triggeredBy: ['active-sport', 'nature-outdoors'],
    experiences: [
      { value: 'hiking-trekking', label: 'Hiking & Trekking', icon: '🥾' },
      { value: 'skiing', label: 'Skiing & Snowboarding', icon: '⛷' },
      { value: 'cycling-routes', label: 'Cycling Routes', icon: '🚴' },
      { value: 'volcano-trekking', label: 'Volcano Trekking', icon: '🌋' },
      { value: 'camping', label: 'Camping & Wild Stays', icon: '⛺' },
    ],
  },
  {
    id: 'wildlife-nature',
    label: 'Wildlife & Nature',
    icon: '🦁',
    triggeredBy: ['nature-outdoors'],
    experiences: [
      { value: 'safari', label: 'Safari', icon: '🦁' },
      { value: 'northern-lights', label: 'Northern Lights', icon: '🌌' },
      { value: 'stargazing', label: 'Stargazing', icon: '⭐' },
      { value: 'reindeer-sledging', label: 'Reindeer Sledging', icon: '🦌' },
      { value: 'dog-sledding', label: 'Dog Sledding', icon: '🐕' },
      { value: 'cave-exploration', label: 'Cave Exploration', icon: '🕳' },
    ],
  },
  {
    id: 'landscapes',
    label: 'Landscapes & Journeys',
    icon: '🏜',
    triggeredBy: ['nature-outdoors', 'culture-history'],
    experiences: [
      { value: 'desert-experience', label: 'Desert Experience', icon: '🏜' },
      { value: 'scenic-train', label: 'Scenic Train Journey', icon: '🚂' },
    ],
  },
  {
    id: 'culture-heritage',
    label: 'Culture & Heritage',
    icon: '🏛',
    triggeredBy: ['culture-history'],
    experiences: [
      { value: 'unesco-sites', label: 'UNESCO Heritage Sites', icon: '🏛' },
      { value: 'museums-galleries', label: 'Museums & Galleries', icon: '🖼' },
      { value: 'cultural-performance', label: 'Cultural Performances', icon: '🎭' },
      { value: 'ancient-ruins', label: 'Ancient Ruins & Archaeology', icon: '🗿' },
    ],
  },
  {
    id: 'food-drink',
    label: 'Food & Drink',
    icon: '🍜',
    triggeredBy: ['food-culinary'],
    experiences: [
      { value: 'street-food-tours', label: 'Street Food Tours', icon: '🍢' },
      { value: 'cooking-classes', label: 'Cooking Classes', icon: '👨‍🍳' },
      { value: 'wine-vineyards', label: 'Wine & Vineyard Tours', icon: '🍷' },
      { value: 'food-markets', label: 'Food Market Exploration', icon: '🥬' },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness & Restoration',
    icon: '🧘',
    triggeredBy: ['wellness-slow-travel'],
    experiences: [
      { value: 'thermal-baths', label: 'Thermal Baths & Hot Springs', icon: '♨️' },
      { value: 'yoga-retreats', label: 'Yoga & Meditation Retreats', icon: '🧘' },
      { value: 'spa-hammam', label: 'Spa & Hammam', icon: '💆' },
    ],
  },
];

/**
 * Get relevant experience categories based on Q1 selections.
 * Returns null if Q2 should be skipped entirely.
 */
export function getRelevantCategories(q1Selections: string[]): ExperienceCategory[] | null {
  // Skip Q2 entirely if only shopping/arts-music-nightlife selected (no categories triggered)
  const relevant = EXPERIENCE_CATEGORIES.filter((cat) =>
    cat.triggeredBy.some((trigger) => q1Selections.includes(trigger))
  );
  return relevant.length > 0 ? relevant : null;
}

export function shouldShowFoodQuestion(q1Selections: string[]): boolean {
  // Food-only Q2 is now handled by the food-drink category in EXPERIENCE_CATEGORIES
  // This is kept for backward compat but no longer used for standalone food question
  return false;
}

// Base questions (excluding dynamic Q2)
export const QUESTIONS: QuestionConfig[] = [
  {
    id: 'interests',
    questionText: 'What kind of traveller are you?',
    subtitle: "We'll use this to shape places you'll truly love.",
    inputType: 'multi-select',
    options: [
      { value: 'culture-history', label: 'Culture & History', icon: '🏛', description: 'Walk through millennia of human story. Ancient ruins, sacred temples, and living heritage that stops you in your tracks.' },
      { value: 'nature-outdoors', label: 'Nature & Outdoors', icon: '🌿', description: 'Stand somewhere so vast and wild it makes you feel small. Forests, mountains, and wilderness on a scale that stays with you.' },
      { value: 'beach-coastal', label: 'Beach & Coastal', icon: '🏖', description: 'That particular shade of turquoise that exists nowhere but the sea. White sand, warm water, and nothing to do but be there.' },
      { value: 'food-culinary', label: 'Food & Culinary', icon: '🍜', description: 'Eat where the locals eat. Street stalls, night markets, and dishes you\'ll spend years trying to recreate at home.' },
      { value: 'arts-music-nightlife', label: 'Arts, Music & Nightlife', icon: '🎭', description: 'The energy of a city after dark. Live music, rooftop bars, and the kind of night that becomes a story.' },
      { value: 'active-sport', label: 'Active & Sport', icon: '🚴', description: 'Push yourself somewhere extraordinary. Hike, raft, climb, or ride through landscapes that make the effort worthwhile.' },
      { value: 'shopping-markets', label: 'Shopping & Markets', icon: '🛍', description: 'Lose yourself in a labyrinth of stalls, scents, and textures. The best souvenirs are the ones you didn\'t plan to buy.' },
      { value: 'wellness-slow-travel', label: 'Wellness & Slow Travel', icon: '🧘', description: 'Breathe out. A slower pace, restorative rituals, and the rare luxury of being fully present somewhere beautiful.' },
    ],
    defaultValue: [],
  },
  // Combined month + duration step
  {
    id: 'whenAndHowLong' as keyof TravelPreferences,
    questionText: 'When and how long?',
    subtitle: 'Timing and length shape everything we recommend.',
    inputType: 'single-select',
    options: [], // handled by custom renderer
    defaultValue: '',
  },
  // adventureExperiences is inserted dynamically after whenAndHowLong
  {
    id: 'departureCity',
    questionText: 'Where will your journey begin?',
    subtitle: "We'll use this to find the best routes and realistic travel times.",
    inputType: 'text-input',
    placeholder: 'e.g., Tokyo, Paris, New York...',
    defaultValue: '',
  },
  {
    id: 'travelCompanions',
    questionText: "Who's joining you?",
    subtitle: 'Your companions shape every recommendation we make.',
    inputType: 'single-select',
    options: [
      { value: 'solo', label: 'Solo Adventure', icon: '🎒', description: 'Just you, total freedom' },
      { value: 'couple', label: 'Romantic Getaway', icon: '💑', description: 'Couples, intimate experiences' },
      { value: 'family', label: 'Family Trip', icon: '👨‍👩‍👧‍👦', description: 'Kids in tow, family-friendly picks' },
      { value: 'friends', label: 'Friends Trip', icon: '👯', description: 'Small group, shared adventures' },
      { value: 'group', label: 'Group Travel', icon: '🚌', description: 'Larger group, 6+ people' },
    ],
    defaultValue: '',
  },
  {
    id: 'noveltyPreference',
    questionText: 'How do you like to discover?',
    subtitle: 'Helps us choose between celebrated classics and hidden gems.',
    inputType: 'single-select',
    options: [
      { value: 'classics', label: 'The classics done well', icon: '🏠', description: 'Iconic destinations, done properly' },
      { value: 'mix', label: 'A mix of known and new', icon: '🗺️', description: 'Some familiar, some surprising' },
      { value: 'off-beaten-path', label: 'Off the beaten path', icon: '🌍', description: 'Somewhere most travellers miss' },
      { value: 'surprise', label: 'Surprise me completely', icon: '🎲', description: 'I trust you entirely' },
    ],
    defaultValue: '',
  },
];

/**
 * Build the dynamic question list based on Q1 selections.
 * Inserts cultural moments Q3 and categorized adventure Q after that.
 */
export function buildDynamicQuestions(interests: string[]): QuestionConfig[] {
  const baseQuestions = [...QUESTIONS];
  let insertIndex = 2; // after interests + travelMonth

  // Insert cultural moments question (Q3) if any moments match
  const culturalQ: QuestionConfig = {
    id: 'culturalMoments',
    questionText: 'Is there a moment you want to be part of?',
    subtitle: 'These are the events people rearrange their lives to attend.',
    inputType: 'multi-select',
    options: [], // handled by custom renderer
    defaultValue: [],
  };
  baseQuestions.splice(insertIndex, 0, culturalQ);
  insertIndex++;

  // Insert adventure experiences question if relevant categories exist
  const categories = getRelevantCategories(interests);
  if (categories && categories.length > 0) {
    const options = categories.flatMap((cat) =>
      cat.experiences.map((exp) => ({ ...exp, group: cat.id }))
    );
    const adventureQ: QuestionConfig = {
      id: 'adventureExperiences',
      questionText: 'The things you keep saying you\'ll do one day.',
      subtitle: 'Pick the experiences that have lived rent-free in your head.',
      inputType: 'multi-select',
      grouped: true,
      options,
      defaultValue: [],
    };
    baseQuestions.splice(insertIndex, 0, adventureQ);
    insertIndex++;
  }

  // Insert iconic sights question (Q5)
  const iconicSightsQ: QuestionConfig = {
    id: 'iconicSights',
    questionText: 'Is there a sight you\u2019d rearrange your life to see?',
    subtitle: "The world\u2019s most extraordinary places, waiting for the right moment.",
    inputType: 'multi-select',
    options: [],
    defaultValue: [],
  };
  baseQuestions.splice(insertIndex, 0, iconicSightsQ);

  return baseQuestions;
}
