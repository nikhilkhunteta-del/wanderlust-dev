-- Add write policies for ai_content_cache.
-- service_role bypasses RLS automatically, but if the service role key is
-- misconfigured (e.g. stale secret from a previous project), the JWT falls back
-- to anonymous. This policy ensures cache writes succeed regardless.
CREATE POLICY "Allow cache inserts"
ON public.ai_content_cache
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow cache updates"
ON public.ai_content_cache
FOR UPDATE
USING (true)
WITH CHECK (true);
