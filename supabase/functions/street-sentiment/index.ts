import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, country } = await req.json();
    if (!city || !country) {
      return new Response(JSON.stringify({ error: "city and country required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check cache
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("street_sentiment_cache")
      .select("data_json, fetched_at")
      .eq("city", city.toLowerCase())
      .eq("country", country.toLowerCase())
      .gte("fetched_at", cutoff)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached.data_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Perplexity
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Search recent Reddit posts, travel forums (TripAdvisor, Lonely Planet Thorn Tree), and traveller reviews from the last 6 months about visiting ${city}, ${country}. Summarise real traveller sentiment across these 5 categories: Food scene, Accommodation value, Crowds & timing, Safety, and Overall vibe right now. For each category give a one-sentence verdict and a sentiment rating which must be one of: positive, mixed, or negative. Return ONLY valid JSON with no markdown, matching this schema:
{
  "categories": [
    { "name": "Food scene", "verdict": "...", "sentiment": "positive|mixed|negative" },
    { "name": "Accommodation value", "verdict": "...", "sentiment": "positive|mixed|negative" },
    { "name": "Crowds & timing", "verdict": "...", "sentiment": "positive|mixed|negative" },
    { "name": "Safety", "verdict": "...", "sentiment": "positive|mixed|negative" },
    { "name": "Overall vibe right now", "verdict": "...", "sentiment": "positive|mixed|negative" }
  ],
  "sourcesSummary": "Brief note on which forums/threads informed this summary"
}`;

    const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are a travel research assistant. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!perplexityRes.ok) {
      const errText = await perplexityRes.text();
      throw new Error(`Perplexity API error [${perplexityRes.status}]: ${errText}`);
    }

    const perplexityData = await perplexityRes.json();
    const raw = perplexityData.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      throw new Error("Failed to parse Perplexity response as JSON");
    }

    // Attach citations if available
    if (perplexityData.citations) {
      parsed.citations = perplexityData.citations;
    }

    // Upsert cache
    await supabase.from("street_sentiment_cache").upsert(
      {
        city: city.toLowerCase(),
        country: country.toLowerCase(),
        data_json: parsed,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "city,country" }
    );

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("street-sentiment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
