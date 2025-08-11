import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import mongoose from "mongoose";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const inFlightByUser: Map<string, Promise<string>> = new Map();

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isStale(updatedAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!updatedAt) return true;
  return startOfUtcDay(updatedAt) < startOfUtcDay(now);
}

function deterministicFallback(userId: string, now: Date = new Date()): string {
  const fallbacks = [
    "what made you smile today?",
    "what small win are you proud of today?",
    "what energized you today?",
    "what is one thing you learned today?",
    "what moment are you grateful for today?",
  ];
  const key = `${userId}-${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return fallbacks[hash % fallbacks.length];
}

async function generatePromptText(): Promise<string> {
  const model = google("gemini-2.0-flash");
  const prompt = [
    "Generate one short, friendly daily reflection question for a public message board.",
    "Constraints:",
    "- 8 to 16 words",
    "- avoid sensitive topics and private data",
    "- neutral, inclusive tone",
    "- return only the question text, no quotes or punctuation at end",
  ].join("\n");

  const { text } = await generateText({ model, prompt, temperature: 0.7 });
  const cleaned = String(text || "").trim().replace(/\s+/g, " ");
  const normalized = cleaned.replace(/[.!?]+$/g, "");
  if (!normalized) throw new Error("empty ai response");
  return normalized.slice(0, 120);
}

export async function ensureDailyPromptFreshForUserId(userIdRaw: string): Promise<string> {
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
    } catch {
      text = null;
    }
    if (!text) {
      text = deterministicFallback(userId.toHexString(), now);
    }

    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          "dailyPrompt.text": text,
          "dailyPrompt.updatedAt": now,
          "dailyPrompt.promptVersion": 1,
        },
      }
    ).exec();

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

export async function getDailyPromptForUserId(userIdRaw: string): Promise<{ text: string; updatedAt: Date | null; promptVersion: number } | null> {
  await connectToDatabase();
  const user = await UserModel.findById(userIdRaw, { dailyPrompt: 1 }).lean();
  if (!user) return null;
  const dp = (user as any).dailyPrompt || {};
  return { text: String(dp.text || ""), updatedAt: dp.updatedAt || null, promptVersion: Number(dp.promptVersion || 1) };
}