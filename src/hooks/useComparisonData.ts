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

function verdictToScore(level: "green" | "amber" | "red"): number {
  if (level === "green") return 9;
  if (level === "amber") return 6;
  return 3;
}

function weatherRankToScore(rank: number, total: number): number {
  if (total <= 0) return 5;
  const pct = 1 - (rank - 1) / total;
  return Math.round(pct * 9) + 1;
}

function priceToScore(price: number | null): number {
  if (!price || price <= 0) return 5;
  if (price < 200) return 9;
  if (price < 400) return 7;
  if (price < 700) return 5;
  if (price < 1200) return 3;
  return 1;
}

function stayValueScore(categories: any[]): number {
  const mid = categories?.find((c: any) => c.category === "midRange");
  if (!mid?.medianPrice) return 5;
  const price = mid.medianPrice;
  if (price < 50) return 9;
  if (price < 100) return 7;
  if (price < 180) return 5;
  if (price < 300) return 3;
  return 1;
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

  const st0 = useStayInsights(cities[0]?.city ?? "", cities[0]?.country ?? "", profile.travelMonth, profile.departureCity, profile.travelCompanions, profile.groupType, profile.tripDuration, profile.styleTags, profile.travelPace);
  const st1 = useStayInsights(cities[1]?.city ?? "", cities[1]?.country ?? "", profile.travelMonth, profile.departureCity, profile.travelCompanions, profile.groupType, profile.tripDuration, profile.styleTags, profile.travelPace);
  const st2 = useStayInsights(cities[2]?.city ?? "", cities[2]?.country ?? "", profile.travelMonth, profile.departureCity, profile.travelCompanions, profile.groupType, profile.tripDuration, profile.styleTags, profile.travelPace);

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
    return cities.map((city, i) => {
      const h = highlights[i].data;
      const w = weather[i].data;
      const f = flights[i].data;
      const g = ground[i].data;
      const s = seasonal[i].data;
      const st = stays[i].data;

      // Personal match
      const matchReasons = h?.personalMatchReasons?.length ?? 0;
      const matchScore = h ? Math.min(10, 5 + matchReasons) : 5;

      // Weather
      const rank = w?.monthRanking;
      const weatherScore = rank ? weatherRankToScore(rank.rank, rank.totalMonths) : 5;

      // Flight cost
      const flightPrice = f?.priceSnapshot?.lowPrice ?? null;
      const flightScore = priceToScore(flightPrice);

      // Safety
      const safetyScore = g ? verdictToScore(g.verdictLevel) : 5;

      // Seasonal events
      const matchedEvents = s?.highlights?.filter((e) => e.matchesInterests)?.length ?? 0;
      const totalEvents = s?.highlights?.length ?? 0;
      const seasonalScore = Math.min(10, 3 + matchedEvents * 2 + Math.min(totalEvents, 3));

      // Accommodation value
      const accomScore = st ? stayValueScore(st.priceCategories) : 5;

      const scores: CityScores = {
        city,
        personalMatch: { score: matchScore, summary: h?.matchStatement?.split('.')[0] ?? "Data loading" },
        weatherFit: { score: weatherScore, summary: w?.verdict?.split('.')[0] ?? "Data loading" },
        gettingThere: { score: flightScore, summary: f ? `From ${f.priceSnapshot.currency}${f.priceSnapshot.lowPrice}` : "No departure city" },
        safety: { score: safetyScore, summary: g?.verdict?.split('.')[0] ?? "Data loading" },
        seasonalEvents: { score: seasonalScore, summary: s ? `${matchedEvents} events matching your interests` : "Data loading" },
        accommodationValue: { score: accomScore, summary: st?.overview?.split('.')[0] ?? "Data loading" },
        weightedTotal: 0,
      };

      // Calculate weighted total
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
