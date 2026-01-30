-- Create image_cache table for storing resolved images with TTL
CREATE TABLE public.image_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  image_type TEXT NOT NULL CHECK (image_type IN ('city_hero', 'attraction', 'seasonal', 'neighborhood', 'category')),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  entity_name TEXT,
  image_url TEXT NOT NULL,
  small_url TEXT,
  thumb_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('wikimedia', 'unsplash', 'pexels', 'local')),
  photographer TEXT,
  photographer_url TEXT,
  source_url TEXT,
  attribution_required BOOLEAN NOT NULL DEFAULT false,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0
);

-- Create index for fast cache lookups
CREATE INDEX idx_image_cache_key ON public.image_cache (cache_key);
CREATE INDEX idx_image_cache_city ON public.image_cache (city, country);
CREATE INDEX idx_image_cache_expires ON public.image_cache (expires_at);

-- Enable RLS but allow public read access (images are public)
ALTER TABLE public.image_cache ENABLE ROW LEVEL SECURITY;

-- Public read policy - anyone can view cached images
CREATE POLICY "Public read access for cached images" 
ON public.image_cache 
FOR SELECT 
USING (true);

-- Service role insert/update/delete (edge functions use service role)
-- No RLS policy needed for service role as it bypasses RLS

-- Create a function to clean up expired cache entries (can be called by cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_image_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.image_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create storage bucket for fallback images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'travel-images', 
  'travel-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Public read policy for storage bucket
CREATE POLICY "Public read access for travel images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'travel-images');