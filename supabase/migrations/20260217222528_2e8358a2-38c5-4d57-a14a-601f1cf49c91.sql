
CREATE TABLE public.seasonal_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city, country, month, year)
);

ALTER TABLE public.seasonal_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for seasonal cache"
ON public.seasonal_cache
FOR SELECT
USING (true);

CREATE INDEX idx_seasonal_cache_lookup ON public.seasonal_cache(city, country, month, year);
