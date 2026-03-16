CREATE TABLE public.street_sentiment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text NOT NULL,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_street_sentiment_city_country ON public.street_sentiment_cache (city, country);

ALTER TABLE public.street_sentiment_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for street sentiment cache"
  ON public.street_sentiment_cache
  FOR SELECT
  TO public
  USING (true);