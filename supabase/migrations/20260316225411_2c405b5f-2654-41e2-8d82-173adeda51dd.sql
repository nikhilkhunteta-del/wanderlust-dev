ALTER TABLE public.saved_travel_profiles
ADD COLUMN previous_cities jsonb NOT NULL DEFAULT '[]'::jsonb;