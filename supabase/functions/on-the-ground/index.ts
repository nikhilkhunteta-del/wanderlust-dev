import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Government Advisory Fetchers ---

async function fetchUSAdvisory(country: string): Promise<any> {
  try {
    const res = await fetch("https://cadataapi.state.gov/api/TravelAdvisories");
    if (!res.ok) throw new Error(`US API ${res.status}`);
    const data = await res.json();
    const match = data?.find?.((a: any) =>
      a.country_name?.toLowerCase() === country.toLowerCase() ||
      a.iso_code?.toLowerCase() === country.toLowerCase()
    );
    if (!match) return null;
    return {
      source: "us",
      sourceName: "US State Department",
      level: match.advisory_text || `Level ${match.advisory_level}`,
      levelNumeric: parseInt(match.advisory_level) || 1,
      summary: match.advisory_text || "",
      sourceUrl: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html",
      lastUpdated: match.date_updated || new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.warn("US advisory fetch failed:", e);
    return null;
  }
}

async function fetchUKAdvisory(country: string): Promise<any> {
  try {
    const slug = country.toLowerCase().replace(/\s+/g, "-");
    const res = await fetch(`https://www.gov.uk/api/content/foreign-travel-advice/${slug}`);
    if (!res.ok) throw new Error(`UK API ${res.status}`);
    const data = await res.json();
    const alertStatus = data.details?.alert_status || [];
    const summary = data.details?.summary?.replace(/<[^>]*>/g, "")?.slice(0, 200) || "";
    const level = alertStatus.length > 0 ? alertStatus[0] : "normal";
    const levelMap: Record<string, number> = {
      "avoid_all_travel_to_parts": 3, "avoid_all_but_essential_travel_to_parts": 2,
      "avoid_all_travel_to_whole_country": 4, "avoid_all_but_essential_travel_to_whole_country": 3,
    };
    return {
      source: "uk",
      sourceName: "UK FCDO",
      level: level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      levelNumeric: levelMap[level] || 1,
      summary,
      sourceUrl: `https://www.gov.uk/foreign-travel-advice/${slug}`,
      lastUpdated: data.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.warn("UK advisory fetch failed:", e);
    return null;
  }
}

async function fetchCAAdvisory(country: string): Promise<any> {
  try {
    const res = await fetch("https://data.international.gc.ca/travel-voyage/index-alpha-eng.json");
    if (!res.ok) throw new Error(`CA API ${res.status}`);
    const data = await res.json();
    const items = data?.data || data;
    const match = (Array.isArray(items) ? items : []).find((a: any) =>
      a["country-pays"]?.eng?.toLowerCase() === country.toLowerCase() ||
      a["advisory-text"]?.eng?.toLowerCase()?.includes(country.toLowerCase())
    );
    if (!match) return null;
    const advisoryText = match["advisory-text"]?.eng || match["advisory-conseil"]?.eng || "";
    const levelMap: Record<string, number> = {
      "exercise normal security precautions": 1,
      "exercise a high degree of caution": 2,
      "avoid non-essential travel": 3,
      "avoid all travel": 4,
    };
    const numLevel = Object.entries(levelMap).find(([k]) =>
      advisoryText.toLowerCase().includes(k)
    )?.[1] || 1;
    const slug = country.toLowerCase().replace(/\s+/g, "-");
    return {
      source: "ca",
      sourceName: "Government of Canada",
      level: advisoryText.slice(0, 60),
      levelNumeric: numLevel,
      summary: advisoryText,
      sourceUrl: `https://travel.gc.ca/destinations/${slug}`,
      lastUpdated: match["date-published"]?.["#text"] || new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.warn("CA advisory fetch failed:", e);
    return null;
  }
}

// --- Perplexity Helpers ---

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
  const systemPrompt = `You are a travel disruption analyst. Return ONLY a JSON array of current/recent issues affecting tourists in ${city}, ${country}. Each item: {\"title\":\"...\",\"category\":\"transport|political|security|health|natural|other\",\"status\":\"current|watch|resolved\",\"summary\":\"2 lines max\",\"tourist_impact\":\"high|medium|low\",\"source_name\":\"...\",\"source_url\":\"...\",\"date\":\"YYYY-MM-DD\"}. Only include events from the last 90 days that meaningfully deviate from normal conditions. Exclude generic background noise. If nothing notable, return []. Return ONLY valid JSON array.`;

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

async function fetchVisaInfo(
  perplexityKey: string,
  country: string
): Promise<any> {
  const query = `${country} visa requirements entry rules ${new Date().getFullYear()}`;
  const systemPrompt = `Return ONLY a JSON object about visa/entry requirements for ${country}: {\"passport_validity\":\"e.g. 6 months beyond stay\",\"visa_free_nationalities\":[\"US\",\"UK\",\"EU\",...up to 15 most common],\"evisa_available\":true/false,\"active_restrictions\":null or \"description\",\"source_url\":\"https://...\"}. Be concise. Return ONLY valid JSON.`;

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

// --- AI Synthesis ---

async function synthesize(
  lovableKey: string,
  city: string,
  country: string,
  travelMonth: string,
  advisories: any[],
  disruptions: any[]
): Promise<{ verdict: string; verdictLevel: string; summaryParagraph: string; safetyGuidance: any[] }> {
  const prompt = `Given official advisory data and current news disruptions for ${city}, ${country} for a trip in ${travelMonth}:

OFFICIAL ADVISORIES:
${JSON.stringify(advisories)}

CURRENT DISRUPTIONS:
${JSON.stringify(disruptions)}

Return a JSON object:
{
  "verdict": "Single plain-English sentence. Calm, honest. Do NOT use the word 'precautions'. Example: 'Seville is safe to visit in February — one transport issue worth monitoring.'",
  "verdictLevel": "green" if all advisories <=2 and no high-impact disruptions, "amber" if any advisory is 3 or any high-impact disruption, "red" if any advisory is 4,
  "summaryParagraph": "One paragraph contextualising the situation for a tourist. Do not sensationalise. Do not repeat the verdict. Focus on what this means practically.",
  "safetyGuidance": [
    {"header": "On the Street", "points": ["2-3 points in second person active voice, e.g. 'Watch your bags in crowded areas'"]},
    {"header": "Getting Around", "points": ["2-3 points"]},
    {"header": "Before You Go", "points": ["2-3 points"]}
  ]
}

Guidelines:
- Remove anything generic that applies to every city on earth
- Use second person active voice
- No bureaucratic language
- Tone: calm, well-informed friend
Return ONLY valid JSON.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a travel safety advisor. Write like a calm, well-informed friend — not a government briefing. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limits exceeded, please try again later.");
    if (res.status === 402) throw new Error("Payment required, please add funds to your workspace.");
    throw new Error(`AI Gateway error: ${res.status}`);
  }

  const aiData = await res.json();
  const content = aiData.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    console.log(`Fetching on-the-ground data for ${city}, ${resolvedCountry} in ${travelMonth}`);

    // Fetch all data sources in parallel
    const [usAdvisory, ukAdvisory, caAdvisory, disruptions, visaRaw] = await Promise.all([
      fetchUSAdvisory(resolvedCountry),
      fetchUKAdvisory(resolvedCountry),
      fetchCAAdvisory(resolvedCountry),
      fetchDisruptions(PERPLEXITY_API_KEY, city, resolvedCountry, travelMonth || ""),
      fetchVisaInfo(PERPLEXITY_API_KEY, resolvedCountry),
    ]);

    const advisories = [usAdvisory, ukAdvisory, caAdvisory].filter(Boolean);
    console.log(`Got ${advisories.length} advisories, ${disruptions.length} disruptions`);

    // If no real advisories, create fallback
    if (advisories.length === 0) {
      advisories.push({
        source: "us", sourceName: "US State Department",
        level: "Exercise Normal Precautions", levelNumeric: 1,
        summary: "", sourceUrl: "https://travel.state.gov",
        lastUpdated: new Date().toISOString().split("T")[0],
      });
    }

    // AI synthesis
    const synthesis = await synthesize(LOVABLE_API_KEY, city, resolvedCountry, travelMonth || "", advisories, disruptions);

    // Build emergency contacts
    const emergencyContacts: any[] = [];
    let emergencyNote: string | null = null;

    // For EU/common countries, use unified number
    const euCountries = ["spain", "france", "germany", "italy", "portugal", "greece", "netherlands", "belgium", "austria", "croatia", "czech republic", "denmark", "finland", "sweden", "ireland", "poland", "romania", "hungary", "slovakia", "slovenia", "estonia", "latvia", "lithuania", "luxembourg", "malta", "cyprus", "bulgaria"];
    if (euCountries.includes(resolvedCountry.toLowerCase())) {
      emergencyNote = "All emergency services: 112";
    } else {
      // Let the AI data provide these — but we keep it minimal
      emergencyContacts.push(
        { service: "Emergency", number: "Check local listings" }
      );
    }

    // Format visa info
    const visaInfo = {
      passportValidity: visaRaw.passport_validity || "Check with your embassy",
      visaFreeNationalities: visaRaw.visa_free_nationalities || [],
      eVisaAvailable: visaRaw.evisa_available || false,
      activeRestrictions: visaRaw.active_restrictions || null,
      sourceUrl: visaRaw.source_url || "https://www.iatatravelcentre.com/world.php",
    };

    // Format current issues
    const currentIssues = (disruptions || [])
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

    const result = {
      verdict: synthesis.verdict,
      verdictLevel: synthesis.verdictLevel || "green",
      summaryParagraph: synthesis.summaryParagraph,
      officialAdvisories: advisories,
      currentIssues,
      safetyGuidance: synthesis.safetyGuidance || [],
      visaInfo,
      emergencyContacts,
      emergencyNote,
      sources: ["US State Dept", "UK FCDO", "Government of Canada", "Perplexity News Synthesis"],
      lastUpdated: new Date().toISOString().split("T")[0],
      disclaimer: "This information is AI-synthesised from official sources. Always verify with your government's foreign affairs department before travelling.",
    };

    console.log(`On-the-ground data complete for ${city}: ${result.verdictLevel}, ${currentIssues.length} issues`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in on-the-ground function:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const status = msg.includes("Rate limits") ? 429 : msg.includes("Payment required") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
