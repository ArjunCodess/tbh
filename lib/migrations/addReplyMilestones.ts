import connectToDatabase from '../connectToDatabase';
import UserModel from '../models/user.schema';
import MessageModel from '../models/message.schema';

// IMPORTANT: idempotent migration. safe to re-run.
export async function addReplyMilestones(): Promise<{
  usersProcessed: number;
  usersUpdated: number;
}> {
  await connectToDatabase();

  let usersProcessed = 0;
  let usersUpdated = 0;

  // Get all users
  const users = await UserModel.find({});
  
  for (const user of users) {
    usersProcessed++;
    
    // Count replied messages for this user
    const repliedCount = await MessageModel.countDocuments({
      userId: user._id,
      isReplied: true
    });
    
    // Update user's replyCount if it's different from the current count
    if (user.replyCount !== repliedCount) {
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { replyCount: repliedCount } }
      );
      usersUpdated++;
    }
  }

  return { usersProcessed, usersUpdated };
}