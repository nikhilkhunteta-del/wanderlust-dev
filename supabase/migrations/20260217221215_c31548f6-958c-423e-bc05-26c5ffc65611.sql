
-- Situational awareness cache table
CREATE TABLE public.situational_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  events_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city, country, month, year)
);

-- Enable RLS
ALTER TABLE public.situational_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (cached data is non-sensitive)
CREATE POLICY "Public read access for situational cache"
  ON public.situational_cache
  FOR SELECT
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_situational_cache_lookup ON public.situational_cache (city, country, month, year);
