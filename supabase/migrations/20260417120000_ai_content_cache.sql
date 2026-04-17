-- Unified cache table for AI-generated edge function responses.
-- All 7 AI edge functions write here; TTL is enforced via expires_at.
CREATE TABLE public.ai_content_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  data_json JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (function_name, cache_key)
);

CREATE INDEX idx_ai_content_cache_lookup ON public.ai_content_cache (function_name, cache_key);
CREATE INDEX idx_ai_content_cache_expires ON public.ai_content_cache (expires_at);

ALTER TABLE public.ai_content_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for AI content cache"
ON public.ai_content_cache
FOR SELECT
USING (true);

-- Helper to prune expired rows (call via cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_content_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_content_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
