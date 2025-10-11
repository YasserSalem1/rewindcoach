# RewindCoach

RewindCoach is a Next.js 14 experience that fuses a League of Legends year-in-review with an interactive match coach. Scan your style DNA, browse a compact OP.GG-inspired match list, scrub a Summoner’s Rift timeline, and chat with an AI coach that explains your pivotal plays.

## Features
- **Elegant landing** with vignette hero, glass search card, and quick profile lookup.
- **Profile dashboard** showing playstyle radar, tagged Style DNA, scrollable match history, and highlight stats.
- **Review workspace** pairing a zoomable Rift map, event timeline scrubber, and streaming coach chat.
- **Accessible UI** built with Tailwind CSS, shadcn primitives, framer-motion micro-interactions, and Recharts radar.

## Tech Stack
- Next.js App Router (TypeScript, Server Components)
- Tailwind CSS v4 with custom brand palette
- shadcn/ui primitives (Button, Card, Input, Select, ScrollArea, etc.)
- Recharts for radar visualisation
- Framer Motion for subtle motion
- Edge streaming API route for Bedrock responses

## Getting Started
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Environment Variables
Copy `.env.example` to `.env.local` and fill in production secrets when you are ready to integrate real services.

```
RIOT_API_KEY=
AWS_REGION=
AMPLIFY_ENV=
BEDROCK_MODEL_ID=meta.llama3-8b-instruct-v1:0
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `NEXT_PUBLIC_SITE_URL` is used for SEO metadata generation.

## Scripts
- `npm run dev` – start the Next.js dev server (Turbopack).
- `npm run build` – build for production.
- `npm run start` – run the production server.
- `npm run lint` – run ESLint.

## Core Utilities
- `src/lib/riot.ts` – central types (`RiotMatch`, `TimelineFrame`, `StyleDNA`, etc.) used across the app.
- `src/lib/aws.ts` – placeholder helpers for Amplify environment discovery and Bedrock prompts.
- `src/hooks/useScrubber.ts` – timeline state management with play/pause.
- `src/hooks/useLocalStorage.ts` – persists the last searched Riot ID + region.

## Replacing Assets
Customise the visuals by dropping new files into `public/images/`:
- `logo.png` – displayed in the header and hero.
- `background.png` – subtle vignette behind the landing page.
- `rift.jpg` – Summoner’s Rift texture for the review canvas.

Keep dimensions similar to retain the glow effects (current assets are 256×256, 1280×720, and 1024×1024 respectively).

## Integrating Riot APIs
1. Add your `RIOT_API_KEY` to `.env.local`.
2. Wire your API gateway or serverless functions (e.g. the provided Amazon API) to call the official Riot endpoints:
   - Summoner-V4 for profile lookups.
   - Match-V5 for match list and match/timeline bundles.
3. Cache responses (Redis, Vercel KV, etc.) to respect Riot’s 20/100 request limits.

Types and parsing hints are documented inline so the API wiring stays type-safe.

## Wiring AWS Amplify & Bedrock
- `AWS_REGION`, `AMPLIFY_ENV`, and `BEDROCK_MODEL_ID` seed the helper in `src/lib/aws.ts`.
- Replace `streamMockCoachResponse` with a call to an Amplify function or Lambda that forwards payloads to Bedrock (e.g. `InvokeModel` with `meta.llama3-8b-instruct-v1:0`).
- The edge route at `src/app/api/chat/route.ts` already streams the `ReadableStream` back to the client UI.

## Deployment Notes
- Configure `NEXT_PUBLIC_SITE_URL` with your production domain to maintain canonical metadata.
- Add `ddragon.leagueoflegends.com` to the allowed image domains (already set in `next.config.ts`).
- When deploying to Amplify or Vercel, remember to include the Riot API key and AWS secrets as environment variables.

## Linting & Quality
- TypeScript is set to `strict`.
- ESLint uses the official Next.js config (`npm run lint`).
- When adding data-fetching logic, prefer server components + caching, and cover new helpers with unit tests if the logic grows.

Enjoy rewinding your season! 🎮
