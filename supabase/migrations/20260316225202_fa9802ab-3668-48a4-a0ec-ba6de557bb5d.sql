CREATE POLICY "Anyone can read their own travel profile"
  ON public.saved_travel_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);