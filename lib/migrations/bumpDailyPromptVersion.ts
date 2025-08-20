import connectToDatabase from "../connectToDatabase";
import UserModel from "../models/user.schema";

// IMPORTANT: idempotent migration; safe to re-run
// increments dailyPrompt.promptVersion by 1 for users currently at 2
export async function bumpDailyPromptVersionOnce(): Promise<{
  matched: number;
  modified: number;
}> {
  await connectToDatabase();

  const res = await UserModel.updateMany(
    { "dailyPrompt.promptVersion": 2 },
    { $inc: { "dailyPrompt.promptVersion": 1 } }
  ).exec();

  return {
    matched: (res as any).matchedCount ?? 0,
    modified: (res as any).modifiedCount ?? 0,
  };
}