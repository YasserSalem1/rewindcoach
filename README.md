# 🏆 Rewind Coach

> **Your AI-powered League of Legends performance coach — built with AWS and Riot Games API**

---

## 🎯 Inspiration

League of Legends is one of the most complex and competitive games ever made — with tens of thousands of interactions per match and an overwhelming learning curve.  
Players often lose without truly understanding *why*.

Traditional replay tools only show what happened. **Rewind Coach** explains *why* it happened.

We set out to build something that doesn’t just replay your games — it **teaches, interprets, and guides** you like a real coach would.  
Rewind Coach rewinds your matches across the season, analyzes your decisions minute by minute, and helps you turn every mistake into mastery.

---

## 💡 What It Does

Rewind Coach connects directly to the **Riot Games API** to fetch your match history and timeline data across the season.  
It then uses an **AI coaching engine** to turn that raw data into **personalized storytelling, insights, and improvement plans**.

Your AI coach can:

- 🧩 **Explain** what happened — kills, deaths, objectives, and rotations  
- 💬 **Analyze** *why* specific decisions shaped the match outcome  
- 🎯 **Advise** on mechanics, positioning, and macro strategy  
- 📊 **Evaluate** item builds, gold leads, and map control efficiency  

All of this is visualized inside an **interactive web app** that lets you:

- Review season-wide summaries and champion performance  
- Explore **item and rune trends**, **summoner spell usage**, and **gameplay patterns**  
- Chat directly with your **AI coach** for personalized improvement feedback  
- Watch your matches unfold on a **dynamic timeline map replay** with synchronized commentary  

---

## 🪄 Chronicle — Season Insights

Beyond coaching, **Rewind Coach Chronicle** transforms your gameplay data into **memorable insights and fun milestones**.

The Chronicle section highlights:

- 🌟 Your **most-played champions** and roles  
- 💥 **Key moments** — first bloods, clutch steals, comeback wins  
- 📈 Season progression metrics (CS/min, vision score, gold efficiency)  
- 🎮 **Signature playstyle traits** and performance evolution  
- 🏅 Fun personal stats — “Most kills in a single game,” “Most assists,” or “Favorite item builds”  

It’s both **reflective and entertaining** — turning your season into a shareable story that celebrates how far you’ve come.

---

## 🧱 How We Built It

### 🖥️ Frontend

- Built with **Next.js** for a modern, reactive, and seamless UX  
- Deployed via **AWS Amplify Hosting** with automated **CI/CD from GitHub**  
- Distributed globally through **Amazon CloudFront** for low-latency access  

### ⚙️ Backend (Serverless Architecture)

The backend is **100% serverless**, powered by **AWS Lambda** and **Amazon API Gateway**, and composed of three micro-functions:

| Function | Description |
|-----------|--------------|
| 🧩 **Match Summary** | Retrieves and aggregates Riot API match + timeline data |
| 🧠 **Chat Coach** | Orchestrates AI coaching via Amazon Bedrock |
| 🔁 **Request Handler** | Handles CORS, routing, and DynamoDB caching |

This modular design ensures **scalability**, **fault isolation**, and **minimal maintenance overhead**.

---

## 🤖 AI & Knowledge Layer

At the core of Rewind Coach lies an **AI-driven reasoning engine**, combining **Amazon Bedrock** with a **custom Knowledge Base** and **OpenSearch retrieval**.

| Component | Role |
|------------|------|
| 🧠 **Amazon Bedrock (Meta Llama 3)** | Conversational reasoning, narrative generation, and analysis |
| 📚 **Amazon OpenSearch + KB** | Retrieval-augmented grounding for champion data and tactical reasoning |
| 🧾 **Prompt Schema** | Custom format designed to interpret structured Riot match & timeline JSON |

Together, they create a coach that **reasons like an expert** while staying **factually grounded** in match data.

---

## 🗃️ Data Storage & Caching

- **Amazon DynamoDB** – Caches current match states and season summaries for rapid response  
- **Amazon S3** – Stores replays, archived games, and knowledge documents at scale  
- **TTL-based caching** ensures cost efficiency and fast reads  

---

## 🔒 Observability & Security

- **Amazon CloudWatch** – Centralized logs and performance metrics  
- **AWS Secrets Manager** – Secure Riot API key management and rotation  
- **AWS IAM** – Fine-grained permissions for Bedrock, DynamoDB, and OpenSearch  

The entire system is **secure, observable, and fully serverless** — from API calls to AI inference.

---

## ⚙️ Challenges We Faced

- Turning a big vision into an executable, problem-solving product  
- Designing an experience that feels like a **coach**, not just a chatbot  
- Managing **Riot API rate limits** and identifying correct endpoints  
- Handling **LLM token constraints** when processing large timeline data  
- Fine-tuning **Bedrock prompts** for accuracy and strategic clarity  
- Coordinating **Amplify frontend builds** with Lambda backend deployments  
- Structuring **context flow** between DynamoDB cache and Bedrock inputs  

---

## 🏅 Achievements

- ✅ Built a complete end-to-end **AI coaching pipeline**  
- ✅ Created a **timeline visualization** synchronized with AI commentary  
- ✅ Integrated **RAG-based reasoning** using Bedrock + OpenSearch  
- ✅ Designed a **cost-efficient DynamoDB caching layer**  
- ✅ Developed **Chronicle** for fun, data-rich seasonal insights  
- ✅ Delivered real-time, personalized coaching entirely on **serverless AWS**  

---

## 🧠 What We Learned

- How to design **retrieval-augmented systems** mixing structure and reasoning  
- The craft of **prompt engineering** for domain-specific LLMs  
- Best practices for **AWS Bedrock orchestration** and context handling  
- How to turn complex match telemetry into **intuitive storytelling**  
- The value of balancing **factual precision** with **engaging UX**

---

## 🔮 What’s Next

- 🔁 Multi-game performance tracking and cross-match coaching  
- 🗣️ Real-time **voice-based AI coaching**  
- 🧭 Team analytics for synergy, rotations, and macro coordination  
- 🎥 Upload clips or live games for **in-lane tactical feedback**  
- 📊 Launch a **freemium player dashboard** with AWS-powered analytics  

---

## 🛠️ Tech Stack

| Category | Tools & Services |
|-----------|------------------|
| **Frontend** | Next.js · TailwindCSS · Amplify Hosting · CloudFront |
| **Backend** | AWS Lambda · API Gateway · DynamoDB · S3 |
| **AI / ML** | Amazon Bedrock (Meta Llama 3) · OpenSearch · RAG Knowledge Base |
| **DevOps** | Amplify CI/CD · CloudWatch · IAM · Secrets Manager |
| **APIs** | Riot Games API (Match & Timeline) |
