

## Update city-highlights prompt to prevent placeholder-style match reasons

### Problem
The AI model sometimes outputs match reasons like "Your interest in will be captivated" — with the interest name missing or treated as a placeholder variable, despite existing instructions.

### Changes

**File:** `supabase/functions/city-highlights/index.ts`

**1. Add a new rule block after line 84** (after the childNote rule, before "Respond with ONLY valid JSON"):

```
CRITICAL — MATCH REASON FORMATTING:
Write each personalMatchReasons entry as plain prose with the interest name naturally embedded in the sentence. Never use bold formatting, brackets, template variables, or placeholder syntax. The interest name must appear as readable English words within the sentence.

GOOD examples:
- "Your love of nature and the outdoors is perfectly matched by Bergen's dramatic fjord trails and mist-wrapped mountain paths"
- "The street food universe of Chandni Chowk maps perfectly to your culinary curiosity"
- "Your passion for arts and nightlife connects directly to Berlin's warehouse club scene and gallery district"

BAD examples (NEVER produce these):
- "Your interest in will be captivated by..."
- "Your love of **Nature & Outdoors** finds its match..."
- "Your appreciation for [interest] connects to..."
- Any sentence where the interest name is missing, blank, wrapped in **, or in brackets
```

**2. Update the JSON example on line 89** to remove `**bold**` formatting from the example values, showing plain prose instead:

```json
"personalMatchReasons": [
  "Your love of historical depth finds its match in Delhi's 7 successive cities, each layered over the last",
  "The street food universe of Chandni Chowk alone — paratha, jalebi, chaat — maps perfectly to your culinary curiosity",
  "Your preference for warm, golden-light evenings aligns with the sunset views from Humayun's Tomb gardens in your travel month"
]
```

**3. Update the user prompt section** (around line 155) — remove the instruction that says "Format: one **bold** key phrase followed by a grammatically complete sentence" and replace with: "Write each reason as a plain prose sentence with the interest name naturally embedded — no bold, no brackets, no placeholders."

This removes conflicting instructions (the system prompt previously asked for `**bold**` formatting while also saying not to leave it blank) and gives the model unambiguous plain-prose examples to follow.

