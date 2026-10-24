import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Cloud AI Service (Google Gemini 2.0 Flash / 1.5 Flash)
 * Provides cloud inference fallback when local Ollama is offline or when remote users connect.
 */

const getApiKey = () => {
  const isReal = (k) => k && typeof k === 'string' && !k.includes('your-') && !k.includes('your_') && !k.includes('placeholder');
  const k1 = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();
  const k2 = (process.env.GEMINI_API_KEY || '').trim();
  if (isReal(k1)) return k1;
  if (isReal(k2)) return k2;
  return '';
};

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

export const CloudAIService = {
  isConfigured: () => Boolean(getApiKey()),

  /**
   * Helper to execute Gemini generation with automatic model fallback for resilience
   */
  generateWithFallback: async (promptOrParts, options = {}) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: options.generationConfig || {},
        });

        const timeoutMs = options.timeoutMs || 25000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout waiting for ${modelName}`)), timeoutMs)
        );

        const result = await Promise.race([contentPromise, timeoutPromise]);
        const response = await result.response;
        return {
          text: response.text(),
          model: modelName,
        };
      } catch (err) {
        console.warn(`[CloudAI] Model ${modelName} notice:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All cloud AI model candidates failed.");
  },

  /**
   * Evaluate candidate interview answer using Gemini
   */
  evaluateAnswer: async ({ question, correctAnswer, userAnswer }) => {
    const trimmedAnswer = (userAnswer || "").trim();

    // Catch trivial or completely evasive answers immediately
    const isEvasive = /\b(i don['’]?t know|no idea|no clue|dunno|not sure|have no idea|pass|skip|don['’]?t remember|cannot answer|can['’]?t answer)\b/i.test(trimmedAnswer) ||
      /^(hello|hi|yes|no|ok|test|random|asdf|\?|\.)$/i.test(trimmedAnswer);
    if (trimmedAnswer.length < 8 || isEvasive) {
      return {
        success: true,
        engine: "gemini",
        model: "gemini-3.5-flash",
        rating: "1",
        feedback: "The submitted answer did not attempt to address the technical concepts required by this question. In an interview, even if you are unsure of the complete solution, walk the interviewer through your foundational reasoning, related principles, and how you would investigate the problem rather than giving an evasive answer.",
      };
    }

    const evaluationPrompt = `You are a Principal Hiring Bar Raiser and Senior Staff Interviewer evaluating a candidate's answer during a high-stakes technical mock interview.

Interview Question: "${question}"
Target Benchmark Answer / Key Concepts: "${correctAnswer}"
Candidate's Transcribed / Submitted Answer: "${trimmedAnswer}"

STRICT EVALUATION MATRIX:
- 1 to 2 (Unacceptable): Irrelevant, evasive, nonsense, or trivial (fewer than 10 words without substance).
- 3 to 4 (Superficial): Mentions relevant buzzwords but demonstrates fundamental misconceptions or lacks technical explanation.
- 5 to 6 (Competent Junior/Mid): Explains the basic concept correctly, but misses key architectural trade-offs, performance nuances, or edge cases.
- 7 to 8 (Strong Senior): Technically accurate, clearly articulates trade-offs, concrete engineering mechanics, and real-world considerations.
- 9 to 10 (Staff/Principal Mastery): Flawless technical depth, addresses system scalability/memory/concurrency constraints, explains trade-offs, and provides concrete architectural examples.

TASK:
1. Objectively grade the candidate's answer against the target benchmark.
2. Return strictly valid JSON with keys "rating" (integer 1-10) and "feedback" (3 to 5 constructive, concise sentences explaining strengths, specific missing concepts, and concrete steps to reach a 10/10 answer).

JSON format:
{
  "rating": 7,
  "feedback": "..."
}`;

    const res = await CloudAIService.generateWithFallback(evaluationPrompt, {
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const raw = (res.text || "")
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const parsed = JSON.parse(raw);
    return {
      success: true,
      engine: "gemini",
      model: res.model,
      rating: String(parsed.rating || "7"),
      feedback:
        parsed.feedback ||
        "Good response. Ensure you articulate core trade-offs and edge cases.",
    };
  },

  /**
   * Generate tailored, non-repetitive interview questions using Gemini
   */
  generateQuestions: async ({
    jobPosition = "Full Stack Developer",
    jobDesc = "React, Node.js, Next.js, PostgreSQL",
    jobExperience = "3",
    questionCount = 5,
    seed = null,
  }) => {
    const count = parseInt(questionCount, 10) || 5;
    const entropySeed = seed || `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const archetypes = [
      "Real-world production incident or high-severity latency spike troubleshooting",
      "Architectural trade-offs under high scale, network partitions, and state synchronization",
      "Deep framework or language runtime internals (memory management, event loops, garbage collection pauses)",
      "Data consistency, database indexing strategies, connection pool exhaustion, and race conditions",
      "Senior technical decision-making, legacy architecture migration, and performance refactoring",
    ];
    // Dynamic archetype selection
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
1. DO NOT generate generic textbook trivia or repeat common boilerplate definitions (avoid "What is X?").
2. Frame every question around realistic engineering challenges, real-world systems, and concrete trade-offs.
3. Every question must be distinct and specific to this unique session (${entropySeed}).
4. Return strictly a JSON array containing exactly ${count} objects.
5. Each object must contain exactly two keys: "question" (string) and "answer" (string).
6. The "answer" should be a comprehensive model response highlighting key architectural principles and trade-offs.
7. Do NOT wrap your output in markdown backticks or commentary. Output raw valid JSON.

JSON Schema format:
[
  {
    "question": "Scenario question text here...",
    "answer": "Expected comprehensive model answer here..."
  }
]`;

    const res = await CloudAIService.generateWithFallback(systemPrompt, {
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    });

    const cleaned = (res.text || "")
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    let parsed = JSON.parse(cleaned);
    let questionsList = [];

    if (Array.isArray(parsed)) {
      questionsList = parsed;
    } else if (parsed?.questions && Array.isArray(parsed.questions)) {
      questionsList = parsed.questions;
    } else if (parsed && typeof parsed === "object" && parsed.question) {
      questionsList = [parsed];
    }

    const normalized = questionsList.slice(0, count).map((q, idx) => ({
      question:
        q.question ||
        q.Question ||
        q.interview_question ||
        `Interview Question #${idx + 1}`,
      answer:
        q.answer ||
        q.Answer ||
        q.expected_answer ||
        "Articulate architectural fundamentals, trade-offs, and concrete examples.",
    }));

    return {
      success: true,
      engine: "gemini",
      model: res.model,
      count: normalized.length,
      questions: normalized,
      rawJson: JSON.stringify(normalized),
    };
  },

  /**
   * Multimodal Speech-to-Text: Transcribe spoken audio buffer directly with Gemini
   */
  transcribeAudio: async (audioBuffer, mimeType = "audio/webm") => {
    const base64Data = Buffer.isBuffer(audioBuffer)
      ? audioBuffer.toString("base64")
      : Buffer.from(audioBuffer).toString("base64");

    const promptParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType.split(";")[0] || "audio/webm",
        },
      },
      "Listen carefully to this spoken audio recording of a candidate answering an interview question. Transcribe exactly what the candidate is saying in English with proper punctuation. Output strictly the transcribed spoken words. Do not include any timestamps, commentary, or quotes. If the audio is silent or contains no discernible speech, output nothing.",
    ];

    const res = await CloudAIService.generateWithFallback(promptParts, {
      generationConfig: {
        temperature: 0.1,
      },
    });

    const rawTranscript = (res.text || "")
      .replace(/^\[.*?\]/g, "")
      .replace(/^"|"$/g, "")
      .trim();

    // Clean common silence hallucinations
    const isHallucination = /^(you|thank you|thanks for watching|subscribe|bye)\.?$/i.test(rawTranscript);
    return isHallucination ? "" : rawTranscript;
  },

  /**
   * Resume ATS and skill gap analysis using Gemini
   */
  analyzeResume: async ({ resumeText, targetRole, targetJobDesc }) => {
    const systemPrompt = `You are a Principal Tech Recruiter and Staff Hiring Bar Raiser at a top tier technology firm.
Your task is to analyze the candidate's resume text against their target role and target job description.

Target Role: ${targetRole}
Target Job Description / Tech Stack: ${targetJobDesc}

Candidate Resume Text:
"""
${(resumeText || "").slice(0, 5000)}
"""

CRITICAL INSTRUCTIONS:
1. Return strictly a raw valid JSON object.
2. Calculate a realistic ATS match percentage (0 to 100).
3. Identify matched skills from the resume that fit the target job.
4. Identify missing keywords or skills from the target job that the candidate should add.
5. Extract 2-3 specific real projects or achievements from their resume.
6. Generate 3 to 4 hyper-specific technical interview questions that explicitly reference their actual projects, accomplishments, and tech stack from their resume.
7. Provide 3 actionable resume optimization tips to boost their interview callback rate.

JSON Schema format:
{
  "atsScore": 84,
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingKeywords": ["Missing Skill 1", "Missing Skill 2"],
  "projectHighlights": ["Achievement 1", "Achievement 2"],
  "tailoredQuestions": [
    {
      "question": "In your resume, you noted [specific project]. How did you [technical architectural question]?",
      "answer": "Expected comprehensive model answer highlighting trade-offs and best practices."
    }
  ],
  "resumeOptimizationTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ]
}`;

    const res = await CloudAIService.generateWithFallback(systemPrompt, {
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const cleaned = (res.text || "")
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return {
      success: true,
      engine: "gemini",
      model: res.model,
      ...parsed,
    };
  },
};

export default CloudAIService;
