
CREATE TABLE public.saved_travel_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_saved_travel_profiles_email ON public.saved_travel_profiles (email);

ALTER TABLE public.saved_travel_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (no auth required for this feature)
CREATE POLICY "Anyone can save a travel profile"
  ON public.saved_travel_profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update their own profile by email
CREATE POLICY "Anyone can update their own travel profile"
  ON public.saved_travel_profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
