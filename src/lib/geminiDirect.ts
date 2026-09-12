'use client';

import { recordExpense } from './expenseTracker';
import { cleanDisplayReply } from './cleaner';

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  apiKey: string;
  preferredModel?: string;
  temperature?: number;
  topP?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    candidateTokens: number;
  };
}

let cachedModels: string[] | null = null;
let lastCacheTime = 0;

export async function getAvailableModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && now - lastCacheTime < 5 * 60 * 1000) {
    return cachedModels;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        const supported = data.models
          .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => String(m.name)); // e.g. "models/gemini-1.5-flash"
        if (supported.length > 0) {
          cachedModels = supported;
          lastCacheTime = now;
          return supported;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to list models from Gemini API:', e);
  }

  // Fallback defaults
  return [
    'models/gemini-3.6-flash',
    'models/gemini-flash-latest',
    'models/gemini-3.5-flash',
    'models/gemini-2.5-flash-lite',
    'models/gemini-2.5-pro'
  ];
}

export function pickBestModel(available: string[], preferred?: string): string[] {
  const ordered: string[] = [];

  // Normalize preferred
  if (preferred) {
    const normPref = preferred.startsWith('models/') ? preferred : `models/${preferred}`;
    if (available.includes(normPref)) {
      ordered.push(normPref);
    }
  }

  // Priority order for general usage
  const priorities = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-pro-latest'
  ];

  for (const prio of priorities) {
    const found = available.find(m => m === `models/${prio}` || m.endsWith(`/${prio}`));
    if (found && !ordered.includes(found)) {
      ordered.push(found);
    }
  }

  // Add any remaining available models
  for (const m of available) {
    if (!ordered.includes(m)) {
      ordered.push(m);
    }
  }

  return ordered;
}

export async function callGeminiDirect({
  prompt,
  systemInstruction,
  apiKey,
  preferredModel,
  temperature = 0.2,
  topP = 0.85
}: GenerateOptions): Promise<GenerateResult> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('Cheia API lipsește.');
  }

  const available = await getAvailableModels(key);
  const candidateModels = pickBestModel(available, preferredModel);

  let lastError = '';

  for (const modelPath of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(key)}`;

    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, topP }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const promptTokens = json.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
          const candidateTokens = json.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
          
          try {
            recordExpense(modelPath, promptTokens, candidateTokens);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('storage'));
            }
          } catch (e) {
            console.warn('Expense record error:', e);
          }

          return {
            text: cleanDisplayReply(text),
            model: modelPath.replace(/^models\//, ''),
            usage: { promptTokens, candidateTokens }
          };
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson?.error?.message) {
          lastError = errJson.error.message;
        }
      }
    } catch (err: any) {
      lastError = err?.message || 'Eroare de rețea la contactarea Google Gemini API';
    }
  }

  throw new Error(lastError || 'Nu s-a putut genera un răspuns de la Google Gemini.');
}
