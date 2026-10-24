# PrepSmart AI 🚀
### Next-Generation AI Technical Mock Interview & Career Acceleration Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Ollama](https://img.shields.io/badge/Local_AI-Ollama-white?style=for-the-badge&logo=ollama)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**PrepSmart AI** is a full-stack, enterprise-grade AI technical interview platform. It transforms standard interview preparation by replacing static question lists with **dynamically synthesized scenario challenges**, **multimodal voice transcription**, **strict 5-tier hiring-bar evaluations**, and **resume ATS optimization**.

---

## 🌟 Key Features

### 🎯 1. Dynamic Scenario-Based Interview Generation
- **Zero Question Memorization**: Injects session-unique entropy seeds into every generation request so candidates never see repeated textbook trivia.
- **5 Real-World Engineering Archetypes**:
  - High-severity production incidents, latency spikes & thread pool exhaustion.
  - Scale trade-offs, network partitions & state synchronization.
  - Language & framework runtime internals (memory leaks, heap profiling, event loop).
  - Data consistency, connection pool starvation & race conditions.
  - Architecture migrations & technical debt refactoring under deadline pressure.

### ⚡ 2. Dual-Engine Hybrid AI (Local + Cloud)
- **Local Private Inference (Ollama)**: Automatically connects to local Ollama instances (`llama3.3`, `deepseek-r1:8b`) for zero-cost, private offline operation.
- **Seamless Cloud Failover (Google Gemini)**: Equipped with a 3.5s fast-abort timeout probe. If Ollama is unavailable (e.g. for remote users or on cloud deployments like Vercel), it seamlessly falls back to Google's cutting-edge Gemini models (`gemini-3.5-flash`, `gemini-3.7-flash`).

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

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide │
│  Clerk Auth + WebRTC Camera/Mic + Sonner Toast Notifications │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       (API Fetch Requests)            (Protected Routes)
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│       Next.js API Layer      │ │       Clerk Middleware      │
│  /api/ollama/* routes        │ │  Session & User Management  │
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
│   Neon PostgreSQL / Supabase + Drizzle ORM                  │
│   Tables: mockInterview, userAnswer                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.17 or higher
- [Git](https://git-scm.com/)
- [PostgreSQL Database](https://neon.tech/) (or Supabase)
- [Google AI Studio API Key](https://aistudio.google.com/) (for Cloud AI & Audio STT)
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
Create a `.env.local` file in the root directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Neon / Supabase PostgreSQL)
NEXT_PUBLIC_DRIZZLE_DB_URL=postgresql://user:password@ep-host.region.neon.tech/neondb?sslmode=require

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Local Ollama AI (Optional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.3
```

### 4. Push Database Schema
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
│   ├── (auth)/                # Clerk sign-in & sign-up pages
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
│   ├── dashboard/             # Authenticated user dashboard
│   │   ├── _components/       # AddNewInterview, InterviewList, etc.
│   │   ├── interview/         # Live mock interview & recording room
│   │   ├── resume-scanner/    # ATS scanner & project insights UI
│   │   ├── upgrade/           # Pro plan pricing & subscription portal
│   │   └── page.jsx           # Main user dashboard overview
│   ├── layout.js              # Root application layout
│   └── page.js                # High-conversion public landing page
├── utils/
│   ├── cloudAI.js             # Google Gemini Cloud AI service & multimodal STT
│   ├── OllamaAIModal.js       # Client-side AI orchestrator & fallback router
│   ├── db.js                  # Drizzle ORM PostgreSQL connection
│   └── schema.js              # Database table definitions
├── tests/                     # Playwright E2E integration test suites
├── AGENTS.md                  # Autonomous agent rules & git push habits
├── BRAIN.md                   # Architectural manifesto & engineering knowledge base
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
