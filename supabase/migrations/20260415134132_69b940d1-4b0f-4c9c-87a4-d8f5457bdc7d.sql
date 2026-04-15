CREATE TABLE public.city_stats_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  interest TEXT NOT NULL,
  stats_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (city, country, interest)
);

ALTER TABLE public.city_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for city stats cache"
ON public.city_stats_cache
FOR SELECT
TO public
USING (true);