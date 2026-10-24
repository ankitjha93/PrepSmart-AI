# PrepSmart AI 🚀
### Next-Generation AI Technical Mock Interview & Career Acceleration Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Auth_%26_DB-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Ollama](https://img.shields.io/badge/Local_AI-Ollama-white?style=for-the-badge&logo=ollama)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**PrepSmart AI** is a full-stack, enterprise-grade AI technical interview preparation and career acceleration platform. It replaces static question lists with **dynamically synthesized scenario challenges**, **multimodal voice transcription**, **calibrated 5-tier hiring-bar evaluations**, and **AI resume ATS optimization**.

---

## 🌟 Key Features

### 🎯 1. Dynamic Scenario-Based Interview Generation
- **Zero Question Memorization**: Injects session-unique entropy seeds into every generation request so candidates never receive repeated textbook trivia.
- **5 Real-World Engineering Archetypes**:
  - High-severity production incidents, latency spikes & thread pool exhaustion.
  - Scale trade-offs, network partitions & state synchronization.
  - Language & framework runtime internals (memory leaks, heap profiling, event loop).
  - Data consistency, connection pool starvation & race conditions.
  - Architecture migrations & technical debt refactoring under deadline pressure.

### ⚡ 2. Dual-Engine Hybrid AI (Local + Cloud)
- **Local Private Inference (Ollama)**: Automatically connects to local Ollama instances (`llama3.3`, `deepseek-r1:8b`) for zero-cost, private offline operation.
- **Seamless Cloud Failover (Google Gemini)**: Equipped with a 3.5s fast-abort timeout probe. If Ollama is unavailable (e.g., for remote users or on cloud deployments like Vercel), it seamlessly falls back to Google's cutting-edge Gemini models (`gemini-3.5-flash`, `gemini-3.7-flash`).

### 🎙️ 3. Multimodal Voice & Webcam Interview Room
- Full simulation of a real technical interview with live video preview.
- Captures candidate answers via WebRTC audio stream (`audio/webm`).
- Transcribes candidate speech directly with Google Gemini multimodal audio processing with native silence and hallucination filtering.

### 📊 4. Calibrated 5-Tier Evaluation Matrix (1–10 Scale)
- Grades answers like a **Principal Hiring Bar Raiser**:
  - **1 – 2 (Unacceptable)**: Evasive answers (`"i don't know"`, `"pass"`, etc.) or responses under 8 characters receive an instant **1/10** with coaching on foundational problem-solving.
  - **3 – 4 (Superficial)**: Identifies buzzwords lacking technical depth or containing misconceptions.
  - **5 – 6 (Competent Mid)**: Acknowledges correct fundamentals while highlighting missing trade-offs.
  - **7 – 8 (Strong Senior)**: Recognizes concrete architectural mechanics, edge cases, and real-world failure modes.
  - **9 – 10 (Staff/Principal)**: Rewards flawless depth, concurrency constraints, and trade-off mastery.
- Delivers constructive STAR-format feedback outlining exact missing concepts and steps to reach a 10/10 answer.

### 📄 5. AI Resume ATS Scanner & Tailored Questions
- Extracts text from candidate resumes and compares it against target roles and job descriptions.
- Calculates realistic ATS match percentages and surfaces missing critical keywords.
- Highlights candidate projects and automatically generates hyper-specific technical interview questions directly probing the candidate's real work history.

### 🔐 6. Supabase Authentication & PostgreSQL Storage
- Secure user authentication powered by Supabase SSR (`@supabase/ssr` & `@/context/AuthContext.jsx`).
- Full support for email/password sign-in, sign-up, password recovery, and secure sessions.
- Data persistence via Supabase PostgreSQL with custom Drizzle-compatible PostgREST query layer (`utils/db.js`).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide │
│  Supabase AuthContext + WebRTC Audio/Video + Sonner Toast   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       (API Fetch Requests)            (Protected Routes)
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│       Next.js API Layer      │ │   Supabase SSR Middleware   │
│  /api/ollama/* routes        │ │  Session & User Validation  │
│  /api/market-demand          │ └─────────────────────────────┘
│  /api/razorpay               │
└──────────────┬───────────────┘
               │
      ┌────────┴──────────────────────────┐
      ▼                                   ▼
┌───────────────────────────┐ ┌───────────────────────────────┐
│     Local AI Engine       │ │       Cloud AI Engine         │
│  Ollama (127.0.0.1:11434) │ │  Google Gemini API            │
│  Models: llama3.3, r1:8b  │ │  Models: gemini-3.5-flash... │
│  Low latency, zero-cost   │ │  Audio STT, remote fallback   │
└───────────────────────────┘ └───────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Persistence Layer                        │
│   Supabase PostgreSQL (Tables: mockInterview, userAnswer)  │
│   RLS Security Policies + Universal PostgREST Client        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.17 or higher
- [Git](https://git-scm.com/)
- [Supabase Project](https://supabase.com/) (Free tier PostgreSQL & Auth)
- [Google AI Studio API Key](https://aistudio.google.com/) (Free tier Gemini API)
- *(Optional)* [Ollama](https://ollama.ai/) installed locally with `llama3.3` pulled

### 1. Clone the Repository
```bash
git clone https://github.com/ankitjha93/PrepSmart-AI.git
cd PrepSmart-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Duplicate `.env.example` as `.env.local`:

```bash
# 1. Supabase Database & Auth (https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-placeholder
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres

# 2. Ollama Local AI Engine (Optional - https://ollama.com)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.3
NEXT_PUBLIC_OLLAMA_MODEL=llama3.3

# 3. Google Gemini Cloud AI (Free - https://aistudio.google.com)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# 4. Application Settings
NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT=5
NEXT_PUBLIC_QUESTION_NOTE=Click on Record Answer when you want to answer the question. At the end of the interview we will give you the feedback along with correct answer for each question and your answer to compare it.

# 5. Razorpay Payment Gateway (Optional - https://dashboard.razorpay.com)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

### 4. Initialize Database Schema
Run the provided SQL script in your **Supabase Dashboard > SQL Editor**:
- Open [supabase_schema.sql](./supabase_schema.sql) and paste its contents into the SQL Editor.
- Run the query to create `mockInterview`, `userAnswer`, and Row Level Security (RLS) policies.

Alternatively, you can synchronize Drizzle ORM directly:
```bash
npm run db:push
```

### 5. Launch Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using PrepSmart AI.

---

## 📂 Project Directory Structure

```
├── app/
│   ├── (auth)/                # Supabase sign-in, sign-up, reset-password
│   ├── actions/               # Server actions (file uploads, resume parsers)
│   ├── api/
│   │   ├── interview/         # Interview management endpoints
│   │   ├── market-demand/     # Live industry tech stack insights
│   │   ├── ollama/
│   │   │   ├── evaluate/      # 5-tier calibrated evaluation API
│   │   │   ├── generate/      # Dynamic question generation API
│   │   │   ├── resume/        # Resume ATS scanning & questions API
│   │   │   ├── status/        # AI engine diagnostic health API
│   │   │   └── transcribe/    # Multimodal speech-to-text API
│   │   └── razorpay/          # Payment order creation & webhook handlers
│   ├── auth/
│   │   └── callback/          # Supabase auth OAuth/email callback handler
│   ├── dashboard/             # Authenticated user dashboard
│   │   ├── _components/       # AddNewInterview, InterviewList, etc.
│   │   ├── interview/         # Live mock interview & recording room
│   │   ├── resume-scanner/    # ATS scanner & project insights UI
│   │   ├── upgrade/           # Pro plan pricing & subscription portal
│   │   └── page.jsx           # Main user dashboard overview
│   ├── layout.js              # Root application layout with AuthProvider & ThemeProvider
│   └── page.js                # High-conversion public landing page
├── context/
│   └── AuthContext.jsx        # Client-side Supabase Auth state manager
├── utils/
│   ├── cloudAI.js             # Google Gemini Cloud AI service & multimodal STT
│   ├── OllamaAIModal.js       # Client-side AI orchestrator & fallback router
│   ├── db.js                  # Drizzle ORM / PostgREST universal database client
│   ├── schema.js              # Drizzle table definitions
│   └── supabase/              # Supabase browser, server, and middleware clients
├── tests/                     # Playwright E2E integration test suites
├── AGENTS.md                  # Autonomous agent rules & git push habits
├── BRAIN.md                   # Architectural manifesto & engineering knowledge base
├── supabase_schema.sql        # Supabase database schema & RLS definitions
├── drizzle.config.js          # Drizzle Kit migration configuration
└── package.json               # Scripts & dependencies
```

---

## 🧪 Testing

PrepSmart AI includes automated Playwright End-to-End tests:

```bash
# Run all end-to-end tests
npm run test:e2e

# Run tests with interactive browser UI
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

---

## 🤝 Contributing & Guidelines

Contributions are welcome! Please follow these standards:
1. Ensure all commits use `--author="ankitjha93 <93ankitjha@gmail.com>"`.
2. Follow the architectural principles outlined in [`BRAIN.md`](./BRAIN.md).
3. Validate that all tests pass (`npm run test:e2e`) before submitting pull requests.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/ankitjha93"><strong>ankitjha93</strong></a>
</p>
