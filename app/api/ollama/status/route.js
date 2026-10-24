import { NextResponse } from 'next/server';
import { CloudAIService } from '@/utils/cloudAI';

export async function GET() {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const configuredModel = process.env.OLLAMA_MODEL || 'llama3.3';
  const isCloudReady = CloudAIService.isConfigured();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map((m) => m.name);

      const matchedModel = models.find((m) =>
        m.toLowerCase().startsWith(configuredModel.toLowerCase())
      ) || models.find((m) =>
        m.toLowerCase().startsWith('llama3.3') ||
        m.toLowerCase().startsWith('llama3.2') ||
        m.toLowerCase().startsWith('deepseek-r1')
      );

      const activeModel = matchedModel || configuredModel;

      return NextResponse.json({
        online: true,
        baseUrl,
        model: configuredModel,
        hasConfiguredModel: Boolean(matchedModel),
        models,
        activeModel,
        activeEngine: 'ollama',
        cloudAvailable: isCloudReady,
      });
    }
  } catch (err) {
    // Ollama is offline or timed out
  }

  // If local Ollama is offline, check if Gemini Cloud AI is armed
  if (isCloudReady) {
    return NextResponse.json({
      online: true,
      isCloud: true,
      activeEngine: 'gemini',
      baseUrl,
      model: 'gemini-3.5-flash',
      activeModel: 'gemini-3.5-flash',
      models: ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.8-flash'],
      message: 'Local Ollama offline; Google Gemini 3.5 Flash Cloud Engine Armed',
    });
  }

  return NextResponse.json({
    online: false,
    baseUrl,
    model: configuredModel,
    models: [],
    activeEngine: 'none',
    message: 'Local Ollama unreachable and GEMINI_API_KEY not configured',
  });
}
