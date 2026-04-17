import { callClaude, HAIKU } from "./ai.ts";

export async function getIconicLandmark(city: string, country: string): Promise<string | null> {
  try {
    const raw = await callClaude(
      "You are a travel expert. Reply with ONLY the name of the landmark, nothing else. No numbering, no explanation, no quotes.",
      `What is the single most visually iconic, most-photographed landmark or location in ${city}, ${country}? Name one specific real place that Google Maps would recognise.`,
      { model: HAIKU },
    );
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 80) return null;
    return trimmed.replace(/^\d+[\.\)]\s*/, "").replace(/^["']|["']$/g, "").trim();
  } catch {
    return null;
  }
}
