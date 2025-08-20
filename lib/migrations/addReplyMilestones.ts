import connectToDatabase from '../connectToDatabase';
import UserModel from '../models/user.schema';
import MessageModel from '../models/message.schema';

// IMPORTANT: idempotent migration. safe to re-run.
export async function addReplyMilestones(): Promise<{
  usersProcessed: number;
  usersUpdated: number;
  totalMessagesUpdated: number;
}> {
  await connectToDatabase();

  let usersProcessed = 0;
  let usersUpdated = 0;
  let totalMessagesUpdated = 0;

  // Get all users
  const users = await UserModel.find({});
  
  for (const user of users) {
    usersProcessed++;
    
    // Count replied messages for this user
    const repliedCount = await MessageModel.countDocuments({
      userId: user._id,
      isReplied: true
    });
    
    // Count total messages received by this user
    const totalMessages = await MessageModel.countDocuments({
      userId: user._id
    });
    
    // Update user's replyCount and totalMessagesReceived if they're different from the current counts
    if (user.replyCount !== repliedCount || user.totalMessagesReceived !== totalMessages) {
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { 
            replyCount: repliedCount,
            totalMessagesReceived: totalMessages 
          } 
        }
      );
      usersUpdated++;
      
      if (user.totalMessagesReceived !== totalMessages) {
        totalMessagesUpdated++;
      }
    }
  }

  return { usersProcessed, usersUpdated, totalMessagesUpdated };
}