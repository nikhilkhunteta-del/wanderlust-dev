import { supabase } from "@/integrations/supabase/client";
import { SituationalAwarenessData, SourceItem } from "@/types/situationalAwareness";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const MONTH_TO_NUMBER: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  flexible: 0,
};

interface GetSituationalAwarenessParams {
  city: string;
  country: string;
  travelMonth: string;
}

async function checkCache(
  city: string,
  country: string,
  month: number,
  year: number
): Promise<SituationalAwarenessData | null> {
  try {
    const { data, error } = await supabase
      .from("situational_cache")
      .select("*")
      .eq("city", city.toLowerCase())
      .eq("country", country.toLowerCase())
      .eq("month", month)
      .eq("year", year)
      .single();

    if (error || !data) return null;

    const fetchedAt = new Date(data.fetched_at).getTime();
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;

    return {
      events: (data.events_json as any) || [],
      sources: (data.sources_json as any) || [],
      overallSeverity: 0,
      statusLabel: "Normal",
      statusSummary: "",
      fetchedAt: data.fetched_at,
      status: (data.status as any) || "ok",
    };
  } catch {
    return null;
  }
}

async function saveCache(
  city: string,
  country: string,
  month: number,
  year: number,
  sources: SourceItem[],
  events: any[],
  status: string
) {
  try {
    await supabase.functions.invoke("situational-cache-write", {
      body: {
        city: city.toLowerCase(),
        country: country.toLowerCase(),
        month,
        year,
        sources_json: sources,
        events_json: events,
        status,
      },
    });
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

export async function getSituationalAwareness({
  city,
  country,
  travelMonth,
}: GetSituationalAwarenessParams): Promise<SituationalAwarenessData> {
  const month = MONTH_TO_NUMBER[travelMonth] || new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  // 1. Check cache
  const cached = await checkCache(city, country, month, year);
  if (cached) {
    console.log("Situational awareness: serving from cache");
    // Re-derive status fields from cached events
    const maxSev = cached.events.reduce((max: number, e: any) => Math.max(max, e.severity || 0), 0);
    cached.overallSeverity = maxSev;
    cached.statusLabel = maxSev >= 4 ? "Disrupted" : maxSev >= 2 ? "Watch" : "Normal";
    cached.statusSummary = cached.events.length > 0
      ? `${cached.events.length} situation${cached.events.length > 1 ? "s" : ""} being monitored`
      : `No verified disruptions found for ${city}.`;
    return cached;
  }

  // 2. Fetch sources (Perplexity primary, Firecrawl backup)
  const { data: searchData, error: searchError } = await supabase.functions.invoke(
    "situational-search",
    { body: { city, country, travelMonth, travelYear: year } }
  );

  if (searchError) {
    console.error("Situational search error:", searchError);
    throw new Error(searchError.message || "Failed to search for situational data");
  }

  const sources: SourceItem[] = searchData?.sources || [];
  const searchStatus = searchData?.status || "ok";

  // 3. Cluster into events
  const { data: eventsData, error: eventsError } = await supabase.functions.invoke(
    "situational-events",
    { body: { sources, city, country, travelMonth } }
  );

  if (eventsError) {
    console.error("Situational events error:", eventsError);
  }

  const events = eventsData?.events || [];
  const overallSeverity = eventsData?.overallSeverity || 0;
  const statusLabel = eventsData?.statusLabel || "Normal";
  const statusSummary = eventsData?.statusSummary || `No verified disruptions found for ${city}.`;

  // 4. Save to cache
  await saveCache(city, country, month, year, sources, events, searchStatus);

  return {
    events,
    sources,
    overallSeverity,
    statusLabel,
    statusSummary,
    fetchedAt: new Date().toISOString(),
    status: searchStatus,
  };
}
