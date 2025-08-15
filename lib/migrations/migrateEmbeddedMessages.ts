import mongoose from 'mongoose';
import connectToDatabase from '../connectToDatabase';
import UserModel from '../models/user.schema';
import ThreadModel from '../models/thread.schema';
import MessageModel from '../models/message.schema';

type MigrationReport = {
  usersScanned: number;
  defaultThreadsCreated: number;
  embeddedMessagesFound: number;
  messagesInsertedOrUpserted: number;
  usersClearedEmbeddedMessages: number;
  userIndexDropped: boolean;
};

/**
 * Migrates embedded user.messages into the standalone Message collection.
 * - Ensures a default 'ama' thread per user when needed
 * - Assigns missing threadId to embedded messages using the default thread
 * - Upserts into Message collection keyed by (userId, threadId, content, createdAt)
 * - Optionally clears embedded messages after migration (default: true)
 * - Drops obsolete user index on nested messages if it exists
 */
export async function migrateEmbeddedMessages({
  clearEmbeddedAfter = true,
}: { clearEmbeddedAfter?: boolean } = {}): Promise<MigrationReport> {
  await connectToDatabase();

  let usersScanned = 0;
  let defaultThreadsCreated = 0;
  let embeddedMessagesFound = 0;
  let messagesInsertedOrUpserted = 0;
  let usersClearedEmbeddedMessages = 0;
  let userIndexDropped = false;

  // Drop obsolete nested index if present
  try {
    const indexes = await UserModel.collection.indexes();
    const nestedIdx = indexes.find((i: any) => String(i.name).includes('messages.createdAt'));
    if (nestedIdx) {
      await UserModel.collection.dropIndex(nestedIdx.name || "");
      userIndexDropped = true;
    }
  } catch {
    // ignore if cannot list or drop
  }

  const cursor = UserModel.find({}, { _id: 1, messages: 1 }).lean().cursor();
  for await (const user of cursor as any) {
    usersScanned += 1;
    const userId = new mongoose.Types.ObjectId(user._id);

    const embedded: any[] = Array.isArray(user?.messages) ? user.messages : [];
    if (embedded.length === 0) continue;
    embeddedMessagesFound += embedded.length;

    // Ensure default AMA thread exists
    let defaultThread = await ThreadModel.findOne({ userId, slug: 'ama' }, { _id: 1 }).lean();
    if (!defaultThread) {
      const created = await ThreadModel.create({ userId, title: 'ask me anything', slug: 'ama' });
      defaultThread = { _id: created._id } as any;
      defaultThreadsCreated += 1;
    }
    const defaultThreadId = new mongoose.Types.ObjectId(defaultThread?._id as any);

    // Prepare upserts (use raw collection to avoid Mongoose timestamps injection)
    const ops = embedded.map((msg: any) => {
      const createdAt = msg?.createdAt ? new Date(msg.createdAt) : new Date();
      const threadId = msg?.threadId ? new mongoose.Types.ObjectId(msg.threadId) : defaultThreadId;
      const content = String(msg?.content || '');

      const filter = { userId, threadId, content, createdAt };
      const setOnInsert = { userId, threadId, content, createdAt, updatedAt: createdAt };
      return { updateOne: { filter, update: { $setOnInsert: setOnInsert }, upsert: true } };
    });

    let totalCoveredForUser = 0;
    if (ops.length > 0) {
      const res = await MessageModel.collection.bulkWrite(ops as any, { ordered: false });
      const upserts = (res as any).upsertedCount || 0;
      const modified = (res as any).modifiedCount || 0; // not expected with $setOnInsert
      const matched = (res as any).matchedCount || 0; // already-existing docs matching filter
      totalCoveredForUser = upserts + matched;
      messagesInsertedOrUpserted += upserts + modified;
    }

    // Only clear embedded messages if every embedded message has a corresponding doc
    if (clearEmbeddedAfter) {
      if (totalCoveredForUser >= embedded.length) {
        await UserModel.updateOne({ _id: userId }, { $unset: { messages: '' } }).exec();
        usersClearedEmbeddedMessages += 1;
      } else {
        // Keep embedded messages to avoid data loss; log a warning for manual review
        // eslint-disable-next-line no-console
        console.warn(
          `[migrateEmbeddedMessages] Skipping clear for user ${userId.toHexString()} - covered=${totalCoveredForUser} < embedded=${embedded.length}`
        );
      }
    }
  }

  return {
    usersScanned,
    defaultThreadsCreated,
    embeddedMessagesFound,
    messagesInsertedOrUpserted,
    usersClearedEmbeddedMessages,
    userIndexDropped,
  };
}


