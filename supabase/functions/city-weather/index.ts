// City Weather Edge Function - Using Open-Meteo API

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

    // Step 2: Calculate date range for the travel month (use last year's data)
    const monthIndex = getMonthIndex(travelMonth);
    const lastYear = new Date().getFullYear() - 1;
    const startDate = new Date(lastYear, monthIndex, 1);
    const endDate = new Date(lastYear, monthIndex + 1, 0); // Last day of month

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Step 3: Fetch historical weather data from Open-Meteo Archive API
    const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${location.latitude}&longitude=${location.longitude}&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration&timezone=auto`;
    
    console.log(`Fetching weather from: ${weatherUrl}`);
    
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (weatherData.error) {
      console.error("Open-Meteo error:", weatherData);
      throw new Error(weatherData.reason || "Failed to fetch weather data");
    }

    const daily: DailyWeatherData = weatherData.daily;

    if (!daily || !daily.time || daily.time.length === 0) {
      throw new Error("No weather data available for this period");
    }

    // Step 4: Process the data into our format
    const dailyData = daily.time.map((_, index) => ({
      day: index + 1,
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
      rainfall: Math.round(daily.precipitation_sum[index] * 10) / 10,
    }));

    // Calculate weekly aggregates
    const weeklyData = [];
    const daysInMonth = dailyData.length;
    
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
    
    // Sunshine hours: sunshine_duration is in seconds, convert to hours per day average
    const totalSunshineSeconds = daily.sunshine_duration.reduce((sum, val) => sum + (val || 0), 0);
    const sunshineHours = Math.round((totalSunshineSeconds / dailyData.length / 3600) * 10) / 10;

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

    console.log("Weather data processed successfully");

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
  };
  return months[month] ?? 0;
}

interface WeekData {
  week: number;
  avgHigh: number;
  avgLow: number;
  totalRainfall: number;
}

function generateInsights(weeklyData: WeekData[], avgHighTemp: number, totalRainfall: number) {
  const insights: { type: "favorable" | "unfavorable" | "neutral"; text: string }[] = [];
  
  // Find best and worst weeks
  const sortedByTemp = [...weeklyData].sort((a, b) => b.avgHigh - a.avgHigh);
  const sortedByRain = [...weeklyData].sort((a, b) => a.totalRainfall - b.totalRainfall);
  
  // Warmest week
  if (sortedByTemp[0]) {
    const warmest = sortedByTemp[0];
    insights.push({
      type: warmest.avgHigh > avgHighTemp ? "favorable" : "neutral",
      text: `Week ${warmest.week} tends to be the warmest with highs around ${warmest.avgHigh}°C`,
    });
  }
  
  // Driest week
  if (sortedByRain[0]) {
    const driest = sortedByRain[0];
    insights.push({
      type: driest.totalRainfall < totalRainfall / 4 ? "favorable" : "neutral",
      text: `Week ${driest.week} is typically the driest with only ${driest.totalRainfall}mm of rain`,
    });
  }
  
  // Wettest week warning
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
  if (avgHigh >= 25 && sunshine >= 8 && rainfall < 50) {
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
  
  // Score each week (higher temp + lower rain = better)
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
  
  if (sunshine >= 6) {
    tips.push({ icon: "sunglasses", tip: "Sunglasses and SPF are essential with high sunshine hours" });
  }
  
  if (rainfall > 50) {
    tips.push({ icon: "umbrella", tip: "Pack a compact umbrella or rain jacket for occasional showers" });
  }
  
  if (avgHigh - avgLow > 10) {
    tips.push({ icon: "layers", tip: "Dress in layers - temperatures vary significantly throughout the day" });
  } else if (avgHigh > 25) {
    tips.push({ icon: "sun", tip: "Light, breathable clothing recommended for warm temperatures" });
  } else if (avgHigh < 15) {
    tips.push({ icon: "jacket", tip: "Bring a warm jacket for cooler temperatures" });
  }
  
  if (avgHigh > 20 && sunshine >= 5) {
    tips.push({ icon: "hat", tip: "A hat will help protect you from the sun during outdoor activities" });
  }
  
  // Ensure we have at least 3 tips
  if (tips.length < 3) {
    if (!tips.some(t => t.icon === "layers")) {
      tips.push({ icon: "layers", tip: "Versatile clothing lets you adapt to changing conditions" });
    }
  }
  
  return tips.slice(0, 3);
}
