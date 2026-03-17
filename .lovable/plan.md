

## Plan: Update rationale instruction in recommend-destinations

**What**: Replace the current rationale writing instruction in the system prompt with the user's exact new wording.

**Where**: `supabase/functions/recommend-destinations/index.ts`, in the `systemPrompt` string, the section starting with "For each city, write exactly 2 sentences".

**Change**: Replace the existing rationale instruction block with:

> "Write each city rationale in exactly 2 sentences. Sentence 1 must explain the primary match, beginning with a direct reference to the user's stated interests or selected cultural moment. Sentence 2 must add one specific, vivid, concrete detail that makes this city feel real and unmissable. Write both sentences before outputting — do not start outputting until both sentences are complete and you have verified the total is exactly 2. If you find yourself writing a third sentence, stop, delete it, and output only the first 2."

This replaces the current instruction that begins with "For each city, write exactly 2 sentences — no more..." through "...If your rationale exceeds 2 sentences, remove sentences until exactly 2 remain. Do not summarise — truncate."

Single file edit, prompt-only change, no structural or code logic changes.

