import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CityParams {
  city: string;
  country: string;
  rationale?: string;
  userInterests?: string[];
  adventureTypes?: string[];
  travelMonth: string;
  styleTags?: string[];
  travelCompanions?: string;
  groupType?: string;
  departureCity?: string;
  tripDuration?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cities }: { cities: CityParams[] } = await req.json();

    if (!cities?.length) {
      return new Response(
        JSON.stringify({ error: "cities array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fan out: all cities in parallel, all 6 data types per city in parallel
    const results = await Promise.all(
      cities.map(async ({
        city, country, travelMonth,
        rationale, userInterests, adventureTypes, styleTags,
        travelCompanions, groupType, departureCity, tripDuration,
      }) => {
        const [highlightsRes, weatherRes, flightsRes, groundRes, seasonalRes, staysRes] =
          await Promise.allSettled([
            supabase.functions.invoke("city-highlights", {
              body: { city, country, travelMonth, rationale, userInterests, adventureTypes, styleTags, travelCompanions, groupType },
            }),
            supabase.functions.invoke("city-weather", {
              body: { city, country, travelMonth },
            }),
            departureCity
              ? supabase.functions.invoke("flight-insights", {
                  body: { departureCity, destinationCity: city, destinationCountry: country, travelMonth },
                })
              : Promise.resolve({ data: null, error: null }),
            supabase.functions.invoke("on-the-ground", {
              body: { city, country, travelMonth },
            }),
            supabase.functions.invoke("seasonal-highlights", {
              body: { city, country, travelMonth, userInterests, travelCompanions, styleTags },
            }),
            supabase.functions.invoke("stay-insights", {
              body: { city, country, travelMonth, departureCity, travelCompanions, groupType, tripDuration, styleTags, travelPace: 0.5 },
            }),
          ]);

        return {
          city,
          country,
          highlights: highlightsRes.status === "fulfilled" ? highlightsRes.value.data : null,
          weather: weatherRes.status === "fulfilled" ? weatherRes.value.data : null,
          flights: flightsRes.status === "fulfilled" ? flightsRes.value.data : null,
          onTheGround: groundRes.status === "fulfilled" ? groundRes.value.data : null,
          seasonal: seasonalRes.status === "fulfilled" ? seasonalRes.value.data : null,
          stays: staysRes.status === "fulfilled" ? staysRes.value.data : null,
        };
      }),
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("batch-city-data error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
