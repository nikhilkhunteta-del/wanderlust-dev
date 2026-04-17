# Wanderlust — Project Briefing

## What this app is
Wanderlust is an experience-first travel recommendation web app. The core philosophy is "start with desire, work backwards to destination" — users describe experiences they want, and the app recommends destinations, not the other way around.

## Tech stack
- React 18 + TypeScript frontend built with Vite + SWC
- UI components: Radix UI / shadcn, Tailwind CSS, Framer Motion animations
- Forms: React Hook Form + Zod validation
- Data: TanStack Query + Supabase (Postgres + Edge Functions)
- Routing: React Router 6
- Maps: Leaflet
- Charts: Recharts
- Icons: Lucide
- Supabase for database, storage, and edge functions
- Gemini/GPT for AI-powered destination recommendations
- Google Places API (New API only — POST to places.googleapis.com/v1/places:searchText with X-Goog-FieldMask header) for city imagery
- Pollinations AI for generated images (always use model=flux, nologo=true, URL-encoded prompts)
- Unsplash for Q1 category card images
- Perplexity for additional research/content
- Amadeus API for flights (planned, not yet implemented)

## Questionnaire flow
The app guides users through 7 questions in this exact order:
- Q1: Interests — multi-select up to 4, with a primary interest picker
- Q2: When & How Long — travel month + trip duration merged into one card
- Q3: Cultural Moments — conditional, filtered by month and interests, skippable
- Q4: Adventure Experiences — conditional, skippable
- Q5: Departure City — text input with geolocation
- Q6: Travel Companions — solo, couple, family, friends, group
- Q7: Novelty Preference — classics → off the beaten path → surprise me
Session persists to localStorage with a 24-hour expiry.

## City detail pages
Each recommended destination has a tabbed detail page with 8 tabs:
- Why Go — personalised highlights matched to user interests
- Weather — conditions for the selected travel month
- Events — seasonal festivals and events
- Flights — flight search from departure city
- Hotels — accommodation options
- Essentials — practical info (transport, visa, currency)
- Buzz — local opinions / word on the street
- Health — conditional, only shown when health risk level is not "low"

## Key rules — never break these
- Flight-time constraint: never recommend a destination where one-way flight exceeds 30% of trip duration
- Google Places API: always use the New API only (POST method), never the old API
- Pollinations: always use model=flux and nologo=true
- Supabase Storage images: uploading directly to an existing path bypasses the edge function — it checks for existing files first
- photoUri values from Google Places are short-lived — must be downloaded to Supabase Storage immediately, never cached directly
- API keys must never appear in the codebase — always use environment variables

## Image standard
Every image in the app must make a user want to travel somewhere. No still lifes, generic stock photos, or "could be anywhere" images. This applies to all category cards, city hero images, cultural moment images, and activity cards.

## Design approach
- Prefer small, single-concern changes over large rewrites
- Verify each change before moving to the next
- After every change, explain what was changed and what to check on the live Vercel URL

## Content data
- Cultural moments stored in culturalMoments.ts, images in Supabase Storage at festivals/[value].png
- Adventure/bucket list activities across 8 categories in a dedicated data file
- Q1 category images stored in Supabase Storage at travel-images/q1-categories/{category}.jpg

## How to work with me
- I have no coding experience — always explain everything in plain English
- Keep changes small and focused — one thing at a time
- After every change, tell me what was changed and what to check on the live Vercel URL
- Challenge assumptions if something seems off — but explain why in simple terms
- Always commit and push changes directly to the main branch — never create separate branches
