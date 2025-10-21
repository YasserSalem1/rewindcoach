import { cache } from "react";

const COACH_MATCH_API =
  process.env.COACH_MATCH_API ??
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach_match";

const COACH_MATCH_API_KEY =
  process.env.COACH_MATCH_API_KEY ?? process.env.CHAT_API_KEY;

/**
 * Fetches the raw coach_match review output for a specific match.
 * Returns null if the request fails or is unavailable.
 */
export const fetchCoachReview = cache(async (matchId: string): Promise<string | null> => {
  if (!matchId) return null;

  try {
    const url = new URL(COACH_MATCH_API);
    url.searchParams.set("matchId", matchId);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "text/plain; charset=utf-8",
        ...(COACH_MATCH_API_KEY ? { "x-api-key": COACH_MATCH_API_KEY } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const sample = await response.text().catch(() => "");
      console.warn(
        `[coach] Failed to fetch review output for ${matchId} (${response.status}): ${sample.slice(0, 120)}`,
      );
      return null;
    }

    const text = await response.text();
    return text.trim().length ? text : null;
  } catch (error) {
    console.warn("[coach] Review fetch error", error);
    return null;
  }
});
