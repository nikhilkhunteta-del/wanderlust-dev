import { useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCityHighlights,
  useCityWeather,
  useFlightInsights,
  useOnTheGround,
  useSeasonalHighlights,
  useStayInsights,
} from "./useCityData";
import { CityRecommendation } from "@/types/recommendations";
import { TravelProfile } from "@/types/travelProfile";
import {
  CityScores,
  DimensionScore,
  DimensionWeights,
  DEFAULT_WEIGHTS,
  ComparisonVerdict,
} from "@/types/comparison";
import { CityHighlightsRequest } from "@/types/cityHighlights";

function buildHighlightsRequest(city: CityRecommendation, profile: TravelProfile): CityHighlightsRequest {
  return {
    city: city.city,
    country: city.country,
    rationale: city.rationale,
    userInterests: Object.entries(profile.interestScores)
      .filter(([_, s]) => s > 0)
      .map(([k]) => k),
    adventureTypes: profile.adventureTypes,
    travelMonth: profile.travelMonth,
    styleTags: profile.styleTags,
    travelCompanions: profile.travelCompanions,
    groupType: profile.groupType,
  };
}

// --- Raw value extractors (not scores yet) ---

function rawSafetyValue(level: "green" | "amber" | "red" | undefined): number {
  if (level === "green") return 9;
  if (level === "amber") return 6;
  return 3;
}

function rawWeatherValue(rank: { rank: number; totalMonths: number } | undefined): number {
  if (!rank || rank.totalMonths <= 0) return 5;
  const pct = 1 - (rank.rank - 1) / rank.totalMonths;
  return Math.round(pct * 9) + 1;
}

function rawFlightValue(price: number | null): number {
  // Lower price = higher raw value (inverted)
  if (!price || price <= 0) return 5;
  if (price < 150) return 10;
  if (price < 250) return 8;
  if (price < 400) return 6.5;
  if (price < 700) return 5;
  if (price < 1000) return 3.5;
  if (price < 1500) return 2;
  return 1;
}

function rawStayValue(categories: any[]): number {
  const mid = categories?.find((c: any) => c.category === "midRange");
  if (!mid?.medianPrice) return 5;
  const price = mid.medianPrice;
  if (price < 40) return 10;
  if (price < 70) return 8;
  if (price < 100) return 7;
  if (price < 150) return 5.5;
  if (price < 250) return 4;
  if (price < 400) return 2.5;
  return 1;
}

function rawMatchValue(matchReasons: number): number {
  // More granular: 0 reasons=3, 1=5, 2=6.5, 3=7.5, 4=8.5, 5+=9.5
  if (matchReasons <= 0) return 3;
  return Math.min(10, 3 + matchReasons * 1.5);
}

/**
 * Normalize an array of raw values across 3 cities to ensure differentiation.
 * The best city gets a score stretched toward 10, the worst toward the floor.
 * Guarantees at least `minSpread` points between best and worst when raw values differ.
 */
function normalizeAcrossCities(rawValues: number[], minSpread = 1.5): number[] {
  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);
  const range = max - min;

  // If all identical, return as-is (no fake differentiation)
  if (range < 0.01) return rawValues.map((v) => Math.round(v * 10) / 10);

  // Map to 1-10 scale with the best at ceiling, worst at floor
  // Use the raw midpoint to set the anchor
  const avg = rawValues.reduce((a, b) => a + b, 0) / rawValues.length;
  const ceiling = Math.min(10, Math.max(avg + 1.5, max));
  const floor = Math.max(1, Math.min(avg - 1.5, min));
  const targetRange = Math.max(minSpread, ceiling - floor);

  return rawValues.map((v) => {
    const normalized = floor + ((v - min) / range) * targetRange;
    return Math.round(Math.min(10, Math.max(1, normalized)) * 10) / 10;
  });
}

export function useComparisonData(
  cities: CityRecommendation[],
  profile: TravelProfile
) {
  const [weights, setWeights] = useState<DimensionWeights>({ ...DEFAULT_WEIGHTS });

  // Build requests
  const requests = cities.map((c) => buildHighlightsRequest(c, profile));
  const flightRequests = cities.map((c) =>
    profile.departureCity
      ? {
          departureCity: profile.departureCity,
          destinationCity: c.city,
          destinationCountry: c.country,
          travelMonth: profile.travelMonth,
        }
      : null
  );

  const interests = Object.entries(profile.interestScores)
    .filter(([_, s]) => s > 0)
    .map(([k]) => k);

  // Fetch all data for all 3 cities
  const h0 = useCityHighlights(requests[0] ?? null);
  const h1 = useCityHighlights(requests[1] ?? null);
  const h2 = useCityHighlights(requests[2] ?? null);

  const w0 = useCityWeather(cities[0]?.city ?? "", cities[0]?.country ?? "", profile.travelMonth);
  const w1 = useCityWeather(cities[1]?.city ?? "", cities[1]?.country ?? "", profile.travelMonth);
  const w2 = useCityWeather(cities[2]?.city ?? "", cities[2]?.country ?? "", profile.travelMonth);

  const f0 = useFlightInsights(flightRequests[0]);
  const f1 = useFlightInsights(flightRequests[1]);
  const f2 = useFlightInsights(flightRequests[2]);

  const g0 = useOnTheGround(cities[0]?.city ?? "", cities[0]?.country ?? "", profile.travelMonth);
  const g1 = useOnTheGround(cities[1]?.city ?? "", cities[1]?.country ?? "", profile.travelMonth);
  const g2 = useOnTheGround(cities[2]?.city ?? "", cities[2]?.country ?? "", profile.travelMonth);

  const s0 = useSeasonalHighlights(cities[0]?.city ?? "", cities[0]?.country ?? "", profile.travelMonth, interests, profile.travelCompanions, profile.styleTags);
  const s1 = useSeasonalHighlights(cities[1]?.city ?? "", cities[1]?.country ?? "", profile.travelMonth, interests, profile.travelCompanions, profile.styleTags);
  const s2 = useSeasonalHighlights(cities[2]?.city ?? "", cities[2]?.country ?? "", profile.travelMonth, interests, profile.travelCompanions, profile.styleTags);

  const st0 = useStayInsights(cities[0]?.city ?? "", cities[0]?.country ?? "", profile.travelMonth, profile.departureCity, profile.travelCompanions, profile.groupType, profile.tripDuration, profile.styleTags, 0.5);
  const st1 = useStayInsights(cities[1]?.city ?? "", cities[1]?.country ?? "", profile.travelMonth, profile.departureCity, profile.travelCompanions, profile.groupType, profile.tripDuration, profile.styleTags, 0.5);
  const st2 = useStayInsights(cities[2]?.city ?? "", cities[2]?.country ?? "", profile.travelMonth, profile.departureCity, profile.travelCompanions, profile.groupType, profile.tripDuration, profile.styleTags, 0.5);

  const highlights = [h0, h1, h2];
  const weather = [w0, w1, w2];
  const flights = [f0, f1, f2];
  const ground = [g0, g1, g2];
  const seasonal = [s0, s1, s2];
  const stays = [st0, st1, st2];

  const isLoading = [...highlights, ...weather, ...flights, ...ground, ...seasonal, ...stays].some(
    (q) => q.isLoading
  );

  const allLoaded = cities.every((_, i) => 
    highlights[i].data && weather[i].data && ground[i].data && seasonal[i].data && stays[i].data
  );

  const cityScores = useMemo<CityScores[]>(() => {
    // Step 1: Extract raw values for all cities
    const rawMatch = cities.map((_, i) => {
      const h = highlights[i].data;
      return h ? rawMatchValue(h.personalMatchReasons?.length ?? 0) : 5;
    });
    const rawWeather = cities.map((_, i) => {
      const w = weather[i].data;
      return rawWeatherValue(w?.monthRanking);
    });
    const rawFlight = cities.map((_, i) => {
      const f = flights[i].data;
      return rawFlightValue(f?.priceSnapshot?.lowPrice ?? null);
    });
    const rawSafety = cities.map((_, i) => {
      const g = ground[i].data;
      return rawSafetyValue(g?.verdictLevel);
    });
    // Seasonal: normalize by best city's matched event count
    const matchedCounts = cities.map((_, i) => {
      const s = seasonal[i].data;
      return s?.highlights?.filter((e: any) => e.matchesInterests)?.length ?? 0;
    });
    const maxMatched = Math.max(...matchedCounts, 1);
    const rawSeasonal = matchedCounts.map((count) => {
      // Best city = 10, others proportional, minimum 2 if they have any events
      if (count === 0) return 2;
      return Math.max(2, Math.round((count / maxMatched) * 10 * 10) / 10);
    });
    const rawAccom = cities.map((_, i) => {
      const st = stays[i].data;
      return st ? rawStayValue(st.priceCategories) : 5;
    });

    // Step 2: Normalize each dimension across all 3 cities
    const normMatch = normalizeAcrossCities(rawMatch);
    const normWeather = normalizeAcrossCities(rawWeather);
    const normFlight = normalizeAcrossCities(rawFlight);
    const normSafety = normalizeAcrossCities(rawSafety);
    const normSeasonal = normalizeAcrossCities(rawSeasonal, 2);
    const normAccom = normalizeAcrossCities(rawAccom);

    // Step 3: Build scored objects
    return cities.map((city, i) => {
      const h = highlights[i].data;
      const w = weather[i].data;
      const f = flights[i].data;
      const g = ground[i].data;
      const s = seasonal[i].data;
      const st = stays[i].data;

      const scores: CityScores = {
        city,
        personalMatch: { score: normMatch[i], summary: h?.matchStatement?.split('.')[0] ?? "Data loading" },
        weatherFit: { score: normWeather[i], summary: w?.verdict?.split('.')[0] ?? "Data loading" },
        gettingThere: { score: normFlight[i], summary: f ? `From ${f.priceSnapshot.currency}${f.priceSnapshot.lowPrice}` : "No departure city" },
        safety: { score: normSafety[i], summary: g?.verdict?.split('.')[0] ?? "Data loading" },
        seasonalEvents: { score: normSeasonal[i], summary: s ? `${matchedCounts[i]} events matching your interests` : "Data loading" },
        accommodationValue: { score: normAccom[i], summary: st?.overview?.split('.')[0] ?? "Data loading" },
        weightedTotal: 0,
      };

      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      scores.weightedTotal =
        (scores.personalMatch.score * weights.personalMatch +
          scores.weatherFit.score * weights.weatherFit +
          scores.gettingThere.score * weights.gettingThere +
          scores.safety.score * weights.safety +
          scores.seasonalEvents.score * weights.seasonalEvents +
          scores.accommodationValue.score * weights.accommodationValue) /
        totalWeight;

      return scores;
    });
  }, [cities, highlights, weather, flights, ground, seasonal, stays, weights]);

  // Sort by weighted total
  const ranked = useMemo(
    () => [...cityScores].sort((a, b) => b.weightedTotal - a.weightedTotal),
    [cityScores]
  );

  const resetWeights = useCallback(() => setWeights({ ...DEFAULT_WEIGHTS }), []);

  return {
    cityScores,
    ranked,
    weights,
    setWeights,
    resetWeights,
    isLoading,
    allLoaded,
    rawData: { highlights, weather, flights, ground, seasonal, stays },
  };
}
