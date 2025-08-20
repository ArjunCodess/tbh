import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const AI_MODEL_ID = "gemini-2.0-flash";

export class TransientAIError extends Error {}

export function isTransientAIError(error: any): boolean {
  const status = (error as any)?.status || (error as any)?.response?.status;
  const code = (error as any)?.code;
  const name = (error as any)?.name || "";
  const message = (error as any)?.message || "";
  if (status && (status === 429 || status >= 500)) return true;
  if (
    code &&
    ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "ENOTFOUND"].includes(code)
  )
    return true;
  if (
    /RateLimit|Timeout|FetchError|NetworkError/i.test(
      String(name) + " " + String(message)
    )
  )
    return true;
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GenerateOptions = {
  temperature?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  context?: string;
};

export async function generateWithRetry(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const model = google(AI_MODEL_ID);
  const {
    temperature = 0.7,
    maxAttempts = 3,
    baseDelayMs = 250,
    context = "",
  } = options;

  let lastError: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { text } = await generateText({ model, prompt, temperature });
      return String(text || "");
    } catch (error: any) {
      lastError = error;
      if (!isTransientAIError(error)) throw error;
      const promptPreview = normalizeSingleLine(prompt).slice(0, 80);
      console.warn(`[ai:${context}] transient AI failure`, {
        model: AI_MODEL_ID,
        attempt,
        promptPreview,
        promptLength: prompt.length,
        error: String(error?.message || error),
      });
      if (attempt < maxAttempts)
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
    }
  }
  throw new TransientAIError(
    String(lastError?.message || "AI generation failed after retries")
  );
}

export function normalizeSingleLine(text: string): string {
  const cleaned = String(text || "")
    .trim()
    .replace(/\s+/g, " ");
  const normalized = cleaned.replace(/[.!?]+$/g, "");
  return normalized.slice(0, 120);
}