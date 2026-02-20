
-- Cache table for health data
CREATE TABLE public.health_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  country text NOT NULL,
  travel_month text NOT NULL,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint for upsert
CREATE UNIQUE INDEX health_cache_lookup ON public.health_cache (lower(city), lower(country), lower(travel_month));

-- RLS
ALTER TABLE public.health_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for health cache" ON public.health_cache FOR SELECT USING (true);

-- Cache table for on-the-ground data
CREATE TABLE public.ground_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  country text NOT NULL,
  travel_month text NOT NULL,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint for upsert
CREATE UNIQUE INDEX ground_cache_lookup ON public.ground_cache (lower(city), lower(country), lower(travel_month));

-- RLS
ALTER TABLE public.ground_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for ground cache" ON public.ground_cache FOR SELECT USING (true);
