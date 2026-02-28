<div align="center">

# 🚀 AutoJob Flow

### The all-in-one AI-powered placement & career automation platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-autojobflow.vercel.app-blue?style=for-the-badge&logo=vercel)](https://autojobflow.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://jobflow-backend-ai.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen?style=for-the-badge&logo=statuspage)]()

> **Stop applying blindly. Start winning intentionally.**  
> AutoJob Flow combines AI, real-time tracking, and smart automation to supercharge your entire placement journey — from resume scoring to cold outreach to DSA prep.

---

![AutoJob Flow Banner](public/main.png)

</div>

---

## 📋 Table of Contents

- [✨ Features Overview](#-features-overview)
- [🖥️ Screenshots](#️-screenshots)
- [🏗️ Tech Stack](#️-tech-stack)
- [🔐 Google OAuth Authentication](#-google-oauth-authentication)
- [📊 Dashboard](#-dashboard)
- [🤖 ATS Scorer](#-ats-scorer)
- [📧 Mass Cold Email Generator](#-mass-cold-email-generator)
- [🎯 Placement Tracker](#-placement-tracker)
- [💻 Coding Tracker](#-coding-tracker)
- [🏆 Real-Time Leaderboard](#-real-time-leaderboard)
- [⚙️ Cron Jobs & 99.9% Uptime](#️-cron-jobs--999-uptime)
- [🚀 Getting Started](#-getting-started)
- [🌐 Environment Variables](#-environment-variables)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)

---

## ✨ Features Overview

| Feature | Description |
|---|---|
| 🔐 **Google OAuth** | Secure one-click sign-in with Google |
| 📊 **Dashboard** | Unified view of your entire job search at a glance |
| 🤖 **ATS Scorer** | AI-powered resume analysis with actionable suggestions |
| 📧 **Cold Email Generator** | Mass personalized cold emails powered by LLaMA 3 |
| 🎯 **Placement Tracker** | Track on-campus & off-campus applications end-to-end |
| 💻 **Coding Tracker** | Log DSA questions with streaks, heatmaps & topic analysis |
| 🏆 **Live Leaderboard** | Real-time competitive coding leaderboard across your cohort |
| ⏰ **99.9% Uptime** | Cron-based keepalive prevents cold starts on free hosting |

---

## 🖥️ Screenshots

<div align="center">

| Dashboard | Placement Tracker |
|:---:|:---:|
| ![Dashboard](public/main.png) | ![Placements](public/place.png) |

| Coding Tracker | Leaderboard |
|:---:|:---:|
| ![Coding](public/coding.png) | ![Leaderboard](public/leader.png) |

| Sign In | ATS + Email |
|:---:|:---:|
| ![Sign In](public/signin.png) | ![Dashboard](public/main.png) |

</div>

---

## 🏗️ Tech Stack

### Frontend
```
React 18 + TypeScript        → UI framework
Vite 5 (Babel plugin)        → Build tool (fast, no SWC TDZ bugs)
Tailwind CSS                 → Utility-first styling
shadcn/ui                    → Accessible component library
React Router v6              → Client-side routing
TanStack Query               → Server state management
Lucide React                 → Icon system
```

### Backend
```
Node.js + Express            → REST API server
MongoDB + Mongoose           → Primary database
GridFS                       → PDF resume storage
Passport.js                  → Google OAuth 2.0 strategy
express-session              → Session management
Multer                       → File upload middleware
node-cron                    → Scheduled keepalive jobs
```

### AI / External APIs
```
Groq (LLaMA 3.1 8B)         → ATS scoring + cold email generation
Google OAuth 2.0             → Authentication
Gmail API                    → Email integration
```

### Deployment
```
Vercel                       → Frontend hosting (global CDN)
Render                       → Backend hosting
MongoDB Atlas                → Cloud database
```

---

## 🔐 Google OAuth Authentication

AutoJob Flow uses **Google OAuth 2.0** via Passport.js for secure, passwordless authentication.

### How it works

```
User clicks "Sign in with Google"
        ↓
Redirected to Google consent screen
        ↓
Google returns OAuth token to /auth/google/callback
        ↓
Passport.js validates token & creates/fetches user
        ↓
Session cookie set (httpOnly, secure, sameSite: none)
        ↓
User redirected to /dashboard
```

### Session Architecture
- Sessions stored server-side with `express-session`
- Cookie is `httpOnly` + `secure` + `sameSite: none` for cross-origin support (Vercel → Render)
- Auth status checked on every app load via `/auth/status`
- Clean logout via `/auth/logout` which destroys the session

---

## 📊 Dashboard

The dashboard is your **mission control** — a single-screen summary of everything happening in your job search.

### What you see at a glance
- **Application pipeline** — total applied, in screening, interviews, offers, rejections
- **ATS Score** — your latest resume score with improvement tips
- **Coding streak** — consecutive days solved
- **Leaderboard rank** — where you stand vs your cohort
- **Recent activity** — latest applications and coding entries

### Smart features
- Pulls live data from all modules simultaneously
- Color-coded status badges for quick scanning
- Fully responsive — works on mobile during commutes

---

## 🤖 ATS Scorer

Upload your resume PDF and get an **instant AI-powered ATS analysis** in seconds.

### How it works

```
User uploads PDF resume
        ↓
pdf-parse extracts raw text
        ↓
Text cleaned & normalized (removes non-ASCII, collapses whitespace)
        ↓
First 4000 chars sent to Groq (LLaMA 3.1 8B Instant)
        ↓
AI returns structured JSON:
{
  "score": 78,
  "summary": "Strong technical profile but weak action verbs...",
  "suggestions": ["Add quantified achievements", "Include keywords: Docker, CI/CD"],
  "detected_skills": ["React", "Node.js", "MongoDB", "Python"]
}
        ↓
Score + suggestions rendered in dashboard
```

### Scoring breakdown
| Score Range | Rating | Meaning |
|---|---|---|
| 85–100 | 🟢 Excellent | ATS will likely pass your resume |
| 70–84 | 🟡 Good | Minor improvements needed |
| 50–69 | 🟠 Fair | Significant gaps to address |
| 0–49 | 🔴 Poor | Major restructuring recommended |

### What the AI checks
- ✅ Keyword density & relevance
- ✅ Action verb usage
- ✅ Quantified achievements
- ✅ Skills section completeness
- ✅ Format & readability
- ✅ ATS-unfriendly elements (tables, graphics)

---

## 📧 Mass Cold Email Generator

Generate **personalized cold emails** for multiple contacts in one click — powered by LLaMA 3.

### Workflow

```
Enter your name + paste contact list (name, company, role, email)
        ↓
System prompt instructs LLaMA 3.1 to write personalized emails
        ↓
Each email customized with contact's company, role & context
        ↓
Emails returned as structured JSON array
        ↓
One-click copy for each email
```

### Example output
```
Subject: Quick question about engineering at Stripe

Hi Sarah,

I came across your work on Stripe's payment infrastructure team
and was genuinely impressed by the scalability challenges you've
solved. I'm a final-year CS student with experience in distributed
systems and would love to learn more about how your team approaches...
```

### Why it's better than templates
- Each email references the **specific company and role**
- Natural, non-robotic tone tuned for tech recruiting
- Generates 10–50 emails in under 10 seconds
- No rate limits on Groq's free tier for reasonable batches

---

## 🎯 Placement Tracker

A complete **application lifecycle manager** for both on-campus and off-campus opportunities.

### Off-Campus Tracker

Track every job you apply to externally across LinkedIn, Naukri, Indeed, and direct applications.

**Fields tracked:**
- Company, Job Title, Job Link
- Applied Date, Status Updated Date
- Salary (with currency — defaults INR)
- Source (LinkedIn / Indeed / Naukri / Direct / Other)
- Status pipeline: `Applied → Screening → Interview → Offer → Accepted / Rejected`
- Follow-up dates & personal notes

**Status pipeline visualization:**
```
Applied ──► Screening ──► Interview ──► Offer ──► Accepted
                                  │
                                  └──► Rejected
```

### On-Campus Tracker

Designed specifically for campus placement drives with college-specific stages.

**Status pipeline:**
```
Applied ──► Shortlisted ──► Interview Round 1 ──► Round 2 ──► Round 3 ──► Offer
                      │
                      └──► Rejected
```

**Additional fields:**
- Number of interview rounds completed
- Offer package (LPA)
- Offer location

### Company Drive Logger

Log entire campus drives with aggregate data:
- Roles offered, cutoff CGPA
- Batch date & results date
- Average package, number selected, total applied

### Analytics
- Off-campus vs on-campus breakdown
- Source effectiveness (which platform gives most interviews)
- Status distribution charts
- Profile completeness tracker

---

## 💻 Coding Tracker

A **DSA progress tracker** built for serious placement preparation.

### Core features

#### 📝 Question Logger
Log every problem you solve with:
- Platform (LeetCode / Codeforces / CodeChef / HackerRank / Other)
- Difficulty (Easy / Medium / Hard)
- Topic (Arrays, DP, Graphs, Trees... 20 categories)
- Time taken (minutes)
- Question link
- Personal notes (approach, mistakes, key insight)
- ⭐ Star for revision

#### 🔥 Streak Heatmap
GitHub-style contribution heatmap showing your last 15 weeks of activity. Color intensity = problems solved that day.

```
Less ░░▒▒▓█ More
     ↑ 105 days of history
```

#### 📊 Topic Breakdown
Bar chart showing questions solved per topic with Easy/Medium/Hard split — instantly reveals weak areas.

#### 🏷️ Platform Profiles
Connect your usernames across platforms and track:
- Total problems solved per platform
- Rating (for Codeforces/CodeChef)
- Last updated timestamp

#### 🔍 Smart Filters
Filter your question log by platform, difficulty, topic, or keyword search — find that DP problem you solved 3 weeks ago instantly.

### Stats tracked
| Metric | Description |
|---|---|
| Total Solved | All-time question count |
| Current Streak | Consecutive days with ≥1 solve |
| This Week | Problems solved in last 7 days |
| This Month | Problems solved in last 30 days |
| Topics Covered | Unique topic count |
| Starred | Questions marked for revision |

---

## 🏆 Real-Time Leaderboard

A **live competitive leaderboard** that ranks users across the platform by coding activity.

### How rankings work

```
Score = (Total Solved × 10) + (Hard × 5) + (Medium × 2) + (Streak × 3) + (Starred × 1)
```

Rankings update in real-time as users log new questions — creating healthy competition within your cohort or friend group.

### Leaderboard columns
- **Rank** — current position (with 🥇🥈🥉 for top 3)
- **User** — name/email with avatar initial
- **Total Solved** — all-time problem count
- **Streak** — current daily streak
- **Easy / Medium / Hard** — difficulty breakdown
- **Score** — weighted composite score

### Concept & motivation

The leaderboard solves a core problem in placement prep: **isolation**. When you can see your peers grinding, it creates accountability. Key design decisions:

- **Shared data** — everyone sees the same leaderboard (not private)
- **Score weighting** — hard problems worth more, encouraging quality over quantity
- **Streak bonus** — rewards consistency, not just volume
- **No gatekeeping** — anyone on the platform appears automatically once they log their first question

---

## ⚙️ Cron Jobs & 99.9% Uptime

AutoJob Flow runs on **Render's free tier**, which spins down after 15 minutes of inactivity — causing 30–60 second cold starts. The keepalive system eliminates this.

### Architecture

```javascript
// cron/keepalive.js
cron.schedule('*/10 * * * *', async () => {
  // Pings /health every 10 minutes
  // Keeps the Render dyno warm 24/7
  await ping(`${SELF_URL}/health`);
});
```

### How it works

```
Server starts
      ↓
initKeepalive() called
      ↓
node-cron schedules ping every 10 minutes
      ↓
Every 10 min: GET /health → 200 OK
      ↓
Render sees activity → does NOT spin down
      ↓
Result: <1s response times, 99.9% uptime
```

### Uptime math
- Render free tier spins down after **15 min** of inactivity
- We ping every **10 min** — always before the 15 min window
- Cold start eliminated → effectively **continuous uptime**

### Health endpoint response
```json
{
  "status": "running",
  "timestamp": "2026-03-01T00:00:00.000Z",
  "uptime": 86400,
  "mongodb": "connected"
}
```

### Job Scraper Cron
A separate cron (`jobScraper.cron.js`) runs on a schedule to scrape and refresh job listings for the Job Monitor feature — keeping opportunities fresh without manual intervention.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Cloud Console project (for OAuth)
- Groq API key (free at console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/job-flow-ai-automator.git
cd job-flow-ai-automator
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Set up environment variables

```bash
# Frontend (.env)
cp .env.example .env

# Backend (server/.env)
cp server/.env.example server/.env
```

### 5. Run locally

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Frontend: http://localhost:8080  
Backend: http://localhost:3001

---

## 🌐 Environment Variables

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3001
```

### Backend `server/.env`
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autojobflow

# Session
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://jobflow-backend-ai.onrender.com/auth/google/callback

# AI
GROQ_API_KEY=gsk_your-groq-api-key

# Keepalive
SELF_URL=https://jobflow-backend-ai.onrender.com

# App
PORT=3001
NODE_ENV=production
```

---

## 📁 Project Structure

```
job-flow-ai-automator/
├── public/                     # Static assets & screenshots
│   ├── main.png
│   ├── signin.png
│   ├── place.png
│   ├── coding.png
│   └── leader.png
│
├── src/
│   ├── components/
│   │   ├── Navigation.tsx      # Top nav with auth state
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── pages/
│   │   ├── Index.tsx           # Landing page
│   │   ├── SignIn.tsx          # Google OAuth sign-in
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Placements.tsx      # Placement tracker
│   │   ├── Jobs.tsx            # Job monitor
│   │   ├── Coding.tsx          # Coding tracker
│   │   └── Leaderboard.tsx     # Live leaderboard
│   │
│   └── App.tsx                 # Root with routing + auth
│
├── server/
│   ├── routes/
│   │   ├── auth.js             # Google OAuth routes
│   │   ├── coding.js           # Coding entries + profiles
│   │   ├── leaderboard.js      # Leaderboard data
│   │   ├── jobs.js             # Job listings
│   │   ├── companies.js        # Company data
│   │   ├── gmail.js            # Gmail integration
│   │   ├── api.js              # General API
│   │   └── chatbot.js          # AI chatbot
│   │
│   ├── models/
│   │   └── Profile.js          # User profile schema
│   │
│   ├── cron/
│   │   ├── keepalive.js        # 10-min uptime pinger
│   │   └── jobScraper.cron.js  # Job listing refresher
│   │
│   └── server.js               # Express app entry point
│
├── vite.config.ts              # Vite build config (Babel)
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m 'feat: add amazing feature'

# 4. Push to the branch
git push origin feature/amazing-feature

# 5. Open a Pull Request
```

### Commit convention
```
feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting, no logic change
refactor: code restructure
chore:    build process or tooling
```

---

<div align="center">

Built with ❤️ for students grinding through placement season.

**[Live Demo](https://autojobflow.vercel.app)** · **[Report Bug](https://github.com/yourusername/job-flow-ai-automator/issues)** · **[Request Feature](https://github.com/yourusername/job-flow-ai-automator/issues)**

⭐ Star this repo if it helped you land your dream job!

</div>