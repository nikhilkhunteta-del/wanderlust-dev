import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callClaude, extractJson, SONNET } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Advisories, visa, safety guidance — changes slowly
const STABLE_TTL_DAYS = 30;
// Disruptions, verdict, forward assessment — needs to stay current
const LIVE_TTL_HOURS = 48;

// --- Helpers ---

function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/['']/g, "").replace(/\s+/g, "-");
}

// --- Government Advisory Fetchers ---

async function fetchUSAdvisory(country: string): Promise<any> {
  try {
    const res = await fetchWithTimeout("https://cadataapi.state.gov/api/TravelAdvisories");
    if (!res.ok) throw new Error(`US API ${res.status}`);
    const raw = await res.json();
    const items = Array.isArray(raw) ? raw : (raw?.data || raw?.advisories || raw?.Data || []);
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("US API returned unexpected shape, keys:", Object.keys(raw || {}));
      throw new Error("Unexpected US API response format");
    }

    const cl = country.toLowerCase();
    const match = items.find((a: any) => {
      const title = (a.Title || a.title || a.country_name || a.country || a.name || "").toLowerCase();
      const titleCountry = title.split(" - ")[0].trim();
      return titleCountry === cl;
    });

    if (!match) {
      console.warn(`US advisory: no match for "${country}" among ${items.length} entries.`);
      return null;
    }

    const title = match.Title || match.title || "";
    const levelMatch = title.match(/Level\s+(\d)/i);
    const level = levelMatch ? parseInt(levelMatch[1]) : 1;
    const levelLabels: Record<number, string> = {
      1: "Exercise Normal Precautions",
      2: "Exercise Increased Caution",
      3: "Reconsider Travel",
      4: "Do Not Travel",
    };
    const slug = toSlug(country);

    return {
      source: "us",
      sourceName: "US State Department",
      level: levelLabels[level] || `Level ${level}`,
      levelNumeric: level,
      summary: (match.Summary || match.summary || levelLabels[level] || "").replace(/<[^>]*>/g, "").slice(0, 200),
      sourceUrl: match.Link || `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${slug}-travel-advisory.html`,
      lastUpdated: (match.Updated || match.Published || match.date_updated || "").split("T")[0] || new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.warn("US advisory fetch failed:", e);
    return null;
  }
}

async function fetchUKAdvisory(country: string): Promise<any> {
  const specialSlugs: Record<string, string> = {
    "united states": "usa",
    "united states of america": "usa",
  };
  const slug = specialSlugs[country.toLowerCase()] || toSlug(country);

  try {
    const res = await fetchWithTimeout(`https://www.gov.uk/api/content/foreign-travel-advice/${slug}`);
    if (!res.ok) throw new Error(`UK API ${res.status} for slug "${slug}"`);
    const data = await res.json();
    const alertStatus = data.details?.alert_status || [];
    const summaryHtml = data.details?.summary || "";
    const summary = summaryHtml.replace(/<[^>]*>/g, "").slice(0, 200);
    const level = Array.isArray(alertStatus) && alertStatus.length > 0 ? alertStatus[0] : "normal";
    const levelMap: Record<string, number> = {
      "avoid_all_travel_to_parts": 3,
      "avoid_all_but_essential_travel_to_parts": 2,
      "avoid_all_travel_to_whole_country": 4,
      "avoid_all_but_essential_travel_to_whole_country": 3,
    };
    const humanLevel = level === "normal" ? "Normal" : level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return {
      source: "uk",
      sourceName: "UK FCDO",
      level: humanLevel,
      levelNumeric: levelMap[level] || 1,
      summary,
      sourceUrl: `https://www.gov.uk/foreign-travel-advice/${slug}`,
      lastUpdated: (data.updated_at || data.public_updated_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.warn("UK advisory fetch failed:", e);
    return null;
  }
}

async function fetchCAAdvisory(country: string): Promise<any> {
  try {
    const res = await fetchWithTimeout("https://data.international.gc.ca/travel-voyage/index-alpha-eng.json");
    if (!res.ok) throw new Error(`CA API ${res.status}`);
    const raw = await res.json();
    let items: any[] = [];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw?.data) {
      if (Array.isArray(raw.data)) {
        items = raw.data;
      } else if (raw.data.entities) {
        items = Object.values(raw.data.entities);
      } else {
        items = Object.values(raw.data);
      }
    }

    const cl = country.toLowerCase();
    const match = items.find((a: any) => {
      const name = (a["country-eng"] || a["country-pays"]?.eng || a.country || a.name || "").toString().toLowerCase();
      return name === cl || name.includes(cl);
    });

    if (!match) {
      console.warn(`CA advisory: no match for "${country}" among ${items.length} entries.`);
      return null;
    }

    const advisoryState = parseInt(match["advisory-state"]) || 1;
    const levelLabels: Record<number, string> = {
      1: "Exercise Normal Security Precautions",
      2: "Exercise a High Degree of Caution",
      3: "Avoid Non-essential Travel",
      4: "Avoid All Travel",
    };

    const slug = toSlug(country);
    return {
      source: "ca",
      sourceName: "Government of Canada",
      level: levelLabels[advisoryState] || `Level ${advisoryState}`,
      levelNumeric: advisoryState,
      summary: levelLabels[advisoryState] || "",
      sourceUrl: `https://travel.gc.ca/destinations/${slug}`,
      lastUpdated: match["date-published"]?.date?.split(" ")[0] || new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.warn("CA advisory fetch failed:", e);
    return null;
  }
}

// --- Perplexity Helper ---

async function queryPerplexity(apiKey: string, query: string, systemPrompt: string): Promise<any> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Perplexity ${res.status}: ${txt}`);
  }
  return res.json();
}

async function fetchDisruptions(
  perplexityKey: string,
  city: string,
  country: string,
  travelMonth: string
): Promise<any[]> {
  const year = new Date().getFullYear();
  const query = `${city} ${country} travel disruptions protests strikes safety ${travelMonth} ${year}`;
  const systemPrompt = `You are a travel disruption analyst. Return ONLY a JSON array of recent news items from the last 90 days about ${city}, ${country} that are directly relevant to tourists — protests, strikes, transport disruptions, natural events, security incidents. For each item return: {"title":"...","category":"transport|political|security|health|natural|other","status":"current|watch|resolved","summary":"2-sentence factual summary of what happened and what the tourist impact is right now","tourist_impact":"high|medium|low","source_name":"...","source_url":"...","date":"YYYY-MM-DD"}. Do not predict future impact. Do not include background country-level risk information — only specific events. Deduplicate events that appear in multiple articles. If nothing notable, return []. Return ONLY valid JSON array.`;

  try {
    const data = await queryPerplexity(perplexityKey, query, systemPrompt);
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Disruptions fetch failed:", e);
    return [];
  }
}

async function fetchVisaInfo(perplexityKey: string, country: string): Promise<any> {
  const query = `${country} visa requirements entry rules passport validity ${new Date().getFullYear()}`;
  const systemPrompt = `Return ONLY a JSON object about visa/entry requirements for ${country}: {"passport_validity_months":6,"passport_validity_text":"6 months beyond departure","visa_free_nationalities":["US","UK","EU",...up to 15 most common],"evisa_available":true/false,"visa_required":false,"evisa_url":null or "https://...","is_schengen":true/false,"entry_framework_note":"contextual note about the country's entry system e.g. Schengen, ASEAN, Mercosur etc.","active_restrictions":null or "description","source_url":"https://..."}. Be concise. Return ONLY valid JSON.`;

  try {
    const data = await queryPerplexity(perplexityKey, query, systemPrompt);
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Visa fetch failed:", e);
    return { passport_validity: "Check with your embassy", visa_free_nationalities: [], evisa_available: false, active_restrictions: null, source_url: "https://www.iatatravelcentre.com/world.php" };
  }
}

async function fetchEmergencyContacts(perplexityKey: string, country: string): Promise<{ contacts: any[]; note: string | null }> {
  const euCountries = ["spain", "france", "germany", "italy", "portugal", "greece", "netherlands", "belgium", "austria", "croatia", "czech republic", "denmark", "finland", "sweden", "ireland", "poland", "romania", "hungary", "slovakia", "slovenia", "estonia", "latvia", "lithuania", "luxembourg", "malta", "cyprus", "bulgaria"];
  const c = country.toLowerCase();

  // Use hardcoded values for well-known countries to avoid a Perplexity call
  if (euCountries.includes(c)) return { contacts: [], note: "All emergency services: 112" };
  if (c === "united kingdom" || c === "uk") return { contacts: [], note: "All emergency services: 999" };
  if (c === "united states" || c === "usa" || c === "us") return { contacts: [], note: "All emergency services: 911" };
  if (c === "canada") return { contacts: [], note: "All emergency services: 911" };
  if (c === "australia") return { contacts: [], note: "All emergency services: 000" };
  if (c === "new zealand") return { contacts: [], note: "All emergency services: 111" };
  if (c === "japan") return { contacts: [{ service: "Police", number: "110" }, { service: "Ambulance/Fire", number: "119" }], note: null };

  try {
    const data = await queryPerplexity(
      perplexityKey,
      `What are the emergency numbers for police, ambulance, and fire in ${country}?`,
      `Return ONLY a JSON object: {"police":"number","ambulance":"number","fire":"number"}. Return ONLY valid JSON.`
    );
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const nums = JSON.parse(cleaned);
    if (nums.police && nums.ambulance && nums.fire) {
      const allSame = nums.police === nums.ambulance && nums.ambulance === nums.fire;
      if (allSame) return { contacts: [], note: `All emergency services: ${nums.police}` };
      return {
        contacts: [
          { service: "Police", number: nums.police },
          { service: "Ambulance", number: nums.ambulance },
          { service: "Fire", number: nums.fire },
        ],
        note: null,
      };
    }
  } catch (e) {
    console.warn("Emergency numbers fetch failed:", e);
  }

  return { contacts: [], note: "Check local emergency numbers before travel" };
}

// --- AI Synthesis (stable part — advisories → safetyGuidance) ---

async function synthesizeStable(
  city: string,
  country: string,
  advisories: any[]
): Promise<any[]> {
  const prompt = `You have official advisory data for ${city}, ${country}.

OFFICIAL ADVISORIES:
${JSON.stringify(advisories)}

Return a JSON object with city-specific safety guidance:
{
  "safetyGuidance": [
    {"header": "On the Street", "points": ["2-3 points in second person active voice, specific to ${city}"]},
    {"header": "Getting Around", "points": ["2-3 points specific to ${city}'s transport"]},
    {"header": "Before You Go", "points": ["2-3 practical preparation points"]}
  ]
}

Guidelines:
- Remove anything generic that applies to every city on earth
- Use second person active voice
- Be specific to ${city}, not just ${country}
- Tone: calm, well-informed friend
Return ONLY valid JSON.`;

  const text = await callClaude("You are a travel safety advisor. Return only valid JSON.", prompt, {
    model: SONNET,
    temperature: 0.3,
  });
  const parsed = extractJson(text) as any;
  return parsed.safetyGuidance || [];
}

// --- AI Synthesis (live part — advisories + disruptions → verdict, verdictLevel, forwardAssessment) ---

async function synthesizeLive(
  city: string,
  country: string,
  travelMonth: string,
  advisories: any[],
  disruptions: any[]
): Promise<{ verdict: string; verdictLevel: string; forwardAssessment: string }> {
  const year = new Date().getFullYear();
  const prompt = `You have official advisory data and recent news disruptions for ${city}, ${country} for a trip in ${travelMonth} ${year}.

OFFICIAL ADVISORIES:
${JSON.stringify(advisories)}

CURRENT DISRUPTIONS (last 90 days):
${JSON.stringify(disruptions)}

Return a JSON object:
{
  "verdict": "2–3 sentences that: (1) give the overall safety picture drawing on all three advisories and reconciling any differences between them honestly, (2) mention any current news events that are relevant to a tourist right now, (3) include a brief honest note on whether any current issues are likely to still be relevant in ${travelMonth}. Be calm, specific to ${city} not just ${country}, and write for someone who is deciding whether to book. Do not use the word 'precautions'. Do not exceed 3 sentences.",
  "verdictLevel": "green" if all advisories <=2 and no high-impact disruptions, "amber" if any advisory is 3 or any high-impact disruption, "red" if any advisory is 4,
  "forwardAssessment": "1–2 sentences about which if any of the recent events are most likely to still affect travel in ${travelMonth}. Be honest about uncertainty — if you cannot assess with confidence, say so briefly. Keep it under 40 words."
}

Guidelines:
- Be specific to ${city}, not generic country-level commentary
- Tone: calm, well-informed friend
Return ONLY valid JSON.`;

  const text = await callClaude(
    "You are a travel safety advisor. Write like a calm, well-informed friend. Return only valid JSON.",
    prompt,
    { model: SONNET, temperature: 0.3 },
  );
  return extractJson(text) as { verdict: string; verdictLevel: string; forwardAssessment: string };
}

// --- Normalise advisory list (ensure all 3 sources present) ---

function normalizeAdvisories(raw: any[], resolvedCountry: string): any[] {
  const advisories = raw.filter(Boolean);
  const sourceDefaults: Record<string, any> = {
    us: { source: "us", sourceName: "US State Department", level: "Unavailable", levelNumeric: 0, summary: "", sourceUrl: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html", lastUpdated: "" },
    uk: { source: "uk", sourceName: "UK FCDO", level: "Unavailable", levelNumeric: 0, summary: "", sourceUrl: `https://www.gov.uk/foreign-travel-advice/${resolvedCountry.toLowerCase().replace(/\s+/g, "-")}`, lastUpdated: "" },
    ca: { source: "ca", sourceName: "Government of Canada", level: "Unavailable", levelNumeric: 0, summary: "", sourceUrl: `https://travel.gc.ca/destinations/${resolvedCountry.toLowerCase().replace(/\s+/g, "-")}`, lastUpdated: "" },
  };
  for (const key of ["us", "uk", "ca"]) {
    if (!advisories.find((a: any) => a.source === key)) {
      advisories.push(sourceDefaults[key]);
    }
  }
  return advisories;
}

// --- Format visa info ---

function formatVisaInfo(visaRaw: any) {
  const months = visaRaw.passport_validity_months || null;
  const passportText = months
    ? `Passport must be valid for at least ${months} months beyond your departure date`
    : visaRaw.passport_validity_text || visaRaw.passport_validity || "Check with your embassy";
  return {
    passportValidity: passportText,
    visaFreeNationalities: visaRaw.visa_free_nationalities || [],
    eVisaAvailable: visaRaw.evisa_available || false,
    visaRequired: visaRaw.visa_required || false,
    eVisaUrl: visaRaw.evisa_url || null,
    isSchengen: visaRaw.is_schengen || false,
    entryFrameworkNote: visaRaw.entry_framework_note || null,
    activeRestrictions: visaRaw.active_restrictions || null,
    sourceUrl: visaRaw.source_url || "https://www.iatatravelcentre.com/world.php",
  };
}

// --- Format disruptions ---

function formatIssues(disruptions: any[]) {
  return (disruptions || [])
    .filter((d: any) => d.status !== "resolved")
    .sort((a: any, b: any) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.tourist_impact] || 2) - (order[b.tourist_impact] || 2);
    })
    .map((d: any) => ({
      title: d.title,
      category: d.category || "other",
      status: d.status || "current",
      summary: d.summary,
      touristImpact: d.tourist_impact || "low",
      sourceName: d.source_name || "News",
      sourceUrl: d.source_url || "",
      date: d.date || new Date().toISOString().split("T")[0],
    }));
}

// --- Main Handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = await req.json();
    if (!city) throw new Error("City is required");

    const resolvedCountry = country || city;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();
    const stableCacheKey = `stable:${city.toLowerCase()}:${resolvedCountry.toLowerCase()}`;
    const liveCacheKey = `live:${city.toLowerCase()}:${resolvedCountry.toLowerCase()}:${(travelMonth || "").toLowerCase()}`;

    // Check both caches in parallel
    const [stableCacheRes, liveCacheRes] = await Promise.all([
      supabase.from("ai_content_cache")
        .select("data_json")
        .eq("function_name", "on-the-ground-stable")
        .eq("cache_key", stableCacheKey)
        .gt("expires_at", now)
        .maybeSingle(),
      supabase.from("ai_content_cache")
        .select("data_json")
        .eq("function_name", "on-the-ground-live")
        .eq("cache_key", liveCacheKey)
        .gt("expires_at", now)
        .maybeSingle(),
    ]);

    let stableData = stableCacheRes.data?.data_json as any;
    let liveData = liveCacheRes.data?.data_json as any;

    const stableHit = !!stableData;
    const liveHit = !!liveData;
    console.log(`Cache: stable=${stableHit ? "HIT" : "MISS"}, live=${liveHit ? "HIT" : "MISS"} for ${city}`);

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    // --- Fetch and cache stable data if needed ---
    if (!stableData) {
      console.log(`Fetching stable data for ${city}, ${resolvedCountry}`);

      const [usAdvisory, ukAdvisory, caAdvisory, visaRaw, emergencyResult] = await Promise.all([
        fetchUSAdvisory(resolvedCountry),
        fetchUKAdvisory(resolvedCountry),
        fetchCAAdvisory(resolvedCountry),
        fetchVisaInfo(PERPLEXITY_API_KEY, resolvedCountry),
        fetchEmergencyContacts(PERPLEXITY_API_KEY, resolvedCountry),
      ]);

      const advisories = normalizeAdvisories([usAdvisory, ukAdvisory, caAdvisory], resolvedCountry);
      console.log(`Got ${advisories.length} advisories`);

      const safetyGuidance = await synthesizeStable(city, resolvedCountry, advisories);

      stableData = {
        officialAdvisories: advisories,
        visaInfo: formatVisaInfo(visaRaw),
        emergencyContacts: emergencyResult.contacts,
        emergencyNote: emergencyResult.note,
        safetyGuidance,
      };

      try {
        const expiresAt = new Date(Date.now() + STABLE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("ai_content_cache").upsert(
          { function_name: "on-the-ground-stable", cache_key: stableCacheKey, data_json: stableData, fetched_at: now, expires_at: expiresAt },
          { onConflict: "function_name,cache_key" }
        );
        console.log(`Stable data cached for ${city}`);
      } catch (cacheErr) {
        console.warn("Failed to cache stable data:", cacheErr);
      }
    }

    // --- Fetch and cache live data if needed ---
    if (!liveData) {
      console.log(`Fetching live data for ${city}, ${resolvedCountry}`);

      const disruptions = await fetchDisruptions(PERPLEXITY_API_KEY, city, resolvedCountry, travelMonth || "");
      console.log(`Got ${disruptions.length} disruptions`);

      const liveSynthesis = await synthesizeLive(
        city,
        resolvedCountry,
        travelMonth || "",
        stableData.officialAdvisories,
        disruptions
      );

      liveData = {
        verdict: liveSynthesis.verdict,
        verdictLevel: liveSynthesis.verdictLevel || "green",
        forwardAssessment: liveSynthesis.forwardAssessment || "",
        currentIssues: formatIssues(disruptions),
      };

      try {
        const expiresAt = new Date(Date.now() + LIVE_TTL_HOURS * 60 * 60 * 1000).toISOString();
        await supabase.from("ai_content_cache").upsert(
          { function_name: "on-the-ground-live", cache_key: liveCacheKey, data_json: liveData, fetched_at: now, expires_at: expiresAt },
          { onConflict: "function_name,cache_key" }
        );
        console.log(`Live data cached for ${city}`);
      } catch (cacheErr) {
        console.warn("Failed to cache live data:", cacheErr);
      }
    }

    // --- Merge and return ---
    const result = {
      verdict: liveData.verdict,
      verdictLevel: liveData.verdictLevel,
      forwardAssessment: liveData.forwardAssessment,
      officialAdvisories: stableData.officialAdvisories,
      currentIssues: liveData.currentIssues,
      safetyGuidance: stableData.safetyGuidance,
      visaInfo: stableData.visaInfo,
      emergencyContacts: stableData.emergencyContacts,
      emergencyNote: stableData.emergencyNote,
      sources: ["US State Dept", "UK FCDO", "Government of Canada", "Perplexity News Synthesis"],
      lastUpdated: new Date().toISOString().split("T")[0],
      disclaimer: "This information is AI-synthesised from official sources. Always verify with your government's foreign affairs department before travelling.",
    };

    console.log(`On-the-ground complete for ${city}: ${result.verdictLevel}, ${result.currentIssues.length} issues`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in on-the-ground:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const status = msg.includes("Rate limits") ? 429 : msg.includes("Payment required") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
