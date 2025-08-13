import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import mongoose from "mongoose";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const inFlightByUser: Map<string, Promise<string>> = new Map();

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isStale(
  updatedAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!updatedAt) return true;
  return startOfUtcDay(updatedAt) < startOfUtcDay(now);
}

function deterministicFallback(userId: string, now: Date = new Date()): string {
  const fallbacks = [
    "what tiny thing gives you butterflies?",
    "what's your love language lately?",
    "what kind of texts make you melt?",
    "what first-date vibe do you love?",
    "what makes you catch feelings fast?",
  ];
  const key = `${userId}-${now.getUTCFullYear()}-${
    now.getUTCMonth() + 1
  }-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return fallbacks[hash % fallbacks.length];
}

class TransientAiError extends Error {}

function isTransientAiError(error: any): boolean {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generatePromptText(): Promise<string> {
  const modelId = "gemini-2.0-flash";
  const model = google(modelId);
  const prompt = [
    "Generate one short, playful Gen-Z style question for a public message board about crushes, love, or feelings.",
    "Constraints:",
    "- 4 to 10 words",
    "- avoid sensitive topics, private data, explicit content, and naming specific people",
    "- no age-related content; keep it inclusive and tasteful",
    "- return only the question text, no quotes and no trailing punctuation",
  ].join("\n");

  const maxAttempts = 3;
  const baseDelayMs = 250;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { text } = await generateText({ model, prompt, temperature: 0.7 });
      const cleaned = String(text || "")
        .trim()
        .replace(/\s+/g, " ");
      const normalized = cleaned.replace(/[.!?]+$/g, "");
      if (!normalized) throw new Error("empty ai response");
      return normalized.slice(0, 120);
    } catch (error: any) {
      lastError = error;
      if (!isTransientAiError(error)) {
        throw error;
      }

      console.warn("[dailyPrompt] transient AI failure", {
        model: modelId,
        attempt,
        prompt,
        error: String(error?.message || error),
      });
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw new TransientAiError(
    String(lastError?.message || "AI generation failed after retries")
  );
}

export async function ensureDailyPromptFreshForUserId(
  userIdRaw: string
): Promise<string> {
  const userId = new mongoose.Types.ObjectId(String(userIdRaw));

  const existing = inFlightByUser.get(userId.toHexString());
  if (existing) return existing;

  const task = (async () => {
    await connectToDatabase();
    const now = new Date();
    const user = await UserModel.findById(userId, { dailyPrompt: 1 }).lean();
    const stale = isStale((user as any)?.dailyPrompt?.updatedAt, now);
    if (!stale && (user as any)?.dailyPrompt?.text) {
      return String((user as any)?.dailyPrompt?.text || "");
    }

    let text: string | null = null;
    try {
      text = await generatePromptText();
    } catch (error) {
      // Only fall back after all transient retries fail. Non-transient errors bubble up.
      if (error instanceof TransientAiError) {
        console.warn(
          "[dailyPrompt] falling back to deterministic after retries",
          {
            userId: userId.toHexString(),
          }
        );
        text = deterministicFallback(userId.toHexString(), now);
      } else {
        console.error("[dailyPrompt] non-transient AI error", error);
        throw error;
      }
    }

    try {
      await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            "dailyPrompt.text": text,
            "dailyPrompt.updatedAt": now,
            "dailyPrompt.promptVersion": 2,
          },
        }
      ).exec();
    } catch (error) {
      console.error("Failed to update daily prompt in database:", error);
      throw error;
    }
    return text;
  })();

  inFlightByUser.set(userId.toHexString(), task);
  try {
    const result = await task;
    return result;
  } finally {
    inFlightByUser.delete(userId.toHexString());
  }
}

export async function getDailyPromptForUserId(userIdRaw: string): Promise<{
  text: string;
  updatedAt: Date | null;
  promptVersion: number;
} | null> {
  if (!userIdRaw || !mongoose.Types.ObjectId.isValid(userIdRaw)) {
    throw new Error("Invalid user ID");
  }
  const userId = new mongoose.Types.ObjectId(String(userIdRaw));
  await connectToDatabase();
  const user = await UserModel.findById(userId, { dailyPrompt: 1 }).lean();
  if (!user) return null;
  const dp = (user as any).dailyPrompt || {};
  return {
    text: String(dp.text || ""),
    updatedAt: dp.updatedAt || null,
    promptVersion: Number(dp.promptVersion || 1),
  };
}