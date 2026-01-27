import { supabase } from "@/integrations/supabase/client";
import { CityWeather, WeatherRequest } from "@/types/weather";

export async function getCityWeather(request: WeatherRequest): Promise<CityWeather> {
  const { data, error } = await supabase.functions.invoke("city-weather", {
    body: request,
  });

  if (error) {
    console.error("Error fetching weather:", error);
    throw new Error(error.message || "Failed to fetch weather data");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as CityWeather;
}
