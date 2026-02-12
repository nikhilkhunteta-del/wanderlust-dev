/**
 * Generates a GetYourGuide search URL for a given experience in a city.
 * Uses the public search page — no affiliate ID required.
 */
export function getYourGuideSearchUrl(
  query: string,
  city: string,
  country?: string
): string {
  const searchTerm = `${query} ${city}${country ? ` ${country}` : ""}`;
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(searchTerm)}&lc=en`;
}

/**
 * Determines whether an experience title is likely to have a meaningful
 * guided tour option (e.g. landmarks, museums, food tours — not "relax at hotel").
 */
const SKIP_PATTERNS = /\b(relax|rest|sleep|check.?in|hotel|airport|pack|depart|free time|leisure)\b/i;

export function shouldShowTourLink(title: string): boolean {
  return !SKIP_PATTERNS.test(title);
}
