import { NextResponse } from 'next/server';
import { CloudAIService } from '@/utils/cloudAI';

export async function POST(req) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const defaultModel = process.env.OLLAMA_MODEL || 'llama3.3';

  try {
    const body = await req.json();
    const {
      question = '',
      correctAnswer = '',
      userAnswer = '',
      model = defaultModel,
    } = body;

    const trimmedAnswer = (userAnswer || '').trim();
    if (!trimmedAnswer || trimmedAnswer.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Candidate answer is required for evaluation',
      }, { status: 400 });
    }

    // Catch trivial or completely evasive answers immediately
    const isEvasive = /\b(i don['’]?t know|no idea|no clue|dunno|not sure|have no idea|pass|skip|don['’]?t remember|cannot answer|can['’]?t answer)\b/i.test(trimmedAnswer) ||
      /^(hello|hi|yes|no|ok|test|random|asdf|\?|\.)$/i.test(trimmedAnswer);
    if (trimmedAnswer.length < 8 || isEvasive) {
      return NextResponse.json({
        success: true,
        engine: 'instant-validator',
        model: 'evaluator',
        rating: '1',
        feedback: 'The submitted response did not attempt to address the technical concepts required by this question. In an interview, walk through your foundational reasoning, related principles, and how you would investigate the problem rather than giving an evasive answer.',
      });
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
  "feedback": "Your explanation accurately addressed... However, you overlooked... To improve, make sure to..."
}`;

    let parsedResult = null;
    let usedEngine = 'ollama';

    try {
      const controller = new AbortController();
      // Fast timeout for local probe so remote users don't wait 45s
      const timeout = setTimeout(() => controller.abort(), 3500);

      const ollamaRes = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model,
          prompt: evaluationPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2, // Low temperature for consistent, objective evaluation
            top_p: 0.9,
          },
        }),
      });

      clearTimeout(timeout);

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        const raw = (ollamaData?.response || '').replace(/```json/gi, '').replace(/```/gi, '').trim();
        parsedResult = JSON.parse(raw);
      }
    } catch (ollamaErr) {
      console.warn('Ollama evaluation inference error (switching to Cloud AI):', ollamaErr.message);
    }

    // Cloud AI Fallback via Google Gemini (for remote users & deployed environments)
    if (!parsedResult || !parsedResult.feedback) {
      if (CloudAIService.isConfigured()) {
        try {
          const cloudRes = await CloudAIService.evaluateAnswer({
            question,
            correctAnswer,
            userAnswer: trimmedAnswer,
          });
          if (cloudRes && cloudRes.feedback) {
            parsedResult = {
              rating: cloudRes.rating,
              feedback: cloudRes.feedback,
            };
            usedEngine = `gemini (${cloudRes.model})`;
          }
        } catch (cloudErr) {
          console.warn('Cloud AI evaluation fallback notice:', cloudErr.message);
        }
      }
    }

    // Calibrated heuristic fallback if both Ollama and Cloud AI are offline
    if (!parsedResult || !parsedResult.feedback) {
      const wordCount = trimmedAnswer.split(/\s+/).length;
      let calculatedRating = 5;
      if (wordCount < 10 || isEvasive) calculatedRating = 1;
      else if (wordCount < 25) calculatedRating = 3;
      else if (wordCount < 50) calculatedRating = 6;
      else if (wordCount < 90) calculatedRating = 8;
      else calculatedRating = 9;

      parsedResult = {
        rating: calculatedRating,
        feedback: `You provided an overview (${wordCount} words). To elevate this to a top-tier score, be sure to explicitly state architectural trade-offs, discuss real-world edge cases or memory constraints, and structure your answer using the STAR framework.`,
      };
      usedEngine = 'heuristic-fallback';
    }

    return NextResponse.json({
      success: true,
      engine: usedEngine,
      model: usedEngine.includes('gemini') ? 'gemini-3.5-flash' : model,
      rating: String(parsedResult.rating || '7'),
      feedback: parsedResult.feedback || 'Good attempt. Consider expanding on system trade-offs.',
    });
  } catch (err) {
    console.error('Fatal error in /api/ollama/evaluate:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
