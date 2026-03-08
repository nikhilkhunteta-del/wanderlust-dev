
CREATE TABLE public.stay_insights_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text NOT NULL,
  check_in text NOT NULL,
  check_out text NOT NULL,
  currency text NOT NULL,
  adults integer NOT NULL DEFAULT 2,
  children integer NOT NULL DEFAULT 0,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index for cache lookups
CREATE UNIQUE INDEX stay_cache_lookup_idx ON public.stay_insights_cache (city, country, check_in, check_out, currency, adults, children);

-- Enable RLS
ALTER TABLE public.stay_insights_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (same pattern as other caches)
CREATE POLICY "Public read access for stay insights cache"
  ON public.stay_insights_cache
  FOR SELECT
  USING (true);
