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

---

## 2. Technology Stack & Topology

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

| Layer | Technologies |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | Modern JavaScript (ES Modules, JSX) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/), `tailwind-merge`, `tailwindcss-animate` |
| **UI Components** | Radix UI primitives (`dialog`, `collapsible`, `slot`), Lucide Icons |
| **Authentication** | [Clerk](https://clerk.com/) (`@clerk/nextjs`) |
| **Database & ORM** | PostgreSQL ([Neon Serverless](https://neon.tech/) / [Supabase](https://supabase.com/)), [Drizzle ORM](https://orm.drizzle.team/) |
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
  1. High-severity production latency spikes and telemetry diagnosis.
  2. Scale trade-offs, network partitions, and state synchronization.
  3. Language runtime internals (event loop, heap profiling, memory leaks).
  4. Data consistency, connection pool exhaustion, and race conditions.
  5. Architecture refactoring and technical migration trade-offs.
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
│   ├── (auth)/                # Clerk sign-in / sign-up routes
│   ├── actions/               # Server actions (resume upload, etc.)
│   ├── api/
│   │   ├── interview/         # Interview management endpoints
│   │   ├── market-demand/     # Real-time job market tech insights
│   │   ├── ollama/
│   │   │   ├── evaluate/      # 5-tier answer evaluation route
│   │   │   ├── generate/      # Dynamic question generation route
│   │   │   ├── resume/        # Resume ATS scanning route
│   │   │   ├── status/        # AI engine health check route
│   │   │   └── transcribe/    # Multimodal speech-to-text route
│   │   └── razorpay/          # Payment verification & subscription tiers
│   ├── dashboard/             # Core authenticated app portal
│   │   ├── _components/       # AddNewInterview, InterviewList, etc.
│   │   ├── interview/         # Mock interview recording & feedback UI
│   │   ├── resume-scanner/    # ATS analyzer interface
│   │   ├── upgrade/           # Pro plan pricing & payments
│   │   └── page.jsx           # Main user dashboard
│   ├── layout.js              # Root application layout with ClerkProvider
│   └── page.js                # High-conversion public landing page
├── utils/
│   ├── cloudAI.js             # Google Gemini Cloud AI service & STT
│   ├── OllamaAIModal.js       # Client-side AI service orchestrator
│   ├── db.js                  # Drizzle ORM client connection
│   └── schema.js              # PostgreSQL database table definitions
├── AGENTS.md                  # Autonomous agent workflow rules & git habits
├── BRAIN.md                   # This document
└── drizzle.config.js          # Drizzle Kit configuration
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
- `createdBy`: User email from Clerk session.
- `createdAt`: Timestamp string.

### Table: `userAnswer`
Stores user responses and grading metrics.
- `id`: Serial primary key.
- `mockIdRef`: Foreign identifier matching `mockInterview.mockId`.
- `question`: The specific interview question presented.
- `correctAns`: Ideal benchmark answer generated by AI.
- `userAns`: Candidate's transcribed or submitted response.
- `feedback`: AI-generated constructive critique and improvement steps.
- `rating`: Calibrated score (1 to 10).
- `userEmail`: User email from Clerk session.
- `createdAt`: Timestamp string.

---

## 7. Environment Variables Configuration

Create a `.env.local` file with the following keys:

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

# Google Gemini API (Cloud Fallback & Audio STT)
GEMINI_API_KEY=AQ.Ab8RN6... # Or standard AI Studio API key
NEXT_PUBLIC_GEMINI_API_KEY=AQ.Ab8RN6...

# Local Ollama AI (Optional for local inference)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.3

# Razorpay Payments (Optional for subscriptions)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
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
