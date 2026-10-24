# PrepSmart AI — Repository Brain & Architectural Manifesto

Welcome to the central knowledge repository for **PrepSmart AI**. This document acts as the definitive system architecture, data flow specification, and operational guide for engineers, agents, and contributors working on this codebase.

---

## 1. System Vision & Product Mission

**PrepSmart AI** is an intelligent technical career acceleration platform designed to provide candidates with high-stakes mock interviews, instant speech-to-text audio feedback, resume ATS optimization, and actionable hiring-bar evaluations.

### Key Capabilities
- **Dynamic Scenario Generation**: Synthesizes fresh, non-repetitive technical questions tailored to specific roles, tech stacks, and seniority levels without relying on static question banks.
- **Dual-Engine Hybrid AI**: Prioritizes local, zero-cost private inference via Ollama (`llama3.3`, `deepseek-r1:8b`) and seamlessly falls back to Google Gemini Cloud (`gemini-3.5-flash`, `gemini-3.7-flash`) for remote users, cloud deployments, and multimodal speech-to-text transcription.
- **Multimodal Voice Interviewing**: Records audio/video in real-time in the browser and transcribes spoken responses with Gemini multimodal audio processing.
- **Strict 5-Tier Evaluation Rubric**: Employs Principal Hiring Bar Raiser standards (1–10 scale) with instant evasive-answer filtering and constructive STAR-framework coaching.
- **Resume ATS Scanner**: Evaluates resume text against job descriptions, computes match percentages, extracts project highlights, and generates tailored behavioral/technical interview questions.
- **Secure Supabase Infrastructure**: Uses Supabase SSR for session/auth handling, PostgreSQL persistence, and Row Level Security.

---

## 2. Technology Stack & Topology

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

| Layer | Technologies |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | Modern JavaScript (ES Modules, JSX) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/), `tailwind-merge`, `tailwindcss-animate` |
| **UI Components** | Radix UI primitives (`dialog`, `collapsible`, `slot`), Lucide Icons |
| **Authentication** | [Supabase Auth](https://supabase.com/) (`@supabase/ssr`, `context/AuthContext.jsx`) |
| **Database & ORM** | [Supabase PostgreSQL](https://supabase.com/), [Drizzle ORM](https://orm.drizzle.team/), `utils/db.js` PostgREST client |
| **Speech & Audio** | Browser MediaRecorder (`audio/webm`), Google Gemini Multimodal Audio STT |
| **Testing** | [Playwright](https://playwright.dev/) End-to-End Test Suite |

---

## 3. Dual-Engine Hybrid AI Architecture

To support both **local power users** (who run local LLMs offline at zero cost) and **remote web users** (deployed on Vercel where local Ollama is unreachable), the platform implements an autonomous Dual-Engine routing system.

### Engine Routing Lifecycle
```mermaid
flowchart TD
    A[Client Request: Question / Evaluation] --> B{Ollama Local Available?}
    B -- Yes (Probe <= 3.5s) --> C[Execute via Ollama llama3.3]
    B -- No / Offline / Abort --> D{Gemini API Key Configured?}
    D -- Yes --> E[Execute via Gemini Cloud gemini-3.5-flash]
    D -- No / Exhausted --> F[Execute via Calibrated Heuristic Fallback]
    C --> G[Return Structured JSON]
    E --> G
    F --> G
```

1. **Fast Timeout Probing (3.5s)**:
   - When an API route requests Ollama, an `AbortController` terminates the local probe after 3500ms. If Ollama is not running locally, remote users do not experience long connection timeouts.
2. **Cloud AI Auto-Failover (`utils/cloudAI.js`)**:
   - Maintains an ordered list of modern, active Gemini models:
     `gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-flash-latest`, `gemini-3.8-flash`.
   - Filters out unconfigured placeholder strings (e.g. `your-gemini-api-key-here`) and accepts valid Google Generative Language keys.
3. **Multimodal Audio Processing**:
   - Spoken answers are captured via WebRTC, converted to base64 `audio/webm`, and sent to `/api/ollama/transcribe`.
   - Gemini transcribes the audio buffer natively with silence-hallucination suppression.

---

## 4. Core Features & Algorithms

### 4.1 Dynamic Question Generation
- **Entropy Ingestion**: Every generation request receives an entropy seed (`${Date.now()}-${uuidv4().slice(0, 8)}`).
- **Scenario Archetypes**: Prompt rotates across 5 distinct engineering scenarios:
  1. High-severity production incidents, latency spikes & thread pool exhaustion.
  2. Scale trade-offs, network partitions & state synchronization.
  3. Language & framework runtime internals (memory leaks, heap profiling, event loop).
  4. Data consistency, connection pool starvation & race conditions.
  5. Architecture migrations & technical debt refactoring under deadline pressure.
- **Anti-Trivia Constraint**: Explicitly bans textbook "What is X?" questions in favor of real-world engineering challenges.

### 4.2 Calibrated 5-Tier Evaluation Matrix
Evaluations grade candidate answers on an objective 1–10 scale:

| Score Band | Classification | Criteria |
|---|---|---|
| **1 – 2** | *Unacceptable* | Irrelevant, trivial, or evasive responses (`"i don't know"`, `"pass"`, etc.). Caught by instant-validator. |
| **3 – 4** | *Superficial* | Buzzword-heavy, lacks concrete technical explanation or shows misconceptions. |
| **5 – 6** | *Competent Mid* | Explains fundamental concepts correctly, but omits trade-offs, memory impact, or edge cases. |
| **7 – 8** | *Strong Senior* | Accurate mechanics, clear architectural trade-offs, and practical failure modes. |
| **9 – 10** | *Staff/Principal* | Flawless technical depth, concurrency/memory constraints, and deep system mastery. |

### 4.3 Instant Evasive-Answer Validator
- Submissions matching `/\b(i don't know|no idea|no clue|dunno|not sure|pass|skip)\b/i` or under 8 characters immediately receive:
  - **Rating**: `1`
  - **Feedback**: Constructive coaching advising the candidate how to structure an answer around foundational principles even when the exact solution is unknown.

---

## 5. Directory & File Structure

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
│   ├── schema.js              # Database table definitions
│   └── supabase/              # Supabase browser, server, and middleware clients
├── tests/                     # Playwright E2E integration test suites
├── AGENTS.md                  # Autonomous agent rules & git push habits
├── BRAIN.md                   # Architectural manifesto & engineering knowledge base
├── supabase_schema.sql        # Supabase database schema & RLS definitions
├── drizzle.config.js          # Drizzle Kit migration configuration
└── package.json               # Scripts & dependencies
```

---

## 6. Database Schema & Data Models

### Table: `mockInterview`
Stores generated interview sessions.
- `id`: Serial primary key.
- `mockId`: Unique UUID referencing the session.
- `jsonMockResp`: JSON array of questions and expected benchmark answers.
- `jobPosition`: Target job title (e.g. *Staff Full Stack Engineer*).
- `jobDesc`: Tech stack keywords and job description context.
- `jobExperience`: Years of required experience.
- `createdBy`: User email from Supabase Auth session.
- `createdAt`: Timestamp string.

### Table: `userAnswer`
Stores user responses and grading metrics.
- `id`: Serial primary key.
- `mockIdRef` / `mockId`: Foreign identifier matching `mockInterview.mockId`.
- `question`: The specific interview question presented.
- `correctAns`: Ideal benchmark answer generated by AI.
- `userAns`: Candidate's transcribed or submitted response.
- `feedback`: AI-generated constructive critique and improvement steps.
- `rating`: Calibrated score (1 to 10).
- `userEmail`: User email from Supabase Auth session.
- `createdAt`: Timestamp string.

---

## 7. Environment Variables Configuration

Create a `.env.local` file by copying from `.env.example`:

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

---

## 8. Git Workflow Invariants (Mandatory)

All developers and automated agents must adhere to the rules defined in [`AGENTS.md`](file:///c:/Users/ankij/OneDrive/Desktop/PrepSmart%20AI%20Project/AGENTS.md):

1. **Commit Author Attribution**:
   - Always commit with `--author="ankitjha93 <93ankitjha@gmail.com>"`.
2. **Autonomous Remote Push**:
   - Immediately after completing any commit, run `git push origin <branch>` without waiting for user instruction.
3. **Pre-Push Validation**:
   - Ensure the working tree is clean and builds/tests pass before pushing.
