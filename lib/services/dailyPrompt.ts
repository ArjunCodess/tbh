import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import mongoose from "mongoose";
import { normalizeSingleLine, generateWithRetry, TransientAIError } from "@/lib/ai/generation";
import { DAILY_PROMPT_TEMPLATE, GENZ_FALLBACK_DAILY } from "@/lib/ai/prompts";

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
  const fallbacks = GENZ_FALLBACK_DAILY;
  const key = `${userId}-${now.getUTCFullYear()}-${
    now.getUTCMonth() + 1
  }-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return fallbacks[hash % fallbacks.length];
}

async function generatePromptText(): Promise<string> {
  const raw = await generateWithRetry(DAILY_PROMPT_TEMPLATE, {
    temperature: 0.7,
    maxAttempts: 3,
    baseDelayMs: 250,
    context: "dailyPrompt",
  });
  const normalized = normalizeSingleLine(raw);
  if (!normalized) throw new Error("empty ai response");
  return normalized;
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
      if (error instanceof TransientAIError) {
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