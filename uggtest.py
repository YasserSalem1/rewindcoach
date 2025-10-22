#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import argparse

def fetch_matchups(champion: str, rank: str = "diamond_plus", role: str = "mid"):
    url = f"https://u.gg/lol/champions/{champion}/matchups?rank={rank}&role={role}&allChampions=true"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Find all table rows that contain matchup data
    rows = soup.select("table tbody tr")
    matchups = []

    for row in rows:
        cols = [c.get_text(strip=True) for c in row.select("td")]
        if not cols or len(cols) < 8:
            continue

        # Example column layout:
        # Rank | Champion | WinRate | ±Gold@15 | ±XP@15 | ±Kills@15 | ±CS@15 | ±JungleCS@15 | Matches
        m = {
            "rank": cols[0],
            "opponent": cols[1],
            "winRate": cols[2],
            "gold15": cols[3],
            "xp15": cols[4],
            "kills15": cols[5],
            "cs15": cols[6],
            "jungleCS15": cols[7],
            "matches": cols[8] if len(cols) > 8 else None
        }
        matchups.append(m)

    return matchups

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--champion", default="yone")
    parser.add_argument("--rank", default="diamond_plus")
    parser.add_argument("--role", default="mid")
    parser.add_argument("--output", default="ugg_matchups.json")
    args = parser.parse_args()

    print(f"Fetching {args.champion} matchups ({args.rank}, {args.role}) ...")
    matchups = fetch_matchups(args.champion, args.rank, args.role)

    # Print a nice summary table
    for m in matchups:
        print(f"{m['opponent']:12s} | WR {m['winRate']:>6s} | ΔGold15 {m['gold15']:>6s} | "
              f"ΔXP15 {m['xp15']:>6s} | ΔCS15 {m['cs15']:>6s} | Matches {m['matches']}")

    # Save all to file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(matchups, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved {len(matchups)} matchups to {args.output}")

if __name__ == "__main__":
    main()
