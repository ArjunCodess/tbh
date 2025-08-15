import mongoose from "mongoose";
import connectToDatabase from "../connectToDatabase";
import UserModel from "../models/user.schema";
import ThreadModel from "../models/thread.schema";

// IMPORTANT: idempotent migration. safe to re-run.
export async function backfillDefaultThreadsAndAssign(): Promise<{
  usersProcessed: number;
  threadsCreated: number;
  messagesUpdated: number;
}> {
  await connectToDatabase();

  let usersProcessed = 0;
  let threadsCreated = 0;
  let messagesUpdated = 0;

  const cursor = UserModel.find({}, { _id: 1, messages: 1 }).cursor();
  for await (const user of cursor as any) {
    usersProcessed += 1;

    // find or create default thread
    let thread = await ThreadModel.findOne({ userId: user._id, slug: "ama" });
    if (!thread) {
      thread = await ThreadModel.create({
        userId: user._id,
        title: "ask me anything",
        slug: "ama",
      });
      threadsCreated += 1;
    }

    const defaultThreadId = thread._id as mongoose.Types.ObjectId;

    // assign threadId to any embedded messages missing threadId (if embedded)
    // note: current schema embeds messages in user. we update in-memory then save.
    let updated = 0;
    if (Array.isArray(user.messages)) {
      for (const msg of user.messages) {
        if (!(msg as any).threadId) {
          (msg as any).threadId = defaultThreadId;
          updated += 1;
        }
      }
    }
    if (updated > 0) {
      await user.save();
      messagesUpdated += updated;
    }
  }

  return { usersProcessed, threadsCreated, messagesUpdated };
}