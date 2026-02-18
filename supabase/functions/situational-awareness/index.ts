import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function scrapeNewsForLocation(city: string, country: string): Promise<string | null> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not configured, skipping news scrape");
    return null;
  }

  // Search for recent news about the destination using Google News
  const searchQuery = encodeURIComponent(`${city} ${country} travel news safety 2025`);
  const searchUrl = `https://news.google.com/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;
  
  console.log(`Scraping news for: ${city}, ${country}`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.warn(`News scrape failed (${response.status}):`, errorData);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || "";
    
    console.log(`News scrape successful, content length: ${markdown.length} characters`);
    return markdown;
  } catch (error) {
    console.warn("News scrape error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = await req.json();

    if (!city) {
      throw new Error("City is required");
    }

    const resolvedCountry = country || city;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Fetching situational awareness for ${city}, ${resolvedCountry} in ${travelMonth}`);

    // Get current date for context
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    // Try to scrape recent news
    const newsContent = await scrapeNewsForLocation(city, resolvedCountry);
    const hasNewsData = newsContent && newsContent.length > 100;

    // Build the AI prompt
    const prompt = `You are a travel situational awareness analyst. Provide current situational awareness for travelers planning to visit ${city}, ${resolvedCountry} in ${travelMonth || "the coming months"}.

Current date: ${currentMonth} ${currentYear}

${hasNewsData ? `
--- RECENT NEWS DATA START ---
${newsContent}
--- RECENT NEWS DATA END ---

Analyze the news data above for any relevant travel-impacting events.
` : "No real-time news data available. Use your knowledge of typical situations and seasonal patterns for this destination."}

IMPORTANT: Focus ONLY on issues that could realistically affect a tourist's experience during their travel month. 

Categories to monitor:
- Elections and government changes
- Demonstrations, protests, strikes, unrest
- Curfews, states of emergency, security escalations
- Transport strikes or disruptions
- Public holidays affecting services or crowding
- Seasonal weather disruptions (storms, floods, wildfires, extreme heat)
- Pollution spikes
- Health outbreaks or official warnings
- Earthquakes or major natural events

Return a JSON object with this exact structure:
{
  "hasDisruptions": boolean (true if there are noteworthy current or expected issues),
  "statusSummary": "One concise sentence summarizing the situation. Either 'No significant disruptions expected for your visit.' or a brief neutral summary of concerns.",
  "issues": [
    {
      "title": "Clear issue title",
      "category": "political" | "security" | "transport" | "weather" | "health" | "natural" | "holiday" | "other",
      "timeframe": "ongoing" | "expected" | "seasonal",
      "summary": "1-2 line neutral summary of the issue and its relevance to tourists",
      "sourceUrl": "URL to a relevant news source or official page",
      "sourceName": "Name of the source (e.g., Reuters, BBC, Government Travel Advisory)"
    }
  ],
  "seasonalPatterns": [
    {
      "title": "Recurring seasonal event or pattern",
      "description": "Brief explanation of how it may affect travelers in ${travelMonth}"
    }
  ],
  "practicalImpact": "2-3 sentences summarizing possible implications for travelers (delays, crowds, closures, flexibility needed). If no issues, state that travel should be straightforward."
}

Guidelines:
- issues: Include up to 4 most relevant issues. Empty array if none.
- Only include items with clear potential impact on tourists
- Exclude resolved or historical events
- seasonalPatterns: Include 1-3 recurring patterns relevant to ${travelMonth} (monsoon season, holiday periods, peak tourism, etc.)
- Use neutral, factual, calm tone. No alarmist language.
- No speculation or personalized advice
- If scraping real news, cite actual sources. If using general knowledge, use authoritative sources like government travel advisories.

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a travel situational awareness API. Return only valid JSON. Provide factual, neutral information about current events and seasonal patterns that could affect travelers. Never use alarmist language.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const situationalData = JSON.parse(cleanedContent);

    // Add metadata
    situationalData.lastUpdated = new Date().toISOString().split("T")[0];
    situationalData.dataSource = hasNewsData ? "News (real-time)" : "AI-generated";

    console.log(`Generated situational awareness for ${city}, ${resolvedCountry}:`, {
      hasDisruptions: situationalData.hasDisruptions,
      issuesCount: situationalData.issues?.length || 0,
      dataSource: situationalData.dataSource,
    });

    return new Response(JSON.stringify(situationalData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in situational-awareness function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
