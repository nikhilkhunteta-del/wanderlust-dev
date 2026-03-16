import { supabase } from "@/integrations/supabase/client";

export interface SentimentCategory {
  name: string;
  verdict: string;
  sentiment: "positive" | "mixed" | "negative";
}

export interface StreetSentiment {
  categories: SentimentCategory[];
  sourcesSummary?: string;
  citations?: string[];
}

export async function getStreetSentiment(city: string, country: string): Promise<StreetSentiment> {
  const { data, error } = await supabase.functions.invoke("street-sentiment", {
    body: { city, country },
  });

  if (error) throw new Error(error.message);
  return data as StreetSentiment;
}
