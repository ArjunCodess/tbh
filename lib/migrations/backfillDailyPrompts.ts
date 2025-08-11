import connectToDatabase from "../connectToDatabase";
import UserModel from "../models/user.schema";
import mongoose from "mongoose";

function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

function deterministicFallback(userId: string, now: Date = new Date()): string {
  const fallbacks = [
    "what made you smile today?",
    "what small win are you proud of today?",
    "what energized you today?",
    "what is one thing you learned today?",
    "what moment are you grateful for today?",
  ];
  const key = `${userId}-${dayKey(now)}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return fallbacks[hash % fallbacks.length];
}

// IMPORTANT: idempotent migration; safe to re-run
export async function backfillDailyPrompts(): Promise<{ usersScanned: number; promptsSet: number }> {
  await connectToDatabase();

  let usersScanned = 0;
  let promptsSet = 0;
  const now = new Date();

  const cursor = UserModel.find({}, { _id: 1, dailyPrompt: 1 }).lean().cursor();
  for await (const user of cursor as any) {
    usersScanned += 1;
    const has = user?.dailyPrompt && typeof user.dailyPrompt.text === 'string' && user.dailyPrompt.text.length > 0;
    if (has) continue;
    const userId = new mongoose.Types.ObjectId(String(user._id));
    const text = deterministicFallback(userId.toHexString(), now);
    const res = await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          "dailyPrompt.text": text,
          "dailyPrompt.updatedAt": now,
          "dailyPrompt.promptVersion": 1,
        },
      }
    ).exec();
    if (res.modifiedCount > 0 || res.matchedCount > 0) promptsSet += 1;
  }

  return { usersScanned, promptsSet };
}