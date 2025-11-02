# Rewind Coach

> **Your AI-powered League of Legends performance coach — built with AWS and Riot Games API**

---

## Inspiration

League of Legends is one of the most complex and competitive games ever made — with thousands of interactions per match and an overwhelming learning curve. Players must constantly track information such as champions, abilities, items, gold leads, objectives, and jungle pathing.  

Most players lose without fully understanding *why*.  

Traditional replay tools only show what happened. **Rewind Coach** explains *why* it happened.  

We set out to build a tool that doesn’t just replay your games, but truly **teaches, interprets, and guides** you like a real coach.  
Rewind Coach rewinds your matches across the season, analyzes your decisions minute by minute, and helps you turn every mistake into mastery.

---

## What It Does

Rewind Coach connects directly to the **Riot Games API** to fetch match history and timeline data.  
It then uses an **AI coaching engine** to transform this raw telemetry into **personalized insights and improvement plans**.

Your AI coach can:

- Explain key events such as kills, deaths, objectives, and rotations  
- Analyze why specific decisions influenced match outcomes  
- Advise on mechanics, positioning, and macro strategy  
- Evaluate item builds, gold spikes, and map control efficiency  

All insights are displayed in an **interactive web application** where players can:

- Review individual match breakdowns and season summaries  
- Explore champion, item, and rune trends  
- Chat directly with their AI coach for tailored feedback  
- Replay matches on a **minute-by-minute timeline** with synchronized analysis  

---

## Chronicle — Season Rewind

The **Chronicle** section turns gameplay data into a personal story of growth and achievement.  

It highlights:

- Most-played champions and preferred roles  
- Defining moments such as first bloods, objective steals, and comeback wins  
- Season progression metrics like CS per minute, vision score, and gold efficiency  
- Signature playstyle traits and long-term improvement  
- Fun personal records such as highest kills, assists, or favorite item builds  

Chronicle combines reflection and entertainment — celebrating progress while revealing opportunities for improvement.

---

## How We Built It

### Frontend

- Developed with **Next.js** for a modern and reactive user experience  
- Deployed through **AWS Amplify Hosting** with automated CI/CD from GitHub  
- Distributed globally using **Amazon CloudFront** for low-latency performance  

### Backend (Serverless Architecture)

The backend is fully serverless, built on **AWS Lambda** and **Amazon API Gateway**, and structured into three modular functions:

| Function | Description |
|-----------|--------------|
| **Match Summary** | Retrieves and aggregates Riot API match and timeline data |
| **Chat Coach** | Orchestrates AI coaching and reasoning via Amazon Bedrock |
| **Request Handler** | Manages routing, caching, and client responses |

This architecture ensures scalability, fault isolation, and minimal maintenance overhead.

---

## AI & Knowledge Layer

At the core of Rewind Coach lies an **AI reasoning engine** powered by **Amazon Bedrock**, **OpenSearch**, and a **custom Knowledge Base**.

| Component | Role |
|------------|------|
| **Amazon Bedrock (Claude Sonnet 3.5)** | Generates coaching dialogue, explanations, and personalized analysis |
| **Amazon OpenSearch + Knowledge Base** | Enables retrieval-augmented grounding with champion data and tactical insights |
| **Prompt Schema** | Custom structured input format that interprets Riot match and timeline JSON |

This setup allows the coach to reason like an expert while remaining factually anchored to real match data.

---

## Data Storage & Caching

- **Amazon DynamoDB** caches match summaries and player profiles for fast response times.  
- **Amazon S3** stores replays, historical data, and knowledge documents.  
- TTL-based caching ensures cost efficiency and responsive user interactions.  

---

## Observability & Security

- **Amazon CloudWatch** monitors Lambda performance and logs API activity.  
- **AWS Secrets Manager** secures Riot API keys and sensitive credentials.  
- **AWS IAM** enforces fine-grained permissions across Bedrock, DynamoDB, and OpenSearch.  

The system is secure, observable, and entirely serverless — from data ingestion to AI reasoning.

---

## Challenges

- Translating a large vision into a practical, reliable product  
- Designing an AI that feels like a coach, not a chatbot  
- Managing Riot API rate limits and handling large timeline datasets  
- Controlling LLM token usage without losing analytical depth  
- Engineering effective Bedrock prompts for accurate strategic output  
- Coordinating Amplify frontend deployments with Lambda backend updates  
- Structuring context flow between DynamoDB cache and Bedrock inputs  

---

## Achievements

- Built a complete end-to-end AI coaching pipeline  
- Developed dynamic timeline visualization synchronized with AI commentary  
- Implemented retrieval-augmented reasoning with Bedrock and OpenSearch  
- Designed a cost-efficient DynamoDB caching system  
- Created the Chronicle feature for season-wide insights  
- Delivered real-time, personalized coaching on a fully serverless AWS stack  

---

## What We Learned

- How to design retrieval-augmented systems combining structured and unstructured data  
- The principles of domain-specific prompt engineering for gaming analytics  
- Best practices for orchestrating AWS Bedrock in real-time applications  
- Techniques to translate match telemetry into human-readable narratives  
- The importance of balancing factual precision with engaging user experience  

---

## What’s Next

- Multi-game performance tracking and cross-match analysis  
- Real-time, voice-enabled AI coaching  
- Team analytics for coordination and macro strategy  
- Player-submitted clips for live tactical feedback  
- Launch of a freemium analytics dashboard powered by AWS  

---

## Tech Stack

| Category | Tools & Services |
|-----------|------------------|
| **Frontend** | Next.js · TailwindCSS · Amplify Hosting · CloudFront |
| **Backend** | AWS Lambda · API Gateway · DynamoDB · S3 |
| **AI / ML** | Amazon Bedrock (Claude Sonnet 3.5) · OpenSearch · Custom Knowledge Base |
| **DevOps** | Amplify CI/CD · CloudWatch · IAM · Secrets Manager |
| **APIs** | Riot Games API (Match & Timeline Endpoints) |
