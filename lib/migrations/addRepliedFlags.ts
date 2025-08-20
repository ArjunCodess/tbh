import mongoose from 'mongoose';
import connectToDatabase from '@/lib/connectToDatabase';
import MessageModel from '@/lib/models/message.schema';

export async function addRepliedFlags() {
  await connectToDatabase();

  // ensure indexes exist (mongoose will also ensure on model init, but we make it explicit)
  await Promise.all([
    MessageModel.collection.createIndex({ userId: 1, isReplied: 1, createdAt: -1 }).catch(() => {}),
    MessageModel.collection.createIndex({ threadId: 1, isReplied: 1, createdAt: -1 }).catch(() => {}),
  ]);

  const msgRes = await MessageModel.updateMany(
    { isReplied: { $exists: false } },
    { $set: { isReplied: false } }
  );
  return { messagesUpdated: msgRes.modifiedCount };
}

if (require.main === module) {
  (async () => {
    try {
      const res = await addRepliedFlags();
      // eslint-disable-next-line no-console
      console.log('addRepliedFlags result:', res);
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Migration failed', err);
      process.exit(1);
    }
  })();
}