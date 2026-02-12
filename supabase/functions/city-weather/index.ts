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
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = await req.json();

    console.log(`Fetching weather data for ${city}, ${country} in ${travelMonth}`);

    // Step 1: Geocode the city to get coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Could not find coordinates for ${city}`);
    }

    // Try to match the country, otherwise use first result
    let location: GeocodingResult = geoData.results[0];
    for (const result of geoData.results) {
      if (result.country?.toLowerCase().includes(country.toLowerCase()) ||
          country.toLowerCase().includes(result.country?.toLowerCase())) {
        location = result;
        break;
      }
    }

    console.log(`Found coordinates: ${location.latitude}, ${location.longitude} for ${location.name}, ${location.country}`);

    // Step 2: Fetch 3 years of historical data for the travel month and average them
    const monthIndex = getMonthIndex(travelMonth);
    const currentYear = new Date().getFullYear();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Use 3 most recent complete years for averaging
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

    console.log(`Averaging weather data from ${allYearlyData.length} years`);

    // Average across years, day-by-day (use the shortest month length)
    const daysInMonth = Math.min(...allYearlyData.map(y => y.high.length));

    const dailyData = [];
    for (let d = 0; d < daysInMonth; d++) {
      let sumHigh = 0, sumLow = 0, sumRain = 0;
      let count = 0;
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

    // Calculate sunshine average (total seconds across years)
    let totalSunshineSeconds = 0;
    let sunshineCount = 0;
    for (const year of allYearlyData) {
      for (const val of year.sunshine) {
        totalSunshineSeconds += val || 0;
        sunshineCount++;
      }
    }
    const sunshineHours = Math.round((totalSunshineSeconds / sunshineCount / 3600) * 10) / 10;

    // Calculate weekly aggregates
    const weeklyData = [];
    for (let week = 0; week < 4; week++) {
      const startDay = week * 7;
      const endDay = week === 3 ? daysInMonth : Math.min((week + 1) * 7, daysInMonth);
      const weekDays = dailyData.slice(startDay, endDay);

      if (weekDays.length > 0) {
        const avgHigh = Math.round(weekDays.reduce((sum, d) => sum + d.high, 0) / weekDays.length);
        const avgLow = Math.round(weekDays.reduce((sum, d) => sum + d.low, 0) / weekDays.length);
        const totalRainfall = Math.round(weekDays.reduce((sum, d) => sum + d.rainfall, 0) * 10) / 10;

        weeklyData.push({
          week: week + 1,
          weekLabel: `Week ${week + 1} (${startDay + 1}-${endDay})`,
          avgHigh,
          avgLow,
          totalRainfall,
        });
      }
    }

    // Calculate overall stats
    const avgHighTemp = Math.round(dailyData.reduce((sum, d) => sum + d.high, 0) / dailyData.length);
    const avgLowTemp = Math.round(dailyData.reduce((sum, d) => sum + d.low, 0) / dailyData.length);
    const totalRainfall = Math.round(dailyData.reduce((sum, d) => sum + d.rainfall, 0) * 10) / 10;

    // Generate insights based on the data
    const insights = generateInsights(weeklyData, avgHighTemp, totalRainfall);

    // Determine verdict and best time
    const verdict = generateVerdict(city, travelMonth, avgHighTemp, avgLowTemp, totalRainfall, sunshineHours);
    const bestTimeToVisit = generateBestTime(weeklyData, travelMonth);
    const packingTips = generatePackingTips(avgHighTemp, avgLowTemp, totalRainfall, sunshineHours);

    const result = {
      verdict,
      stats: {
        avgHighTemp,
        avgLowTemp,
        sunshineHours,
        totalRainfall,
        unit: "celsius" as const,
      },
      dailyData,
      weeklyData,
      insights,
      bestTimeToVisit,
      packingTips,
    };

    console.log(`Weather data processed: avgHigh=${avgHighTemp}°C, avgLow=${avgLowTemp}°C (${allYearlyData.length}-year avg)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching weather data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather data";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getMonthIndex(month: string): number {
  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3,
    May: 4, June: 5, July: 6, August: 7,
    September: 8, October: 9, November: 10, December: 11,
    // Also support abbreviated forms
    jan: 0, feb: 1, mar: 2, apr: 3,
    may: 4, jun: 5, jul: 6, aug: 7,
    sep: 8, oct: 9, nov: 10, dec: 11,
  };
  return months[month] ?? months[month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()] ?? 0;
}

interface WeekData {
  week: number;
  avgHigh: number;
  avgLow: number;
  totalRainfall: number;
}

function generateInsights(weeklyData: WeekData[], avgHighTemp: number, totalRainfall: number) {
  const insights: { type: "favorable" | "unfavorable" | "neutral"; text: string }[] = [];

  const sortedByTemp = [...weeklyData].sort((a, b) => b.avgHigh - a.avgHigh);
  const sortedByRain = [...weeklyData].sort((a, b) => a.totalRainfall - b.totalRainfall);

  if (sortedByTemp[0]) {
    const warmest = sortedByTemp[0];
    insights.push({
      type: warmest.avgHigh > avgHighTemp ? "favorable" : "neutral",
      text: `Week ${warmest.week} tends to be the warmest with highs around ${warmest.avgHigh}°C`,
    });
  }

  if (sortedByRain[0]) {
    const driest = sortedByRain[0];
    insights.push({
      type: driest.totalRainfall < totalRainfall / 4 ? "favorable" : "neutral",
      text: `Week ${driest.week} is typically the driest with only ${driest.totalRainfall}mm of rain`,
    });
  }

  const wettest = sortedByRain[sortedByRain.length - 1];
  if (wettest && wettest.totalRainfall > totalRainfall / 3) {
    insights.push({
      type: "unfavorable",
      text: `Week ${wettest.week} sees the most rain at ${wettest.totalRainfall}mm - pack accordingly`,
    });
  }

  return insights;
}

function generateVerdict(city: string, month: string, avgHigh: number, avgLow: number, rainfall: number, sunshine: number): string {
  if (avgHigh >= 40) {
    return `${month} brings intense heat to ${city} with temperatures often exceeding 40°C. Plan outdoor activities for early morning or evening.`;
  } else if (avgHigh >= 25 && sunshine >= 8 && rainfall < 50) {
    return `${month} is excellent for visiting ${city} with warm temperatures and plenty of sunshine.`;
  } else if (avgHigh >= 20 && sunshine >= 6) {
    return `${month} offers pleasant weather in ${city} with comfortable temperatures for sightseeing.`;
  } else if (avgHigh >= 15 && rainfall < 100) {
    return `${month} in ${city} brings mild temperatures - good for exploring without the crowds.`;
  } else if (rainfall > 150) {
    return `${month} is the rainy season in ${city} - expect frequent showers but fewer tourists.`;
  } else if (avgHigh < 10) {
    return `${month} brings cold weather to ${city} - pack warm layers if you visit.`;
  } else {
    return `${month} offers typical seasonal weather in ${city} - check weekly forecasts closer to your trip.`;
  }
}

function generateBestTime(weeklyData: WeekData[], month: string): string {
  if (weeklyData.length === 0) return `Any week in ${month} should be fine for your visit.`;

  const scored = weeklyData.map(w => ({
    ...w,
    score: w.avgHigh - (w.totalRainfall * 0.5),
  }));

  const best = scored.sort((a, b) => b.score - a.score)[0];

  if (best.totalRainfall < 10) {
    return `The ${getOrdinal(best.week)} week of ${month} looks ideal with warm temperatures and minimal rain.`;
  } else {
    return `Consider visiting during the ${getOrdinal(best.week)} week of ${month} for the best balance of weather conditions.`;
  }
}

function getOrdinal(n: number): string {
  const ordinals = ["first", "second", "third", "fourth"];
  return ordinals[n - 1] || `${n}th`;
}

function generatePackingTips(avgHigh: number, avgLow: number, rainfall: number, sunshine: number) {
  const tips: { icon: string; tip: string }[] = [];

  if (avgHigh >= 35) {
    tips.push({ icon: "sun", tip: "High SPF sunscreen, a wide-brimmed hat, and light breathable clothing are essential" });
    tips.push({ icon: "water", tip: "Carry a refillable water bottle - staying hydrated is critical in this heat" });
  } else if (sunshine >= 6) {
    tips.push({ icon: "sunglasses", tip: "Sunglasses and SPF are essential with high sunshine hours" });
  }

  if (rainfall > 50) {
    tips.push({ icon: "umbrella", tip: "Pack a compact umbrella or rain jacket for occasional showers" });
  }

  if (avgHigh - avgLow > 15) {
    tips.push({ icon: "layers", tip: "Large day-night temperature swings mean layers are a must" });
  } else if (avgHigh - avgLow > 10) {
    tips.push({ icon: "layers", tip: "Dress in layers - temperatures vary significantly throughout the day" });
  } else if (avgHigh > 25) {
    tips.push({ icon: "sun", tip: "Light, breathable clothing recommended for warm temperatures" });
  } else if (avgHigh < 15) {
    tips.push({ icon: "jacket", tip: "Bring a warm jacket for cooler temperatures" });
  }

  if (avgHigh > 20 && sunshine >= 5 && !tips.some(t => t.icon === "sun" && t.tip.includes("hat"))) {
    tips.push({ icon: "hat", tip: "A hat will help protect you from the sun during outdoor activities" });
  }

  if (tips.length < 3) {
    if (!tips.some(t => t.icon === "layers")) {
      tips.push({ icon: "layers", tip: "Versatile clothing lets you adapt to changing conditions" });
    }
  }

  return tips.slice(0, 4);
}
