# 🧪 Testing Guide — Rewind Coach

> **Disclaimer**  
> Loading time may vary depending on Riot API rate limits.  
> The Riot API allows:  
> - ⏳ **20 requests per second**  
> - ⏱️ **100 requests per 2 minutes**  
>
> Please allow a few extra seconds when testing pages that fetch live match data.
>
> <span style="color:#f87171;font-weight:600;">When Generating Chronocile - Season Rewind, USING other functionalities of the webapp may cause it to crash.</span>

---

## Accessing the App

**Website:** [https://rewind-coach.com](https://rewind-coach.com)

1. When you open the site, you’ll be prompted to **enter your Riot region**, **Riot ID**, and **tagline** (for example: `YasserSalem#RANK`  `moghazy99#6194`).  
2. After submission, the system retrieves your profile data and loads the **Profile Overview** page.

---

## Profile Overview (Landing Page)

Once the data loads, you’ll see the **main dashboard** divided into three sections:

1. **Account Overview** – Displays summoner info, rank, and basic performance stats.  
2. **Playstyle Radar Chart** – Visualizes the player’s tendencies (aggressive, farming, objective control, etc.).  
3. **Match History** – Lists the most recent matches, each with a **“Review Match”** button.

---

## Use Case 1 — Match Review

### Description  
Detailed analysis of a single match — showing events, stats, and insights minute-by-minute.

### How to Test
1. From your **Profile Overview**, scroll to **Recent Matches**.  
2. Click **“Review Match”** on any game.  
3. Wait for data to load (depending on Riot API).

### Expected Results
- A full **Match Review Page** appears showing:
  - **Minute-by-minute stats** (Items, CS, Levels, Objectives).  
  - **Dynamic Summoner’s Rift Map** updating champion positions each minute.  
  - **Chatbot Section** where you can ask context-aware questions like:
    - “Why did I die here?”  
    - “When did I fall behind in gold?”  
    - “Who carried this game?”  

The chatbot understands match data, events, and gold flow — acting like a real coach that explains *why* things happened. ( check the MatchReviewOutput file to check what exactlly is fed to the chatbot )

---

## Use Case 2 — 20 Match Lab

### Description  
This page acts as a **Time Machine**, taking you **20 matches back in time** to reveal patterns, momentum shifts, and performance evolution.

### How to Test
1. From the top navigation bar or main dashboard, click **“20 Match Lab.”**  
2. Allow time for data aggregation.

### xpected Results
- Overview of your last 20 matches including:
  - Best and worst performances  
  - Average KDA and win rate  
  - Trends in champion usage and consistency  
  - Momentum chart showing performance over time  

**Purpose:** Understand long-term strengths, weaknesses, and improvement areas.

---

## Use Case 3 — Chronicle (Season Rewind)

### Description  
Turns your entire season into a **personalized story** highlighting achievements, playstyle, and milestones.

### How to Test
1. Click **“Chronicle”** or **“Season Rewind.”**  
2. Wait for the full season data to load.

### xpected Results
The page will display **four main sections**:

1. **Season Overview** – Total games, win rate, takedowns, KDA, and unique champions played.  
2. **Top Champions** – Breakdown of top 3 champions with stats like multi-kills, ability casts, damage dealt, and matches played.  
3. **Summoner Spells** – Most-used spells and frequency, revealing your preferred playstyle.  
4. **Season Summary** –  
   - Frequent teammates  
   - Longest/shortest matches  
   - Total CS  
   - Highest kills, assists, and item purchases  

Each section is **sharable**, allowing users to showcase their season stats and milestones.

---

## Notes for Judges

- The **first load** may take **10–20 seconds** due to live data fetching from the Riot API.  
- Use **public summoner names** for more consistent test results (e.g., known players).  
- If the rate limit is reached, the app will automatically retry; refreshing after ~30–60 seconds helps.  
- Optimized for **Chrome** and **Edge** on desktop.
- <span style="color:#f87171;font-weight:600;">When Generating Chronocile - Season Rewind, USING other functionalities of the webapp may cause it to crash.</span>

---

## ummary

| Feature | Description | Testing Focus |
|----------|--------------|----------------|
| **Match Review** | Detailed replay of one match | Data depth, interactive map, chatbot accuracy |
| **20 Match Lab** | Aggregated data from last 20 games | Performance trends and insights |
| **Chronicle – Season Rewind** | Season-long recap and story | Visual storytelling and stats summary |

---
