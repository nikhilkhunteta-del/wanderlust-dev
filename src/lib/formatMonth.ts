const monthMap: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

/**
 * Converts any month representation (e.g. "jun", "June", "april") to title case full name.
 */
export function formatMonthName(month: string): string {
  if (!month) return month;
  const lower = month.toLowerCase().trim();
  // Check abbreviation map
  if (monthMap[lower]) return monthMap[lower];
  // Check if already a full month name (case-insensitive)
  for (const full of Object.values(monthMap)) {
    if (full.toLowerCase() === lower) return full;
  }
  // Fallback: title case whatever was passed
  return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
}
