import { NextResponse } from 'next/server';
import { CloudAIService } from '@/utils/cloudAI';

export async function POST(req) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const defaultModel = process.env.OLLAMA_MODEL || 'llama3.3';

  try {
    const body = await req.json();
    const {
      jobPosition = 'Full Stack Developer',
      jobDesc = 'React, Node.js, Next.js, PostgreSQL',
      jobExperience = '3',
      questionCount = 5,
      model = defaultModel,
      seed = null,
    } = body;

    const count = parseInt(questionCount, 10) || 5;
    const entropySeed = seed || `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const archetypes = [
      "Production outage troubleshooting and distributed latency root-cause analysis",
      "Scalability design trade-offs under high concurrency, memory limits, and network partitions",
      "Deep framework or language runtime internals (event loop microtasks, memory profiling, garbage collection)",
      "Database indexing, isolation levels, connection pooling, and race condition prevention",
      "High-stakes engineering trade-offs, architecture migration, and code refactoring",
    ];
    const selectedArchetypes = archetypes.sort(() => 0.5 - Math.random()).slice(0, count);

    const systemPrompt = `You are a Principal Tech Interviewer and Staff Bar Raiser at a tier-1 technology firm (Google, Meta, Stripe).
Your task is to generate ${count} FRESH, HIGHLY DYNAMIC, SCENARIO-BASED technical interview questions tailored strictly to the role, seniority, and tech stack provided.

Session Entropy: ${entropySeed}
Role: ${jobPosition}
Technologies & Context: ${jobDesc}
Years of Experience: ${jobExperience} Years
Number of Questions: ${count}

DIVERSITY & SCENARIO GUIDELINES:
Cover the following distinct engineering scenarios across the questions:
${selectedArchetypes.map((a, i) => `${i + 1}. ${a}`).join("\n")}

CRITICAL INSTRUCTIONS:
1. DO NOT generate repetitive, generic textbook trivia or repeat common boilerplate definitions (avoid "What is X?").
2. Frame every question around realistic engineering challenges, real-world systems, and concrete trade-offs.
3. Every question must be distinct and specific to this unique session (${entropySeed}).
4. Return strictly a JSON array containing exactly ${count} objects.
5. Each object must contain exactly two keys: "question" (string) and "answer" (string).
6. The "answer" should be a comprehensive model response highlighting key architectural principles and trade-offs.
7. Do NOT wrap output in markdown backticks or commentary. Output raw valid JSON.

JSON Schema format:
[
  {
    "question": "Scenario question text here...",
    "answer": "Expected comprehensive model answer here..."
  }
]`;

    // Attempt to call Ollama
    let rawText = '';
    let parsedQuestions = null;
    let usedEngine = 'ollama';

    try {
      const controller = new AbortController();
      // Fast probe timeout for local Ollama so remote users don't wait 60 seconds
      const timeout = setTimeout(() => controller.abort(), 4000);

      const ollamaRes = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model,
          prompt: systemPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.85,
            top_p: 0.95,
          },
        }),
      });

      clearTimeout(timeout);

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        rawText = ollamaData?.response || '';

        // Clean rawText
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedQuestions = parsed;
        } else if (parsed?.questions && Array.isArray(parsed.questions)) {
          parsedQuestions = parsed.questions;
        } else if (parsed?.interviewQuestions && Array.isArray(parsed.interviewQuestions)) {
          parsedQuestions = parsed.interviewQuestions;
        } else if (parsed?.interview_questions && Array.isArray(parsed.interview_questions)) {
          parsedQuestions = parsed.interview_questions;
        } else if (parsed && typeof parsed === 'object') {
          if (parsed.question && parsed.answer) {
            parsedQuestions = [parsed];
          }
        }
      }
    } catch (ollamaErr) {
      console.warn('Ollama generation network/inference error (switching to Cloud AI):', ollamaErr.message);
    }

    // Cloud AI Fallback via Google Gemini (for remote users & deployed environments)
    if (!parsedQuestions || parsedQuestions.length === 0) {
      if (CloudAIService.isConfigured()) {
        try {
          const cloudRes = await CloudAIService.generateQuestions({
            jobPosition,
            jobDesc,
            jobExperience,
            questionCount: count,
            seed: entropySeed,
          });
          if (cloudRes && Array.isArray(cloudRes.questions) && cloudRes.questions.length > 0) {
            parsedQuestions = cloudRes.questions;
            usedEngine = `gemini (${cloudRes.model})`;
          }
        } catch (cloudErr) {
          console.warn('Cloud AI question generation fallback notice:', cloudErr.message);
        }
      }
    }

    // Dynamic randomized fallback question bank (ensuring zero repetition even when fully offline)
    if (!parsedQuestions || parsedQuestions.length === 0) {
      const comprehensiveBank = [
        {
          question: `In modern ${jobPosition || 'Software'} engineering, walk me through an unexpected production latency spike or thread pool exhaustion you diagnosed in a system built with ${jobDesc || 'modern stacks'}. What telemetry metrics and profiling steps led you to root cause?`,
          answer: `The candidate should structure their explanation using the STAR framework, detailing APM profiling, flame graphs, database slow query logs with EXPLAIN ANALYZE, event-loop lag metrics, and preventative architectural safeguards like circuit breakers and bulkheads.`
        },
        {
          question: `When designing data persistence and caching layers for ${jobDesc || 'distributed backends'}, how do you handle cache invalidation, cache stampedes (thundering herd), and dual-write consistency between your primary database and memory caches?`,
          answer: `Explain probabilistic early expiration (XFetch), mutex locking/single-flight requests for cache stampedes, write-through vs cache-aside patterns, change data capture (Debezium/Kafka) for transactional consistency, and idempotency keys.`
        },
        {
          question: `How do you architect state management and data hydration in ${jobPosition || 'web applications'} without introducing race conditions, stale closures, or client-server hydration mismatches?`,
          answer: `Contrast server-side streaming and Suspense boundaries with client store initialization, explain state factory patterns per request to prevent cross-request leakage, and detail optimistic rollback handlers.`
        },
        {
          question: `Describe a situation where you had to champion a major technical migration or refactor for a ${jobPosition || 'developer'} initiative under strict deadline pressure. What trade-offs did you evaluate?`,
          answer: `Follow the STAR method: quantify business metrics (latency drop, developer velocity, error rate), explain the Strangler Fig pattern for zero-downtime cutover, and outline automated regression tests.`
        },
        {
          question: `How do you secure modern APIs and frontends against sophisticated attack vectors beyond basic input validation (e.g., SSRF, JWT replay attacks, prototype pollution, and timing attacks)?`,
          answer: `Discuss ephemeral short-lived access tokens with HttpOnly SameSite refresh cookies, cryptographic signature verification, Content Security Policy (CSP), rate limiting, and zero-trust internal network service meshes.`
        },
        {
          question: `Suppose your application experiences memory leaks or unbounded garbage collection pauses under sustained peak throughput. How do you profile the heap and identify whether closures, unclosed sockets, or cache accumulation are responsible?`,
          answer: `Detail taking heap snapshots, comparing baseline vs retained memory, inspecting detached DOM nodes or lingering event listeners, tuning GC parameters, and using stream-based processing for large payloads.`
        },
        {
          question: `In high-throughput microservices using ${jobDesc || 'modern architectures'}, how do you prevent cascading failures across services during dependent API downtime?`,
          answer: `Detail timeout budgets, exponential backoff with full jitter, circuit breaker states (closed, open, half-open), dead letter queues, and graceful degradation returning cached or partial payloads.`
        }
      ];

      // Shuffle and pick fresh questions every time
      parsedQuestions = comprehensiveBank.sort(() => 0.5 - Math.random()).slice(0, count);
      usedEngine = 'dynamic-fallback';
    }

    // Normalize items
    const normalized = parsedQuestions.map((q, idx) => ({
      question: q.question || q.Question || q.interview_question || `Interview Question #${idx + 1}`,
      answer: q.answer || q.Answer || q.expected_answer || 'Articulate architectural fundamentals, trade-offs, and concrete examples.'
    }));

    return NextResponse.json({
      success: true,
      engine: usedEngine,
      model: usedEngine.includes('gemini') ? 'gemini-3.5-flash' : model,
      count: normalized.length,
      questions: normalized,
      rawJson: JSON.stringify(normalized),
    });
  } catch (err) {
    console.error('Fatal error in /api/ollama/generate:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
