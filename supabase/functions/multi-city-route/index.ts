import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      originCity,
      originCountry,
      totalDays,
      travelMonth,
      userInterests,
      adventureTypes,
      tripStyle,
      budgetLevel,
      gatewayCity,
    } = body;

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Nearby city discovery: ${originCity}, ${originCountry}, ${totalDays} days`);

    // ── Step 1: Perplexity nearby city discovery ──
    let nearbyCities: any[] = [];

    if (PERPLEXITY_API_KEY) {
      try {
        const perplexityPrompt = `The user is planning a ${totalDays}-day trip to ${originCity}, ${originCountry} in ${travelMonth}. Their interests are: ${userInterests?.join(", ") || "varied"}.${gatewayCity ? ` They are arriving via ${gatewayCity}.` : ""} Suggest up to 3 nearby cities or destinations that would combine well with ${originCity} for this traveller. For each suggestion return: city name, country, approximate distance in km from ${originCity}, recommended transport method (train/bus/flight/ferry/drive), journey time as a string like "2h 30min", journey time in decimal hours, why it matches this traveller's interests specifically (one sentence), whether it is likely already on their travel path (e.g. a gateway city they pass through), and an interest match score from 0-3 (0=no match, 3=perfect match).

Return ONLY valid JSON array:
[
  {
    "city": "City Name",
    "country": "Country",
    "distanceKm": 180,
    "transportMode": "train",
    "journeyTime": "2h 30min",
    "journeyTimeHours": 2.5,
    "whyItMatches": "One sentence reason",
    "isGatewayCity": false,
    "interestMatchScore": 2
  }
]`;

        const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: "You are a travel expert. Return only valid JSON, no markdown." },
              { role: "user", content: perplexityPrompt },
            ],
            temperature: 0.2,
          }),
        });

        if (perplexityRes.ok) {
          const perplexityData = await perplexityRes.json();
          const content = perplexityData.choices?.[0]?.message?.content;
          if (content) {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              nearbyCities = JSON.parse(jsonMatch[0]);
              console.log(`Perplexity returned ${nearbyCities.length} nearby cities`);
            }
          }
        } else {
          console.warn("Perplexity query failed:", perplexityRes.status);
        }
      } catch (perplexityErr) {
        console.warn("Perplexity discovery failed, falling back to AI:", perplexityErr);
      }
    }

    // ── Fallback: use Lovable AI if Perplexity didn't return results ──
    if (nearbyCities.length === 0) {
      const fallbackPrompt = `You are a travel expert. Suggest up to 3 nearby cities that combine well with ${originCity}, ${originCountry} for a ${totalDays}-day trip in ${travelMonth}. Traveler interests: ${userInterests?.join(", ") || "varied"}.${gatewayCity ? ` They arrive via ${gatewayCity}.` : ""}

Return ONLY valid JSON array:
[
  {
    "city": "City Name",
    "country": "Country",
    "distanceKm": 180,
    "transportMode": "train",
    "journeyTime": "2h 30min",
    "journeyTimeHours": 2.5,
    "whyItMatches": "One sentence reason",
    "isGatewayCity": false,
    "interestMatchScore": 2
  }
]`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: fallbackPrompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            nearbyCities = JSON.parse(jsonMatch[0]);
            console.log(`AI fallback returned ${nearbyCities.length} nearby cities`);
          }
        }
      }
    }

    // ── Step 2: Score and rank ──
    const scored = nearbyCities.map((city: any) => {
      let score = 0;

      // Geographic proximity
      const hours = city.journeyTimeHours || 99;
      if (hours <= 2) score += 3;
      else if (hours <= 4) score += 2;
      else if (hours <= 6) score += 1;

      // Interest match
      score += Math.min(city.interestMatchScore || 0, 3);

      // Gateway bonus
      if (city.isGatewayCity || (gatewayCity && city.city?.toLowerCase() === gatewayCity?.toLowerCase())) {
        score += 3;
      }

      // Calculate suggested days: minimum 2, proportional to remaining
      const mainCityMinDays = Math.max(2, Math.ceil(totalDays * 0.5));
      const availableDays = totalDays - mainCityMinDays;
      const suggestedDays = Math.max(2, Math.min(availableDays, Math.round(totalDays * 0.3)));

      return {
        ...city,
        score,
        suggestedDays,
        // Ensure gateway tag propagates
        isGatewayCity: city.isGatewayCity || (gatewayCity && city.city?.toLowerCase() === gatewayCity?.toLowerCase()) || false,
      };
    });

    // Filter score >= 3, sort descending, take top 2
    const topSuggestions = scored
      .filter((c: any) => c.score >= 3)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 2);

    const mainCityDays = topSuggestions.length > 0
      ? totalDays - topSuggestions.reduce((s: number, c: any) => s + (c.suggestedDays || 2), 0)
      : totalDays;

    console.log(`Returning ${topSuggestions.length} scored suggestions (threshold: score >= 3)`);

    return new Response(
      JSON.stringify({
        suggestions: topSuggestions,
        mainCityDays: Math.max(2, mainCityDays),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in multi-city-route:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
