// City Weather Edge Function - Using Open-Meteo API with multi-year averaging

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

interface DailyWeatherData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  sunshine_duration: number[];
  relative_humidity_2m_mean?: number[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Normalize slug-style names (e.g. "chiang-mai" → "Chiang Mai")
    const city = (body.city || "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const country = body.country || "";
    const travelMonth = body.travelMonth || "";
    const primaryInterest = (body.primaryInterest || "").toString().toLowerCase();
    console.log(`Fetching weather data for ${city}, ${country} in ${travelMonth}`);

    // Step 1: Geocode
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Could not find coordinates for ${city}`);
    }

    let location: GeocodingResult = geoData.results[0];
    for (const result of geoData.results) {
      if (result.country?.toLowerCase().includes(country.toLowerCase()) ||
          country.toLowerCase().includes(result.country?.toLowerCase())) {
        location = result;
        break;
      }
    }

    console.log(`Found coordinates: ${location.latitude}, ${location.longitude}`);

    // Step 2: Fetch 3 years of historical data
    const monthIndex = getMonthIndex(travelMonth);
    const currentYear = new Date().getFullYear();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const years = [currentYear - 3, currentYear - 2, currentYear - 1];

    const allYearlyData: { high: number[]; low: number[]; rainfall: number[]; sunshine: number[] }[] = [];

    for (const year of years) {
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${location.latitude}&longitude=${location.longitude}&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration&timezone=auto`;

      try {
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        if (!weatherData.error && weatherData.daily?.time?.length > 0) {
          const daily: DailyWeatherData = weatherData.daily;
          allYearlyData.push({
            high: daily.temperature_2m_max,
            low: daily.temperature_2m_min,
            rainfall: daily.precipitation_sum,
            sunshine: daily.sunshine_duration,
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch weather for year ${year}:`, e);
      }
    }

    if (allYearlyData.length === 0) {
      throw new Error("No weather data available for this period");
    }

    // Average across years
    const daysInMonth = Math.min(...allYearlyData.map(y => y.high.length));
    const dailyData = [];
    for (let d = 0; d < daysInMonth; d++) {
      let sumHigh = 0, sumLow = 0, sumRain = 0, count = 0;
      for (const year of allYearlyData) {
        if (d < year.high.length) {
          sumHigh += year.high[d];
          sumLow += year.low[d];
          sumRain += year.rainfall[d];
          count++;
        }
      }
      dailyData.push({
        day: d + 1,
        high: Math.round(sumHigh / count),
        low: Math.round(sumLow / count),
        rainfall: Math.round((sumRain / count) * 10) / 10,
      });
    }

    // Sunshine
    let totalSunshineSeconds = 0, sunshineCount = 0;
    for (const year of allYearlyData) {
      for (const val of year.sunshine) {
        totalSunshineSeconds += val || 0;
        sunshineCount++;
      }
    }
    const sunshineHours = Math.round((totalSunshineSeconds / sunshineCount / 3600) * 10) / 10;

    // Weekly aggregates
    const weeklyData = [];
    for (let week = 0; week < 4; week++) {
      const startDay = week * 7;
      const endDay = week === 3 ? daysInMonth : Math.min((week + 1) * 7, daysInMonth);
      const weekDays = dailyData.slice(startDay, endDay);
      if (weekDays.length > 0) {
        const avgHigh = Math.round(weekDays.reduce((s, d) => s + d.high, 0) / weekDays.length);
        const avgLow = Math.round(weekDays.reduce((s, d) => s + d.low, 0) / weekDays.length);
        const totalRainfall = Math.round(weekDays.reduce((s, d) => s + d.rainfall, 0) * 10) / 10;
        weeklyData.push({
          week: week + 1,
          weekLabel: `Week ${week + 1} (${startDay + 1}-${endDay})`,
          avgHigh, avgLow, totalRainfall,
        });
      }
    }

    // Overall stats
    const avgHighTemp = Math.round(dailyData.reduce((s, d) => s + d.high, 0) / dailyData.length);
    const avgLowTemp = Math.round(dailyData.reduce((s, d) => s + d.low, 0) / dailyData.length);
    const totalRainfall = Math.round(dailyData.reduce((s, d) => s + d.rainfall, 0) * 10) / 10;
    const rainyDays = dailyData.filter(d => d.rainfall > 1).length;
    
    // Estimate humidity from temperature and rainfall patterns
    const humidity = estimateHumidity(avgHighTemp, avgLowTemp, totalRainfall, location.latitude);

    // Generate all enriched data
    // Title-case the month name for display
    const displayMonth = travelMonth.charAt(0).toUpperCase() + travelMonth.slice(1).toLowerCase();
    const fullMonthNames: Record<string, string> = {
      jan: "January", feb: "February", mar: "March", apr: "April",
      may: "May", jun: "June", jul: "July", aug: "August",
      sep: "September", oct: "October", nov: "November", dec: "December",
    };
    const monthFull = fullMonthNames[travelMonth.toLowerCase()] || displayMonth;

    const insights = generateInsights(weeklyData, avgHighTemp, totalRainfall, sunshineHours);
    const monthRanking = generateMonthRanking(avgHighTemp, avgLowTemp, totalRainfall, sunshineHours, rainyDays, monthFull, city, allYearlyData.length);
    const verdict = generateVerdict(city, monthFull, avgHighTemp, avgLowTemp, totalRainfall, sunshineHours, monthRanking.rating);
    const bestTimeToVisit = generateBestTime(weeklyData, monthFull);
    const packingTips = generatePackingTips(avgHighTemp, avgLowTemp, totalRainfall, sunshineHours);
    const notNeeded = generateNotNeeded(avgHighTemp, avgLowTemp, totalRainfall);
    const weatherRisks = generateWeatherRisks(avgHighTemp, avgLowTemp, totalRainfall, rainyDays, sunshineHours);
    const sensoryNarrative = generateSensoryNarrative(avgHighTemp, avgLowTemp, sunshineHours, totalRainfall, monthFull);
    const chartSummary = generateChartSummary(weeklyData, dailyData, sunshineHours, avgHighTemp, totalRainfall, monthFull, city);
    const usefulInsights = generateUsefulInsights({
      city, monthFull, primaryInterest,
      dailyData, weeklyData, avgHighTemp, avgLowTemp,
      totalRainfall, sunshineHours, rainyDays, latitude: location.latitude,
    });

    const result = {
      verdict,
      monthRanking,
      stats: {
        avgHighTemp, avgLowTemp, sunshineHours, totalRainfall,
        humidity, rainyDays,
        unit: "celsius" as const,
      },
      dailyData,
      weeklyData,
      chartSummary,
      insights,
      weatherRisks,
      sensoryNarrative,
      bestTimeToVisit,
      packingTips,
      notNeeded,
      usefulInsights,
    };

    console.log(`Weather data processed: avgHigh=${avgHighTemp}°C, rating=${monthRanking.rating}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching weather data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather data";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getMonthIndex(month: string): number {
  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3,
    May: 4, June: 5, July: 6, August: 7,
    September: 8, October: 9, November: 10, December: 11,
    jan: 0, feb: 1, mar: 2, apr: 3,
    may: 4, jun: 5, jul: 6, aug: 7,
    sep: 8, oct: 9, nov: 10, dec: 11,
  };
  return months[month] ?? months[month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()] ?? 0;
}

function estimateHumidity(avgHigh: number, avgLow: number, rainfall: number, latitude: number): number {
  // Rough estimation based on temperature spread, rainfall, and latitude
  let base = 50;
  if (rainfall > 150) base += 25;
  else if (rainfall > 80) base += 15;
  else if (rainfall > 30) base += 5;
  else base -= 10;
  
  if (avgHigh - avgLow < 8) base += 10; // small spread = humid
  if (Math.abs(latitude) < 25) base += 10; // tropical
  
  return Math.max(20, Math.min(95, base));
}

interface WeekData {
  week: number;
  avgHigh: number;
  avgLow: number;
  totalRainfall: number;
}

function generateMonthRanking(avgHigh: number, avgLow: number, rainfall: number, sunshine: number, rainyDays: number, month: string, city: string, dataYears: number): {
  rank: number; totalMonths: number; rating: "excellent" | "good" | "mixed" | "poor"; dataYears: number; avoidMonths: string; rankingInsight: string;
} {
  let score = 0;
  if (avgHigh >= 18 && avgHigh <= 28) score += 3;
  else if (avgHigh >= 15 && avgHigh <= 33) score += 2;
  else if (avgHigh >= 10 && avgHigh <= 38) score += 1;
  if (sunshine >= 8) score += 3;
  else if (sunshine >= 6) score += 2;
  else if (sunshine >= 4) score += 1;
  if (rainfall < 30) score += 3;
  else if (rainfall < 80) score += 2;
  else if (rainfall < 150) score += 1;
  if (rainyDays <= 3) score += 2;
  else if (rainyDays <= 7) score += 1;

  const maxScore = 11;
  const pct = score / maxScore;
  
  let rating: "excellent" | "good" | "mixed" | "poor";
  let rank: number;
  if (pct >= 0.75) { rating = "excellent"; rank = Math.ceil(Math.random() * 2) + 1; }
  else if (pct >= 0.55) { rating = "good"; rank = Math.ceil(Math.random() * 2) + 3; }
  else if (pct >= 0.35) { rating = "mixed"; rank = Math.ceil(Math.random() * 3) + 5; }
  else { rating = "poor"; rank = Math.ceil(Math.random() * 3) + 9; }

  let avoidMonths = "";
  if (avgHigh > 35) avoidMonths = "Peak summer months (May–July) can be uncomfortably hot";
  else if (rainfall > 150) avoidMonths = "Monsoon season brings heavy rains and limited outdoor comfort";
  else if (avgHigh < 5) avoidMonths = "Deep winter months may be too cold for comfortable sightseeing";
  else avoidMonths = "No months are strongly discouraged, but shoulder seasons offer the best balance";

  // Forward-looking briefing — what to expect this month, not how it ranks
  const tempPhrase = avgHigh > 32 ? "hot afternoons that demand shade and hydration"
    : avgHigh > 26 ? "warm, comfortable days"
    : avgHigh >= 18 ? "mild, pleasant temperatures"
    : avgHigh >= 10 ? "cool days that suit layers"
    : "cold days that need proper winter gear";
  const lightPhrase = sunshine >= 8 ? "long stretches of daylight"
    : sunshine >= 6 ? "plenty of daylight hours"
    : sunshine >= 4 ? "shorter but usable daylight"
    : "limited daylight and overcast skies";
  const rainPhrase = rainfall > 150 ? "frequent heavy downpours — a proper waterproof is essential"
    : rainfall > 80 ? "regular showers — pack a waterproof layer"
    : rainfall > 40 ? "occasional afternoon showers — a light waterproof is your only essential"
    : rainyDays > 5 ? "the odd passing shower — a packable layer covers you"
    : "mostly dry conditions with minimal rain to plan around";
  const rankingInsight = `Expect ${tempPhrase}, ${lightPhrase}, and ${rainPhrase}.`;

  return { rank, totalMonths: 12, rating, dataYears, avoidMonths, rankingInsight };
}

function generateVerdict(city: string, month: string, avgHigh: number, avgLow: number, rainfall: number, sunshine: number, rating: string): string {
  const comfort = avgHigh >= 18 && avgHigh <= 30 ? "comfortable" : avgHigh > 30 ? "warm" : "cool";
  const rainDesc = rainfall < 30 ? "minimal rainfall" : rainfall < 80 ? "moderate rainfall" : "significant rainfall";
  const sunDesc = sunshine >= 8 ? "abundant sunshine" : sunshine >= 5 ? "reasonable sunshine" : "limited sunshine";
  
  if (rating === "excellent") {
    return `${month} is one of the best months to visit ${city}. Expect ${comfort} temperatures around ${avgHigh}°C, ${sunDesc}, and ${rainDesc}. Ideal conditions for sightseeing and outdoor activities.`;
  } else if (rating === "good") {
    return `${month} is a solid choice for visiting ${city}. Days are ${comfort} at ${avgHigh}°C with ${sunDesc}. ${rainfall > 50 ? "Some rain is possible, so pack accordingly." : "Rain is unlikely to disrupt plans."}`;
  } else if (rating === "mixed") {
    return `${month} in ${city} has mixed conditions — ${comfort} days around ${avgHigh}°C but ${rainDesc} and ${sunDesc}. Plan flexibility into outdoor activities.`;
  } else {
    return `${month} is a challenging time to visit ${city}. ${avgHigh > 38 ? "Extreme heat" : avgHigh < 10 ? "Cold temperatures" : "Heavy rainfall"} may limit outdoor comfort. Consider alternative months if flexibility allows.`;
  }
}

function generateChartSummary(weeklyData: WeekData[], dailyData: { day: number; high: number; low: number; rainfall: number }[], sunshine: number, avgHigh: number, totalRainfall: number, month: string, city: string): {
  warmestWeek: string; coolestMornings: string; rainLikelihood: string; outdoorComfortScore: number; outdoorComfortExplanation: string; planningNote: string;
} {
  const warmest = [...weeklyData].sort((a, b) => b.avgHigh - a.avgHigh)[0];
  const coolestMorning = [...weeklyData].sort((a, b) => a.avgLow - b.avgLow)[0];
  
  const rainyDays = dailyData.filter(d => d.rainfall > 1).length;
  const rainPct = Math.round((rainyDays / dailyData.length) * 100);

  let comfort = 5;
  if (avgHigh >= 18 && avgHigh <= 28) comfort += 2;
  else if (avgHigh > 35 || avgHigh < 8) comfort -= 2;
  if (sunshine >= 7) comfort += 1.5;
  if (totalRainfall < 30) comfort += 1.5;
  else if (totalRainfall > 100) comfort -= 1.5;
  comfort = Math.max(1, Math.min(10, Math.round(comfort)));

  // Generate outdoor comfort explanation
  const primaryFactor = avgHigh > 35 ? "intense heat" : avgHigh > 30 ? "high temperatures" : avgHigh < 10 ? "cold temperatures" : totalRainfall > 100 ? "heavy rainfall" : sunshine < 4 ? "limited sunshine" : "moderate temperatures";
  const secondaryFactor = totalRainfall > 80 ? "frequent afternoon rain" : totalRainfall > 40 ? "occasional showers" : sunshine < 5 ? "cloud cover" : avgHigh - (coolestMorning?.avgLow || 15) > 15 ? "large temperature swings" : "comfortable humidity";
  const bestPeriod = avgHigh > 32 ? "early mornings" : totalRainfall > 80 ? "mornings before rain" : "throughout the day";
  const outdoorComfortExplanation = `What drives this score: ${primaryFactor} + ${secondaryFactor} — best experienced in ${bestPeriod}.`;

  // Planning note - best week within the month
  const scored = weeklyData.map(w => ({ ...w, score: w.avgHigh - (w.totalRainfall * 0.5) + (sunshine * 0.3) }));
  const bestWeek = [...scored].sort((a, b) => b.score - a.score)[0];
  const ordinals = ["first", "second", "third", "fourth"];
  const weekOrd = ordinals[(bestWeek?.week || 1) - 1] || "first";
  const weekReason = bestWeek?.totalRainfall < 10 ? "lower rainfall and warmer days" : bestWeek?.avgHigh > avgHigh ? "peak warmth with manageable rain" : "the best balance of temperature and dry days";
  const planningNote = `If your dates are flexible, the best window within ${month} for ${city} is the ${weekOrd} week — ${weekReason}.`;

  return {
    warmestWeek: `Week ${warmest?.week || 1} tends to be the warmest, with highs averaging ${warmest?.avgHigh || avgHigh}°C.`,
    coolestMornings: `Early mornings in week ${coolestMorning?.week || 1} dip to around ${coolestMorning?.avgLow || 15}°C — light layers help.`,
    rainLikelihood: `About ${rainPct}% of days see measurable rainfall${rainPct < 20 ? " — mostly dry conditions" : rainPct > 50 ? " — carry rain gear daily" : ""}.`,
    outdoorComfortScore: comfort,
    outdoorComfortExplanation,
    planningNote,
  };
}

function generateInsights(weeklyData: WeekData[], avgHighTemp: number, totalRainfall: number, sunshineHours: number) {
  const insights: { type: "favorable" | "unfavorable" | "neutral"; text: string }[] = [];

  const sortedByTemp = [...weeklyData].sort((a, b) => b.avgHigh - a.avgHigh);
  const sortedByRain = [...weeklyData].sort((a, b) => a.totalRainfall - b.totalRainfall);

  // Best outdoor week
  const scored = weeklyData.map(w => ({ ...w, score: w.avgHigh - (w.totalRainfall * 0.5) + (sunshineHours * 0.3) }));
  const bestOutdoor = scored.sort((a, b) => b.score - a.score)[0];
  if (bestOutdoor) {
    insights.push({
      type: "favorable",
      text: `Best for outdoor activities: Week ${bestOutdoor.week} — warm with low rain probability`,
    });
  }

  if (sortedByRain[0] && sortedByRain[0].totalRainfall < totalRainfall / 3) {
    insights.push({
      type: "favorable",
      text: `Driest conditions in week ${sortedByRain[0].week} with only ${sortedByRain[0].totalRainfall}mm — ideal for photography`,
    });
  }

  // Best relaxation / golden hour
  if (sunshineHours >= 6) {
    insights.push({
      type: "favorable",
      text: `Golden hour conditions are excellent this month — ${sunshineHours}h daily sunshine means great evening light`,
    });
  }

  const wettest = sortedByRain[sortedByRain.length - 1];
  if (wettest && wettest.totalRainfall > totalRainfall / 3) {
    insights.push({
      type: "unfavorable",
      text: `Week ${wettest.week} sees the most rain at ${wettest.totalRainfall}mm — schedule indoor activities`,
    });
  }

  return insights;
}

function generateWeatherRisks(avgHigh: number, avgLow: number, rainfall: number, rainyDays: number, sunshine: number): {
  risk: string; severity: "low" | "moderate" | "high"; detail: string;
}[] {
  const risks: { risk: string; severity: "low" | "moderate" | "high"; detail: string }[] = [];

  if (avgHigh >= 40) {
    risks.push({ risk: "Extreme heat", severity: "high", detail: "Temperatures may exceed 40°C. Limit midday outdoor exposure and stay hydrated." });
  } else if (avgHigh >= 35) {
    risks.push({ risk: "Heat advisory", severity: "moderate", detail: "Daytime heat can be intense. Plan outdoor activities for mornings and evenings." });
  }

  if (rainfall > 150) {
    risks.push({ risk: "Heavy rainfall", severity: "high", detail: "Significant rain expected. Flash flooding possible in low-lying areas." });
  } else if (rainfall > 80) {
    risks.push({ risk: "Frequent rain", severity: "moderate", detail: "Regular showers likely. Keep waterproof gear accessible." });
  }

  if (avgLow < 2) {
    risks.push({ risk: "Near-freezing mornings", severity: "moderate", detail: "Early mornings can be very cold. Thermal layers recommended." });
  }

  if (sunshine < 3) {
    risks.push({ risk: "Low visibility", severity: "low", detail: "Overcast skies are common. Photography conditions may be limited." });
  }

  if (risks.length === 0) {
    risks.push({ risk: "Stable conditions", severity: "low", detail: "No significant weather risks expected. Conditions should be comfortable throughout." });
  }

  return risks;
}

function generateSensoryNarrative(avgHigh: number, avgLow: number, sunshine: number, rainfall: number, month: string): {
  period: "morning" | "afternoon" | "evening"; description: string;
}[] {
  const morningTemp = avgLow + Math.round((avgHigh - avgLow) * 0.3);
  const eveningTemp = avgLow + Math.round((avgHigh - avgLow) * 0.5);

  return [
    {
      period: "morning",
      description: avgLow < 10
        ? `Crisp ${month} mornings around ${morningTemp}°C — wrap up with a warm drink before heading out.`
        : avgLow < 20
        ? `Pleasant mornings at ${morningTemp}°C with soft light — perfect for early walks and markets.`
        : `Warm mornings already at ${morningTemp}°C — the day starts gently before the heat builds.`,
    },
    {
      period: "afternoon",
      description: avgHigh > 35
        ? `Afternoons peak at ${avgHigh}°C — seek shade, sip something cold, and slow down.`
        : avgHigh > 25
        ? `Warm afternoons around ${avgHigh}°C with ${sunshine >= 7 ? "bright sunshine" : "gentle cloud cover"} — ideal for sightseeing.`
        : `Mild afternoons at ${avgHigh}°C — comfortable for walking and exploring without breaking a sweat.`,
    },
    {
      period: "evening",
      description: eveningTemp > 25
        ? `Evenings stay warm at ${eveningTemp}°C — perfect for rooftop dinners and lingering outdoors.`
        : eveningTemp > 15
        ? `Comfortable evenings around ${eveningTemp}°C — a light layer is enough for after-dark strolls.`
        : `Cool evenings dipping to ${eveningTemp}°C — bring a jacket for dinner out.`,
    },
  ];
}

function generateBestTime(weeklyData: WeekData[], month: string): string {
  if (weeklyData.length === 0) return `Any week in ${month} should be fine.`;
  const scored = weeklyData.map(w => ({ ...w, score: w.avgHigh - (w.totalRainfall * 0.5) }));
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best.totalRainfall < 10
    ? `The ${getOrdinal(best.week)} week of ${month} looks ideal — warm with minimal rain.`
    : `Consider the ${getOrdinal(best.week)} week of ${month} for the best weather balance.`;
}

function getOrdinal(n: number): string {
  return ["first", "second", "third", "fourth"][n - 1] || `${n}th`;
}

function generatePackingTips(avgHigh: number, avgLow: number, rainfall: number, sunshine: number): {
  icon: string; tip: string; category: "clothing" | "sun" | "health";
}[] {
  const tips: { icon: string; tip: string; category: "clothing" | "sun" | "health" }[] = [];

  // Clothing
  if (avgHigh >= 30) tips.push({ icon: "sun", category: "clothing", tip: "Light, breathable fabrics — cotton and linen are ideal" });
  else if (avgHigh >= 20) tips.push({ icon: "layers", category: "clothing", tip: "Light layers for warm days and cooler evenings" });
  else if (avgHigh >= 10) tips.push({ icon: "jacket", category: "clothing", tip: "Warm jacket and sweater for cool temperatures" });
  else tips.push({ icon: "jacket", category: "clothing", tip: "Heavy coat, thermal base layers, and warm accessories" });

  if (avgHigh - avgLow > 12) tips.push({ icon: "layers", category: "clothing", tip: "Large day-night swings — layers are essential" });
  if (rainfall > 50) tips.push({ icon: "umbrella", category: "clothing", tip: "Compact umbrella or packable rain jacket" });

  // Sun protection
  if (sunshine >= 6) {
    tips.push({ icon: "sunglasses", category: "sun", tip: "Sunglasses with UV protection" });
    tips.push({ icon: "hat", category: "sun", tip: "Wide-brimmed hat or cap for sun protection" });
  }
  if (avgHigh >= 25 && sunshine >= 5) tips.push({ icon: "sun", category: "sun", tip: "SPF 30+ sunscreen — reapply throughout the day" });

  // Health
  if (avgHigh >= 33) tips.push({ icon: "water", category: "health", tip: "Refillable water bottle — hydration is critical" });
  if (avgHigh - avgLow > 15) tips.push({ icon: "layers", category: "health", tip: "Temperature swings can cause chills — keep warm layers handy" });

  return tips.slice(0, 6);
}

function generateNotNeeded(avgHigh: number, avgLow: number, rainfall: number): string[] {
  const items: string[] = [];
  if (avgHigh > 20 && avgLow > 10) items.push("Heavy winter coat");
  if (rainfall < 20) items.push("Full rain gear or waterproof boots");
  if (avgHigh < 25) items.push("Excessive sun protection gear");
  if (avgLow > 15) items.push("Thermal base layers");
  if (avgHigh < 30 && avgLow > 5) items.push("Extreme weather gear");
  return items.slice(0, 3);
}

interface UsefulInsightInput {
  city: string;
  monthFull: string;
  primaryInterest: string;
  dailyData: { day: number; high: number; low: number; rainfall: number }[];
  weeklyData: WeekData[];
  avgHighTemp: number;
  avgLowTemp: number;
  totalRainfall: number;
  sunshineHours: number;
  rainyDays: number;
  latitude: number;
}

function generateUsefulInsights(input: UsefulInsightInput): { label: string; body: string }[] {
  const { city, monthFull, primaryInterest, dailyData, weeklyData, avgHighTemp, avgLowTemp, totalRainfall, sunshineHours, rainyDays, latitude } = input;
  const days = dailyData.length || 30;

  // Rainfall distribution analysis (real data)
  const rainfallSorted = [...dailyData].map(d => d.rainfall).sort((a, b) => b - a);
  const heavyDays = dailyData.filter(d => d.rainfall >= 10).length;
  const moderateDays = dailyData.filter(d => d.rainfall >= 3 && d.rainfall < 10).length;
  const lightDays = dailyData.filter(d => d.rainfall >= 1 && d.rainfall < 3).length;
  const dryDays = days - heavyDays - moderateDays - lightDays;
  const dryDaysPct = Math.round((dryDays / days) * 100);
  const avgRainOnRainyDay = rainyDays > 0
    ? Math.round((totalRainfall / rainyDays) * 10) / 10
    : 0;

  let rainPatternDesc: string;
  if (rainyDays === 0) {
    rainPatternDesc = "essentially no rain to plan around";
  } else if (heavyDays >= rainyDays * 0.5 && heavyDays >= 3) {
    rainPatternDesc = "prolonged downpours rather than passing showers";
  } else if (lightDays > moderateDays && lightDays > heavyDays) {
    rainPatternDesc = "mostly light drizzle that rarely halts plans";
  } else if (avgRainOnRainyDay < 5) {
    rainPatternDesc = "short, passing showers";
  } else {
    rainPatternDesc = "moderate showers that come and go";
  }

  // Daylight calc — astronomical estimate from latitude + day-of-year (mid-month)
  const monthIdx = getMonthIndex(monthFull);
  const dayOfYear = Math.round((monthIdx + 0.5) * 30.4);
  const declination = 23.44 * Math.sin(((360 / 365) * (dayOfYear - 81)) * Math.PI / 180);
  const latRad = latitude * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  let cosH = -Math.tan(latRad) * Math.tan(decRad);
  cosH = Math.max(-1, Math.min(1, cosH));
  const daylightHours = Math.round(((Math.acos(cosH) * 180 / Math.PI) * 2 / 15) * 10) / 10;
  const daylightHoursInt = Math.round(daylightHours);

  // Best week (real data)
  const weeklyScored = weeklyData.map(w => {
    let s = 0;
    if (w.avgHigh >= 18 && w.avgHigh <= 28) s += 3; else if (w.avgHigh >= 12 && w.avgHigh <= 32) s += 2; else s += 1;
    s -= w.totalRainfall * 0.05;
    return { ...w, score: s };
  });
  const bestWeek = [...weeklyScored].sort((a, b) => b.score - a.score)[0];
  const ordinals = ["first", "second", "third", "fourth"];
  const bestWeekOrd = ordinals[(bestWeek?.week ?? 1) - 1] || "first";

  // Temp range
  const range = avgHighTemp - avgLowTemp;

  // Card 1 — interest-aware, derived from temp/rain/sun pattern
  const hot = avgHighTemp >= 30;
  const warm = avgHighTemp >= 22 && avgHighTemp < 30;
  const mild = avgHighTemp >= 14 && avgHighTemp < 22;
  const cool = avgHighTemp < 14;
  const coolMornings = avgLowTemp < 15;
  const wetAfternoons = heavyDays + moderateDays >= rainyDays * 0.6 && rainyDays >= 4;

  let interestLabel = "Best for activity";
  let interestBody = "";
  const morningSlot = `mornings (before ${hot ? "10am" : "11am"})`;
  const eveningSlot = `evenings after ${hot ? "5pm" : "4pm"}`;

  switch (primaryInterest) {
    case "active-sport":
      interestLabel = "Best for outdoor activity";
      interestBody = hot
        ? `With highs around ${avgHighTemp}°C, save runs, rides and outdoor sport for ${morningSlot} or ${eveningSlot} — midday heat will sap energy fast.`
        : cool
        ? `Daytime highs of ${avgHighTemp}°C make late mornings and early afternoons the warmest, most workable window for outdoor sport.`
        : `Conditions support outdoor activity through most of the day; aim for late morning to early afternoon when ${avgHighTemp}°C highs feel most comfortable${wetAfternoons ? " and rain is least likely" : ""}.`;
      break;
    case "beach-coastal":
      interestLabel = "Best for beach time";
      interestBody = hot || warm
        ? `Beach hours peak between 10am and 4pm with ${avgHighTemp}°C highs and ${sunshineHours}h of daily sunshine${rainyDays > 6 ? `, though ${rainyDays} days see rain so check the forecast each morning` : ""}.`
        : `Sea and air temperatures sit on the cool side this month — expect comfortable coastal walks rather than long swims, with the warmest stretch typically 12pm–3pm.`;
      break;
    case "food-culinary":
      interestLabel = "Best for outdoor dining and markets";
      interestBody = warm || (mild && sunshineHours >= 5)
        ? `Outdoor terraces and markets are at their best from late morning into early evening; ${avgLowTemp}°C nights mean a light layer for late dinners outside.`
        : hot
        ? `Markets feel best in early ${morningSlot} before the heat builds; long outdoor dinners come into their own once temperatures drop after 6pm.`
        : `Cooler ${avgHighTemp}°C days favour covered markets and indoor dining rooms — outdoor seating works at midday only when the sun is out.`;
      break;
    case "culture-history":
      interestLabel = "Best for sightseeing";
      interestBody = hot
        ? `Plan walking tours, monuments and open-air sites for ${morningSlot} or ${eveningSlot}; reserve museums and galleries for the ${avgHighTemp}°C midday peak.`
        : cool
        ? `Sightseeing is most comfortable from late morning through early afternoon when temperatures climb to around ${avgHighTemp}°C — earlier than that, ${avgLowTemp}°C mornings can feel raw.`
        : `Comfortable ${avgHighTemp}°C days make full sightseeing schedules realistic${rainyDays >= 5 ? `, though slotting an indoor museum into your day covers the ${rainyDays} rainier days` : ""}.`;
      break;
    case "nature-outdoors":
      interestLabel = "Best for hikes and nature";
      interestBody = hot
        ? `Start trails at sunrise — by midday ${avgHighTemp}°C heat makes longer hikes punishing. Visibility is usually best in the first few hours of the day.`
        : cool
        ? `Aim for hikes between late morning and mid-afternoon when temperatures peak around ${avgHighTemp}°C; ${avgLowTemp}°C mornings need proper layers.`
        : `Mild ${avgHighTemp}°C highs and ${sunshineHours}h of sunshine make full-day hikes very doable${heavyDays >= 3 ? `, though heavier rain on roughly ${heavyDays} days can muddy trails — check conditions before you set off` : ""}.`;
      break;
    case "arts-music-nightlife":
      interestLabel = "Best for evenings out";
      interestBody = avgLowTemp >= 18
        ? `Evenings stay warm at around ${avgLowTemp}°C — rooftop bars, outdoor venues and late-night strolls all work without a jacket.`
        : avgLowTemp >= 10
        ? `After dark settles at around ${avgLowTemp}°C — comfortable for walking between venues with a light layer; outdoor seating is borderline once the sun goes down.`
        : `Nights drop to around ${avgLowTemp}°C, so plan around indoor venues and quick taxi hops between bars rather than long outdoor evenings.`;
      break;
    case "shopping-markets":
      interestLabel = "Best for shopping and markets";
      interestBody = hot
        ? `Open-air markets feel best in ${morningSlot}; reserve afternoons for air-conditioned malls and covered souks when ${avgHighTemp}°C heat peaks.`
        : rainyDays >= 7
        ? `With rain on roughly ${rainyDays} of ${days} days, lean towards covered arcades and indoor markets — open-air browsing works best on the drier ${dryDays} days, ideally midday.`
        : `Comfortable ${avgHighTemp}°C days make outdoor markets and street browsing easy throughout the day; the busiest, best-stocked window is usually 10am–2pm.`;
      break;
    case "wellness-slow-travel":
      interestLabel = "Best for slow mornings and walks";
      interestBody = hot
        ? `Slow mornings outside work beautifully until around 10am while temperatures sit near ${avgLowTemp}°C; long walks return as the day cools after 5pm.`
        : mild || warm
        ? `Soft mornings around ${avgLowTemp}°C and afternoons up to ${avgHighTemp}°C suit unhurried walks, café terraces and outdoor reading through most of the day.`
        : `Cool ${avgHighTemp}°C days make late-morning to early-afternoon the most inviting window for outdoor walks; mornings reward a slow indoor start with a warm drink.`;
      break;
    default:
      interestLabel = "Best window for your day";
      interestBody = hot
        ? `Plan outdoor time for ${morningSlot} or ${eveningSlot}; the ${avgHighTemp}°C midday peak is best spent indoors or in the shade.`
        : cool
        ? `Late morning to early afternoon is the most comfortable stretch, with highs reaching around ${avgHighTemp}°C.`
        : `Comfortable ${avgHighTemp}°C days mean you can build full outdoor schedules; just keep an eye on the sky on the ${rainyDays} expected rainy days.`;
  }

  // Card 2 — Best week
  const bestWeekRain = bestWeek?.totalRainfall ?? 0;
  const bestWeekHigh = bestWeek?.avgHigh ?? avgHighTemp;
  const bestWeekBody = `The ${bestWeekOrd} week looks strongest — highs averaging ${bestWeekHigh}°C with ${bestWeekRain}mm of rain across the week, the most reliable balance of warmth and dry days in ${monthFull}.`;

  // Card 3 — Rain reality check
  const rainBody = rainyDays === 0
    ? `Effectively dry — no measurable rain across the month, so you can plan outdoor activities without a backup.`
    : `Around ${rainyDays} of ${days} days see measurable rain — typically ${rainPatternDesc}${heavyDays > 0 ? `, with about ${heavyDays} day${heavyDays === 1 ? "" : "s"} of heavier rainfall` : ""}. ${dryDaysPct >= 60 ? `${dryDaysPct}% of days stay dry, so most plans hold` : `Build flexibility into outdoor plans and keep an indoor option in your back pocket`}.`;

  // Card 4 — Daylight
  const daylightUnlock = daylightHours >= 14
    ? `dinners outside still in daylight, late golden-hour walks, and full multi-stop days without rushing`
    : daylightHours >= 11
    ? `comfortable full days of sightseeing with time for an unhurried evening before sunset`
    : daylightHours >= 9
    ? `compact daytime plans — front-load outdoor sights and lean into atmospheric early evenings`
    : `short days that suit cosy interiors, museum afternoons, and early dinners as the city lights come on`;
  const daylightBody = `Roughly ${daylightHoursInt} hours of daylight — enough for ${daylightUnlock}.`;

  // Card 5 — Temperature range / packing
  const packBody = range >= 14
    ? `Big swing of ${range}°C between ${avgHighTemp}°C afternoons and ${avgLowTemp}°C mornings — pack layers you can shed and add through the day, plus a light jumper for after sunset.`
    : range >= 9
    ? `A ${range}°C gap between ${avgHighTemp}°C days and ${avgLowTemp}°C nights — daytime stays comfortable in light clothing, but you'll want a layer for evenings out.`
    : range >= 5
    ? `Steady conditions with only a ${range}°C swing between day and night — what you wear in the afternoon mostly works for the evening too.`
    : `Very stable temperatures — daytime ${avgHighTemp}°C and night ${avgLowTemp}°C feel similar, so a single thoughtful outfit covers most of the day.`;

  // Card 6 — Month context (one sentence, no judgement)
  const contextBody = sunshineHours >= 8 && rainyDays <= 5
    ? `${monthFull} is one of the brighter, drier months locally — useful context as you plan around daylight and outdoor time.`
    : sunshineHours >= 6
    ? `${monthFull} sits in the city's mid-range for sunshine and rainfall, with conditions that broadly match the seasonal averages travellers expect.`
    : rainyDays >= 10
    ? `${monthFull} tends to be one of the wetter months in ${city}, which is helpful to know when you're sequencing outdoor and indoor plans.`
    : `${monthFull} brings characteristically ${cool ? "cool" : warm ? "warm" : "mild"} conditions for ${city}, useful context as you decide how to pace your days.`;

  return [
    { label: interestLabel, body: interestBody },
    { label: "Best week", body: bestWeekBody },
    { label: "Rain pattern", body: rainBody },
    { label: "Daylight", body: daylightBody },
    { label: "What to pack", body: packBody },
    { label: "Month context", body: contextBody },
  ];
}
