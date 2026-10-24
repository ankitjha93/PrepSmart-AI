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

        const result = await model.generateContent(promptOrParts);
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
    const evaluationPrompt = `You are a Senior Staff Interviewer evaluating a candidate's answer during a technical mock interview.

Interview Question: "${question}"
Target Benchmark Answer / Key Concepts: "${correctAnswer}"
Candidate's Transcribed / Submitted Answer: "${userAnswer}"

TASK:
Evaluate the candidate's answer with technical rigor, precision, and fairness.
Respond strictly in valid JSON format with two keys:
1. "rating": An integer from 1 to 10 (1 = completely incorrect/evasive, 5 = superficial or partially correct, 8 = strong technical response, 10 = exceptional mastery with trade-offs).
2. "feedback": 3 to 5 concise sentences providing constructive feedback. Explicitly state:
   - What the candidate explained well
   - Missing technical depth, overlooked trade-offs, or inaccuracies
   - Specific actionable tips to reach a FAANG/Staff-level answer

JSON format:
{
  "rating": 7,
  "feedback": "Your explanation accurately addressed... However, you overlooked... To improve, make sure to..."
}`;

    const res = await CloudAIService.generateWithFallback(evaluationPrompt, {
      generationConfig: {
        temperature: 0.3,
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
   * Generate tailored interview questions using Gemini
   */
  generateQuestions: async ({
    jobPosition = "Full Stack Developer",
    jobDesc = "React, Node.js, Next.js, PostgreSQL",
    jobExperience = "3",
    questionCount = 5,
  }) => {
    const count = parseInt(questionCount, 10) || 5;

    const systemPrompt = `You are a Principal Tech Interviewer and Staff Hiring Bar Raiser at a top tier technology firm.
Your task is to generate realistic, in-depth technical and behavioral interview questions tailored strictly to the role, seniority, and tech stack provided.

Role: ${jobPosition}
Technologies & Context: ${jobDesc}
Years of Experience: ${jobExperience} Years
Number of Questions: ${count}

CRITICAL RULES:
1. Return strictly a JSON array containing exactly ${count} objects.
2. Each object must contain exactly two keys: "question" (string) and "answer" (string).
3. The "answer" should be a comprehensive model response highlighting key architectural principles, trade-offs, and expected candidate answers.
4. Do NOT wrap your output in markdown backticks or commentary. Output raw valid JSON.

JSON Schema format:
[
  {
    "question": "Question text here...",
    "answer": "Expected comprehensive model answer here..."
  }
]`;

    const res = await CloudAIService.generateWithFallback(systemPrompt, {
      generationConfig: {
        temperature: 0.7,
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
