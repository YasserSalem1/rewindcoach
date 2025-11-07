# Rewind Coach

![Rewind Coach logo](./Logo3.png)

Rewind Coach is an AI-powered League of Legends mentor that transforms raw match telemetry into actionable insights, cinematic recaps, and strategic coaching moments.

> <span style="color:#ef4444;font-weight:600;">CHECK testing.md in Documentation to learn how to go through the website with expected results.</span>

## Why Players Use It

- Understand the *why* behind every spike, misplay, and momentum swing.
- Review the last 20 games in the **Match Intelligence Lab** with trendlines and objective control metrics.
- Dive into **match replays** enriched with timeline commentary, map visualisations, and item progressions.
- Celebrate seasonal milestones in the **Chronicle** recap with highlights, records, and style analysis.
- Chat with an AI coach grounded in real match data and champion knowledge.

## Live Experience

- Production site: https://rewind-coach.com  
- Input your Riot ID (name + tagline) to load your profile, launch the Match Lab, spin up match reviews, or trigger the Chronicle rewind.

## Architecture At A Glance

- **Frontend:** Next.js 15, Tailwind CSS, Recharts for momentum visuals, Lucide for iconography.
- **AI & Reasoning:** Amazon Bedrock (Claude 3.5 Sonnet) with retrieval via OpenSearch and curated knowledge bases.
- **Serverless Backend:** AWS Lambda + API Gateway, DynamoDB caching, S3 storage, Secrets Manager for secure keys.
- **Riot Integration:** Match, timeline, and profile endpoints proxied through a rate-limited Lambda layer with automated telemetry enrichment.

## Local Development

1. Install dependencies: `npm install`
2. Create `.env.local` with any required backend URLs or API keys (for example `BACKEND_API_BASE_URL`, `BACKEND_API_KEY`).
3. Launch the dev server: `npm run dev`
4. Open http://localhost:3000 and enter a Riot ID to start the coaching flow.

> Tip: the app expects access to the deployed backend services. If you do not have those endpoints locally, point your env variables at the production API Gateway URL.

Developed by Yasser Salem and Mohamed Moghazy.
